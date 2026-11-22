import { db } from "@/server/db";

export interface DiscordRoleTargetParticipant {
  participantId: string;
  nickname: string;
  userName: string | null;
  playerNumber: number | null;
  discordId: string | null;
}

export interface DiscordRoleTargetGroup {
  id: string;
  name: string;
  color: string | null;
  displayOrder: number;
  roleId: string | null;
  participants: DiscordRoleTargetParticipant[];
}

export interface DiscordRoleGroupInput {
  name: string;
  roleId: string;
}

export interface DiscordRoleTargets {
  groups: DiscordRoleTargetGroup[];
  totalParticipants: number;
  withDiscordId: number;
}

export const discordRoleRepository = {
  /**
   * Real (non-rotational) groups of a tournament with their participants and
   * the Discord account linked to each participant. Rotational groups mirror
   * existing groups, so including them would assign conflicting roles.
   */
  async getTournamentRoleTargets(
    tournamentId: string,
  ): Promise<DiscordRoleTargets> {
    const [groups, roleGroups] = await Promise.all([
      db.tournamentGroup.findMany({
        where: { tournamentId, isRotational: false },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          color: true,
          displayOrder: true,
          TournamentGroupParticipant: {
            orderBy: { displayOrder: "asc" },
            select: {
              tournamentParticipant: {
                select: {
                  id: true,
                  nickname: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      playerNumber: true,
                      accounts: {
                        where: { provider: "discord" },
                        select: { providerAccountId: true },
                        orderBy: { id: "asc" },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.discordRoleGroup.findMany({ select: { name: true, roleId: true } }),
    ]);

    const roleIdByName = new Map(
      roleGroups.map((group) => [group.name, group.roleId]),
    );

    const targetGroups = groups
      .map((group) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        displayOrder: group.displayOrder,
        roleId: roleIdByName.get(group.name) ?? null,
        participants: group.TournamentGroupParticipant.map(
          ({ tournamentParticipant }) => ({
            participantId: tournamentParticipant.id,
            nickname: tournamentParticipant.nickname,
            userName: tournamentParticipant.user?.name ?? null,
            playerNumber: tournamentParticipant.user?.playerNumber ?? null,
            discordId:
              tournamentParticipant.user?.accounts[0]?.providerAccountId ??
              null,
          }),
        ),
      }))
      .filter((group) => group.participants.length > 0);

    const participants = targetGroups.flatMap((group) => group.participants);

    return {
      groups: targetGroups,
      totalParticipants: participants.length,
      withDiscordId: participants.filter((p) => p.discordId !== null).length,
    };
  },

  async listRoleGroups() {
    return db.discordRoleGroup.findMany({ orderBy: { name: "asc" } });
  },

  async getRoleGroupByName(name: string) {
    return db.discordRoleGroup.findUnique({ where: { name } });
  },

  async getRoleGroupById(id: string) {
    return db.discordRoleGroup.findUnique({ where: { id } });
  },

  async createRoleGroup(data: DiscordRoleGroupInput) {
    return db.discordRoleGroup.create({ data });
  },

  async updateRoleGroup(id: string, data: DiscordRoleGroupInput) {
    return db.discordRoleGroup.update({ where: { id }, data });
  },

  async deleteRoleGroup(id: string) {
    return db.discordRoleGroup.delete({ where: { id } });
  },
};
