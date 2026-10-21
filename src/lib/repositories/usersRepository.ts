import { getAchievedRanks } from "@/lib/helpers/tournament-rank";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { db } from "@/server/db";
import { type Prisma } from "@prisma/client";

/**
 * The in-tournament display name is stored per participant
 * (`TournamentParticipant.nickname`), so a rename must be pushed to every
 * tournament the user takes part in
 */
async function propagateUserDisplayName(
  tx: Prisma.TransactionClient,
  userId: string,
  name: string,
) {
  const participants = await tx.tournamentParticipant.findMany({
    where: { userId },
    select: { id: true, tournamentId: true },
  });

  for (const participant of participants) {
    const others = await tx.tournamentParticipant.findMany({
      where: {
        tournamentId: participant.tournamentId,
        NOT: { id: participant.id },
      },
      select: { nickname: true },
    });
    const taken = new Set(others.map((p) => p.nickname));

    let nickname = name;
    let suffix = 1;
    while (taken.has(nickname)) {
      suffix += 1;
      nickname = `${name} #${suffix}`;
    }

    await tx.tournamentParticipant.update({
      where: { id: participant.id },
      data: { nickname },
    });
  }
}

export const usersRepository = {
  async getUsers() {
    return db.user.findMany({
      select: {
        id: true,
        playerNumber: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        color: true,
        adminComment: true,
        aoe2companionUrl: true,
        rating: true,
        ratingUpdatedAt: true,
        streamUrl: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            userRoles: true,
            TournamentParticipant: true,
            userStreams: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Users that linked a stream, used to detect live streamers.
   */
  async getUsersWithStreamUrl() {
    return db.user.findMany({
      where: { streamUrl: { not: null } },
      select: {
        playerNumber: true,
        name: true,
        streamUrl: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async getUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  },

  async getPublicProfile(playerNumber: number) {
    const user = await db.user.findUnique({
      where: { playerNumber },
      select: {
        id: true,
        playerNumber: true,
        name: true,
        aoe2companionUrl: true,
        streamUrl: true,
        adminComment: true,
        userRoles: {
          select: {
            id: true,
            assignedAt: true,
            expiresAt: true,
            role: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        TournamentParticipant: {
          select: {
            id: true,
            nickname: true,
            registrationDate: true,
            status: true,
            teamId: true,
            TournamentGroupParticipant: {
              select: {
                tournamentGroup: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    isRotational: true,
                  },
                },
              },
            },
            tournament: {
              select: {
                id: true,
                name: true,
                urlKey: true,
                status: true,
                format: true,
                tournamentSeries: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { tournament: { startDate: "desc" } },
        },
      },
    });

    if (!user) return null;

    const participantIds = user.TournamentParticipant.map((p) => p.id);
    const teamIds = user.TournamentParticipant.map((p) => p.teamId).filter(
      (id): id is string => Boolean(id),
    );

    const [upcomingMatches, ranks] = await Promise.all([
      tournamentMatchRepository.getUpcomingMatchesForUser(
        participantIds,
        teamIds,
      ),
      getAchievedRanks(
        user.TournamentParticipant.map((p) => ({
          participantId: p.id,
          tournamentId: p.tournament.id,
          tournamentStatus: p.tournament.status,
          tournamentFormat: p.tournament.format,
          teamId: p.teamId,
          // Rotational groups are derived groupings that mirror the real
          // groups they link, so they must not influence the achieved rank -
          // otherwise a player would inherit the (often better) placement from
          // a rotation group instead of their actual group.
          groupIds: p.TournamentGroupParticipant.filter(
            (gp) => !gp.tournamentGroup.isRotational,
          ).map((gp) => gp.tournamentGroup.id),
        })),
      ),
    ]);

    const TournamentParticipant = user.TournamentParticipant.map((p) => ({
      ...p,
      rank: ranks.get(p.id) ?? null,
    }));

    return { ...user, TournamentParticipant, upcomingMatches };
  },

  async getUserWithDetails(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userStreams: {
          include: {
            platform: true,
          },
        },
        TournamentParticipant: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
          orderBy: {
            registrationDate: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            TournamentParticipant: true,
            userRoles: true,
            userStreams: true,
          },
        },
      },
    });
  },

  async updateOwnAoe2CompanionUrl(userId: string, url: string | null) {
    return db.user.update({
      where: { id: userId },
      // The cached rating belongs to the previous profile, so drop it and let
      // the next refresh fetch the new one.
      data: {
        aoe2companionUrl: url,
        rating: null,
        ratingUpdatedAt: null,
      },
      select: { id: true, aoe2companionUrl: true },
    });
  },

  async updateOwnStreamUrl(userId: string, url: string | null) {
    return db.user.update({
      where: { id: userId },
      data: { streamUrl: url },
      select: { id: true, streamUrl: true },
    });
  },

  /**
   * Updates the user's own global display name and keeps their in-tournament
   * display names in sync (see `propagateUserDisplayName`).
   */
  async updateOwnName(userId: string, name: string) {
    return db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { name },
        select: { id: true, name: true },
      });

      await propagateUserDisplayName(tx, userId, name);

      return user;
    });
  },

  async updateAdminNote(userId: string, note: string | null) {
    return db.user.update({
      where: { id: userId },
      data: { adminComment: note },
      select: { id: true, adminComment: true },
    });
  },

  async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      color?: string;
      adminComment?: string;
      roleIds?: string[];
    },
    currentUserId?: string,
  ) {
    // Handle roles update separately if provided
    if (data.roleIds !== undefined) {
      return db.$transaction(async (tx) => {
        // Update user basic info
        const updatedUser = await tx.user.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            color: data.color,
            adminComment: data.adminComment,
          },
        });

        // Keep the user's in-tournament display names in sync with the new name.
        if (data.name !== undefined) {
          await propagateUserDisplayName(tx, id, data.name);
        }

        // Get current roles
        const currentRoles = await tx.userRole.findMany({
          where: { userId: id },
          select: { roleId: true },
        });
        const currentRoleIds = currentRoles.map((ur) => ur.roleId);

        // Calculate roles to add and remove
        const newRoleIds = data.roleIds ?? [];
        const rolesToAdd = newRoleIds.filter(
          (roleId) => !currentRoleIds.includes(roleId),
        );
        const rolesToRemove = currentRoleIds.filter(
          (roleId) => !newRoleIds.includes(roleId),
        );

        // If currentUserId is provided, validate permissions for role changes
        if (
          currentUserId &&
          (rolesToAdd.length > 0 || rolesToRemove.length > 0)
        ) {
          // Check if current user is admin
          const currentUserRoles = await tx.userRole.findMany({
            where: { userId: currentUserId },
            include: { role: true },
          });
          const hasAdminRole = currentUserRoles.some(
            (ur) => ur.role.type === "ADMIN",
          );

          if (!hasAdminRole) {
            // For non-admin users, check if all roles being added/removed are modAssignable
            const affectedRoleIds = [...rolesToAdd, ...rolesToRemove];
            const affectedRoles = await tx.role.findMany({
              where: { id: { in: affectedRoleIds } },
            });

            const nonModAssignableRoles = affectedRoles.filter(
              (role) => !role.modAssignable,
            );
            if (nonModAssignableRoles.length > 0) {
              throw new Error(
                `You don't have permission to modify these roles: ${nonModAssignableRoles.map((r) => r.name).join(", ")}`,
              );
            }
          }
        }

        // Remove roles
        if (rolesToRemove.length > 0) {
          await tx.userRole.deleteMany({
            where: {
              userId: id,
              roleId: { in: rolesToRemove },
            },
          });
        }

        // Add new roles
        if (rolesToAdd.length > 0) {
          await tx.userRole.createMany({
            data: rolesToAdd.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }

        return updatedUser;
      });
    }

    // Regular update without roles
    return db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data,
      });

      if (data.name !== undefined) {
        await propagateUserDisplayName(tx, id, data.name);
      }

      return updatedUser;
    });
  },

  async deleteUser(id: string) {
    // Check if user has any tournament participations
    const participationCount = await db.tournamentParticipant.count({
      where: { userId: id },
    });

    if (participationCount > 0) {
      throw new Error(
        `Cannot delete user. They have participated in ${participationCount} tournament(s).`,
      );
    }

    return db.user.delete({
      where: { id },
    });
  },

  async getUserUsageCount(id: string) {
    const counts = await db.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            TournamentParticipant: true,
            userRoles: true,
            userStreams: true,
          },
        },
      },
    });

    return (
      (counts?._count.TournamentParticipant ?? 0) +
      (counts?._count.userRoles ?? 0) +
      (counts?._count.userStreams ?? 0)
    );
  },

  async isUserAdmin(userId: string) {
    const adminRole = await db.userRole.findFirst({
      where: { userId, role: { type: "ADMIN" } },
      select: { userId: true },
    });
    return adminRole !== null;
  },

  async isUserStreamer(userId: string) {
    const streamerRole = await db.userRole.findFirst({
      where: { userId, role: { type: "STREAMER" } },
      select: { userId: true },
    });
    return streamerRole !== null;
  },

  async isUserPatron(userId: string) {
    const patronRole = await db.userRole.findFirst({
      where: { userId, role: { type: "PATRON" } },
      select: { userId: true },
    });
    return patronRole !== null;
  },

  /**
   * Player numbers of every user holding the PATRON role, so player names can
   * be decorated with the patron emblem without one query per name.
   */
  async getPatronPlayerNumbers() {
    const patrons = await db.user.findMany({
      where: { userRoles: { some: { role: { type: "PATRON" } } } },
      select: { playerNumber: true },
    });
    return patrons.map((patron) => patron.playerNumber);
  },

  async getUserStreamUrl(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { streamUrl: true },
    });
    return user?.streamUrl ?? null;
  },

  async getAoe2CompanionUrl(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { aoe2companionUrl: true },
    });
    return user?.aoe2companionUrl ?? null;
  },
};
