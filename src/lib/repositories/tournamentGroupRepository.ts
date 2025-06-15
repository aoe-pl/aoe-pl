import { db } from "@/server/db";
import {
  generateNewMatches,
  getMatchesToDelete,
  getMatchesToCreate,
} from "@/lib/tournaments/match-generation/individual-group-matches";

export type TournamentGroupCreateData = {
  name: string;
  description?: string;
  matchModeId?: string;
  displayOrder?: number;
  isTeamBased?: boolean;
  participantIds?: string[];
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
    const participantsIds = data.participantIds?.map((id) => ({
      tournamentParticipantId: id,
    }));

    // Get all participants to generate matches
    const participants = data.participantIds
      ? await db.tournamentParticipant.findMany({
          where: {
            id: {
              in: data.participantIds,
            },
          },
        })
      : [];

    // Generate initial matches
    const newMatches = generateNewMatches(participants, []);

    // First create the group
    const group = await db.tournamentGroup.create({
      data: {
        name: data.name,
        description: data.description,
        matchMode: data.matchModeId
          ? { connect: { id: data.matchModeId } }
          : undefined,
        displayOrder: data.displayOrder ?? 0,
        isTeamBased: data.isTeamBased,
        stage: { connect: { id: stageId } },
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

    // Then create matches if there are any
    if (newMatches.length > 0) {
      await db.tournamentMatch.createMany({
        data: newMatches.map((match) => ({
          groupId: group.id,
          status: match.status,
          civDraftKey: match.civDraftKey,
          mapDraftKey: match.mapDraftKey,
        })),
      });

      // Get created matches to add participants
      const createdMatches = await db.tournamentMatch.findMany({
        where: { groupId: group.id },
      });

      // Add participants to matches
      for (let i = 0; i < createdMatches.length; i++) {
        const match = createdMatches[i];
        const matchData = newMatches[i];
        if (!match || !matchData) continue;

        await db.tournamentMatchParticipant.createMany({
          data: [
            {
              matchId: match.id,
              participantId: matchData.participant1Id,
              isWinner: false,
            },
            {
              matchId: match.id,
              participantId: matchData.participant2Id,
              isWinner: false,
            },
          ],
        });
      }
    }

    return group;
  },

  async updateTournamentGroup(id: string, data: TournamentGroupUpdateData) {
    const participantsIds = data.participantIds?.map((id) => ({
      tournamentParticipantId: id,
    }));

    // Get current group with matches and participants
    const currentGroup = await db.tournamentGroup.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            TournamentMatchParticipant: true,
          },
        },
        TournamentGroupParticipant: {
          include: {
            tournamentParticipant: true,
          },
        },
      },
    });

    if (!currentGroup) {
      throw new Error("Tournament group not found");
    }

    // Get current participant IDs
    const currentParticipantIds = currentGroup.TournamentGroupParticipant.map(
      (p) => p.tournamentParticipantId,
    );

    // Get new participant IDs
    const newParticipantIds = data.participantIds ?? currentParticipantIds;

    const currentMatches = currentGroup.matches.map((match) => ({
      id: match.id,
      participant1Id: match.TournamentMatchParticipant[0]?.participantId ?? "",
      participant2Id: match.TournamentMatchParticipant[1]?.participantId ?? "",
    }));

    // Get matches to delete (where either participant was removed)
    const matchesToDelete = getMatchesToDelete(
      currentMatches,
      newParticipantIds,
    );

    // Get all participants for new matches
    const allParticipants = await db.tournamentParticipant.findMany({
      where: {
        id: {
          in: newParticipantIds,
        },
      },
    });

    // Get matches to create
    const matchesToCreate = getMatchesToCreate(currentMatches, allParticipants);

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
        matches: {
          // Delete matches where participants were removed
          deleteMany: {
            id: {
              in: matchesToDelete.map((match) => match.id),
            },
          },
          // Create new matches for new participant combinations
          create: matchesToCreate.map((match) => ({
            status: match.status,
            civDraftKey: match.civDraftKey,
            mapDraftKey: match.mapDraftKey,
            TournamentMatchParticipant: {
              create: [
                { participantId: match.participant1Id, isWinner: false },
                { participantId: match.participant2Id, isWinner: false },
              ],
            },
          })),
        },
      },
    });
  },

  async deleteTournamentGroup(id: string) {
    return db.tournamentGroup.delete({ where: { id } });
  },
};
