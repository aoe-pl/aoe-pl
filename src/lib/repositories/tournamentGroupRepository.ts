import { db } from "@/server/db";
import {
  generateNewMatches,
  getMatchesToDelete,
  getMatchesToCreate,
} from "@/lib/tournaments/match-generation/group-matches";

export type TournamentGroupCreateData = {
  name: string;
  description?: string;
  matchModeId?: string;
  displayOrder?: number;
  isTeamBased?: boolean;
  isMixed?: boolean;
  participantIds?: string[];
};

export type TournamentGroupUpdateData = Partial<TournamentGroupCreateData>;

export const tournamentGroupRepository = {
  async getTournamentGroupById(id: string) {
    return db.tournamentGroup.findUnique({
      where: { id },
      include: {
        matchMode: true,
        TournamentGroupParticipant: {
          include: {
            tournamentParticipant: true,
          },
        },
        matches: {
          include: {
            TournamentMatchParticipant: {
              include: {
                participant: true,
                match: true,
                team: true,
              },
            },
            Game: true,
          },
        },
        stage: {
          include: {
            tournament: {
              include: {
                matchMode: true,
              },
            },
          },
        },
      },
    });
  },
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

    return db.$transaction(async (tx) => {
      // Create the group
      const group = await tx.tournamentGroup.create({
        data: {
          name: data.name,
          description: data.description,
          matchMode: data.matchModeId
            ? { connect: { id: data.matchModeId } }
            : undefined,
          displayOrder: data.displayOrder ?? 0,
          isTeamBased: data.isTeamBased,
          isMixed: data.isMixed,
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

      const tournament = await tx.tournament.findUnique({
        where: { id: stageId },
      });

      // we are not support team based registration yet
      // and for individual registration -> team based we can't generate matches
      // because we don't know the teams yet, admin need to create them manually
      if (data.isTeamBased || tournament?.isTeamBased) {
        return group;
      }

      const newMatches = generateNewMatches(participants, []);

      if (newMatches.length === 0) {
        return group;
      }

      // Create matches
      await tx.tournamentMatch.createMany({
        data: newMatches.map((match) => ({
          groupId: group.id,
          status: match.status,
          civDraftKey: match.civDraftKey,
          mapDraftKey: match.mapDraftKey,
        })),
      });

      // Get created matches to add participants
      const matches = await tx.tournamentMatch.findMany({
        where: { groupId: group.id },
      });

      // Add participants to matches
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchData = newMatches[i];
        if (!match || !matchData) continue;

        await tx.tournamentMatchParticipant.createMany({
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

      return group;
    });
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

    const tournament = await db.tournament.findUnique({
      where: { id: currentGroup.stageId },
    });

    const isTeamBased = data.isTeamBased ?? tournament?.isTeamBased;

    // if we change from individual -> tournament based, we need to remove all matches
    if (isTeamBased) {
      await db.tournamentMatch.deleteMany({
        where: { groupId: id },
      });
    }

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
        isMixed: data.isMixed,
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
        // we are not support team based registration yet
        // and for individual registration -> team based we can't generate matches
        // because we don't know the teams yet, admin need to create them manually
        matches: isTeamBased
          ? undefined
          : {
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
};
