import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { MatchStatus } from "@prisma/client";

/**
 * Groups plus their participants.
 */
const groupsWithParticipantsInclude = {
  matchMode: true,
  translations: true,
  TournamentGroupParticipant: {
    include: {
      tournamentParticipant: {
        include: {
          user: true,
          team: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentGroupInclude;

export type TournamentGroupWithParticipants = Prisma.TournamentGroupGetPayload<{
  include: typeof groupsWithParticipantsInclude;
}>;

export type TournamentGroupTranslationInput = {
  locale: string;
  description?: string;
};

export type TournamentGroupCreateData = {
  name: string;
  translations?: TournamentGroupTranslationInput[];
  matchModeId?: string;
  displayOrder?: number;
  isTeamBased?: boolean;
  isMixed?: boolean;
  isRotational?: boolean;
  color?: string;
  civDraftPresetUrl?: string;
  mapDraftPresetUrl?: string;
  participantIds?: string[];
};

export type TournamentGroupUpdateData = Partial<TournamentGroupCreateData>;

export const tournamentGroupRepository = {
  async getTournamentGroupById(id: string) {
    return db.tournamentGroup.findUnique({
      where: { id },
      include: {
        matchMode: true,
        translations: true,
        TournamentGroupParticipant: {
          include: {
            tournamentParticipant: {
              include: {
                user: true,
              },
            },
          },
        },
        matches: {
          include: {
            TournamentMatchParticipant: {
              include: {
                participant: {
                  include: {
                    user: true,
                    team: true,
                  },
                },
                match: true,
                team: {
                  include: {
                    TournamentParticipant: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
            Game: true,
          },
        },
        tournament: {
          include: {
            matchMode: true,
            tournamentSeries: true,
          },
        },
      },
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
        tournamentId,
      },
      include: {
        tournament: true,
        matchMode: options?.includeMatchMode,
        translations: true,
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

  /**
   * All groups of a tournament with their participants.
   */
  async getGroupsWithParticipantsByTournamentId(
    tournamentId: string,
  ): Promise<TournamentGroupWithParticipants[]> {
    return db.tournamentGroup.findMany({
      where: { tournamentId },
      include: groupsWithParticipantsInclude,
      orderBy: { displayOrder: "asc" },
    });
  },

  async createTournamentGroup(
    tournamentId: string,
    data: TournamentGroupCreateData,
  ) {
    const participantsIds = data.participantIds?.map((id) => ({
      tournamentParticipantId: id,
    }));

    // Matches are intentionally not generated here: admins add them explicitly
    // (including in bulk) so that deleting a match is permanent and editing the
    // roster never recreates matches.
    return db.tournamentGroup.create({
      data: {
        name: data.name,
        matchMode: data.matchModeId
          ? { connect: { id: data.matchModeId } }
          : undefined,
        displayOrder: data.displayOrder ?? 0,
        isTeamBased: data.isTeamBased,
        isMixed: data.isMixed,
        isRotational: data.isRotational ?? false,
        color: data.color,
        civDraftPresetUrl: data.civDraftPresetUrl,
        mapDraftPresetUrl: data.mapDraftPresetUrl,
        tournament: { connect: { id: tournamentId } },
        translations: data.translations?.length
          ? {
              create: data.translations.map(({ locale, description }) => ({
                locale,
                description: description?.trim() ?? null,
              })),
            }
          : undefined,
        TournamentGroupParticipant:
          participantsIds && participantsIds.length > 0
            ? {
                create: participantsIds.map((p) => ({
                  tournamentParticipant: {
                    connect: { id: p.tournamentParticipantId },
                  },
                  displayOrder: 0,
                })),
              }
            : undefined,
      },
    });
  },

  async updateTournamentGroup(id: string, data: TournamentGroupUpdateData) {
    const participantsIds = data.participantIds?.map((id) => ({
      tournamentParticipantId: id,
    }));

    const currentGroup = await db.tournamentGroup.findUnique({
      where: { id },
      include: {
        TournamentGroupParticipant: true,
      },
    });

    if (!currentGroup) {
      throw new Error("Tournament group not found");
    }

    // Roster changes never create matches, so manually deleted matches stay
    // deleted. Removed players are cleaned up from the group's matches.
    return db.$transaction(async (tx) => {
      if (data.participantIds) {
        const newParticipantIds = data.participantIds;
        const removedParticipantIds =
          currentGroup.TournamentGroupParticipant.map(
            (p) => p.tournamentParticipantId,
          ).filter(
            (participantId) => !newParticipantIds.includes(participantId),
          );

        if (removedParticipantIds.length > 0) {
          await tx.tournamentMatch.deleteMany({
            where: {
              groupId: id,
              TournamentMatchParticipant: {
                some: { participantId: { in: removedParticipantIds } },
              },
            },
          });
        }
      }

      return tx.tournamentGroup.update({
        where: { id },
        data: {
          name: data.name,
          matchMode: data.matchModeId
            ? { connect: { id: data.matchModeId } }
            : undefined,
          displayOrder: data.displayOrder,
          isTeamBased: data.isTeamBased,
          isMixed: data.isMixed,
          isRotational: data.isRotational,
          color: data.color,
          civDraftPresetUrl: data.civDraftPresetUrl,
          mapDraftPresetUrl: data.mapDraftPresetUrl,
          translations: data.translations?.length
            ? {
                upsert: data.translations.map(({ locale, description }) => ({
                  where: { groupId_locale: { groupId: id, locale } },
                  create: {
                    locale,
                    description: description?.trim() ?? null,
                  },
                  update: { description: description?.trim() ?? null },
                })),
              }
            : undefined,
          TournamentGroupParticipant: participantsIds
            ? {
                // Delete all participants that are not in the new list
                deleteMany: {
                  NOT: {
                    tournamentParticipantId: {
                      in: participantsIds.map((p) => p.tournamentParticipantId),
                    },
                  },
                },
                // Upsert the participants that are in the new list
                upsert: participantsIds.map((p) => ({
                  where: {
                    tournamentGroupId_tournamentParticipantId: {
                      tournamentGroupId: id,
                      tournamentParticipantId: p.tournamentParticipantId,
                    },
                  },
                  create: {
                    tournamentParticipant: {
                      connect: { id: p.tournamentParticipantId },
                    },
                    displayOrder: 0,
                  },
                  update: {},
                })),
              }
            : undefined,
        },
      });
    });
  },

  async deleteTournamentGroup(id: string) {
    return db.tournamentGroup.delete({ where: { id } });
  },

  async reorderGroups(updates: { id: string; displayOrder: number }[]) {
    return db.$transaction(
      updates.map(({ id, displayOrder }) =>
        db.tournamentGroup.update({ where: { id }, data: { displayOrder } }),
      ),
    );
  },

  async getGroupParticipants(groupId: string) {
    const group = await db.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        TournamentGroupParticipant: {
          include: {
            tournamentParticipant: {
              include: {
                user: true,
                team: true,
              },
            },
          },
        },
      },
    });

    return (
      group?.TournamentGroupParticipant.map((gp) => gp.tournamentParticipant) ??
      []
    );
  },

  async getParticipantScores(groupId: string) {
    // Get all matches in the group with their match participants
    const matches = await db.tournamentMatch.findMany({
      where: { groupId },
      include: {
        TournamentMatchParticipant: {
          include: {
            participant: true,
          },
        },
        Game: {
          include: {
            participants: {
              include: {
                matchParticipant: true,
              },
            },
          },
        },
      },
    });

    // Initialize scores object
    const scores: Record<string, { won: number; lost: number }> = {};

    const onlyApprovedMatches = matches.filter(
      (match) => match.status === MatchStatus.ADMIN_APPROVED,
    );

    // Process each match
    for (const match of onlyApprovedMatches) {
      // First, add scores from match participants (direct scores)
      for (const matchParticipant of match.TournamentMatchParticipant) {
        if (matchParticipant.participantId) {
          const participantId = matchParticipant.participantId;

          // Initialize participant scores if not exists
          scores[participantId] ??= { won: 0, lost: 0 };

          // Add won and lost scores from match participant
          scores[participantId].won += matchParticipant.wonScore;
          scores[participantId].lost += matchParticipant.lostScore;
        }
      }
    }

    return scores;
  },
};
