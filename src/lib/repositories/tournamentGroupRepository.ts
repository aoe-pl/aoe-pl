import { db } from "@/server/db";

export type TournamentGroupCreateData = {
  name: string;
  description?: string;
  matchModeId?: string;
  displayOrder?: number;
  isTeamBased?: boolean;
};

export type TournamentGroupUpdateData = Partial<TournamentGroupCreateData>;

export const tournamentGroupRepository = {
  async getTournamentGroups(
    stageId: string,
    options?: {
      includeMatchMode?: boolean;
      includeParticipants?: boolean;
      includeMatches?: boolean;
    },
  ) {
    return db.tournamentGroup.findMany({
      where: { stageId },
      include: {
        matchMode: options?.includeMatchMode,
        TournamentGroupParticipant: options?.includeParticipants
          ? {
              include: {
                tournamentParticipant: {
                  include: {
                    user: true,
                    team: true,
                  },
                },
              },
            }
          : undefined,
        matches: options?.includeMatches,
      },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getGroupsByTournamentId(
    tournamentId: string,
    options?: {
      includeMatchMode?: boolean;
      includeParticipants?: boolean;
      includeMatches?: boolean;
    },
  ) {
    return db.tournamentGroup.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
      include: {
        stage: true,
        matchMode: options?.includeMatchMode,
        TournamentGroupParticipant: options?.includeParticipants
          ? {
              include: {
                tournamentParticipant: {
                  include: {
                    user: true,
                    team: true,
                  },
                },
              },
            }
          : undefined,
        matches: options?.includeMatches,
      },
      orderBy: [{ stage: { name: "asc" } }, { displayOrder: "asc" }],
    });
  },

  async createTournamentGroup(
    stageId: string,
    data: TournamentGroupCreateData,
  ) {
    return db.tournamentGroup.create({
      data: {
        name: data.name,
        description: data.description,
        matchMode: data.matchModeId
          ? { connect: { id: data.matchModeId } }
          : undefined,
        displayOrder: data.displayOrder ?? 0,
        isTeamBased: data.isTeamBased,
        stage: { connect: { id: stageId } },
      },
    });
  },
  async updateTournamentGroup(id: string, data: TournamentGroupUpdateData) {
    return db.tournamentGroup.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        matchMode: data.matchModeId
          ? { connect: { id: data.matchModeId } }
          : undefined,
        displayOrder: data.displayOrder,
        isTeamBased: data.isTeamBased,
      },
    });
  },
  async deleteTournamentGroup(id: string) {
    return db.tournamentGroup.delete({ where: { id } });
  },
};
