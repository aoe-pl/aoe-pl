import { db } from "@/server/db";
import type { MatchStatus } from "@prisma/client";

export type TournamentMatchCreateData = {
  groupId?: string;
  matchDate?: Date;
  civDraftKey?: string;
  mapDraftKey?: string;
  status?: MatchStatus;
  comment?: string;
  adminComment?: string;
  isManualMatch?: boolean;
  participantIds?: string[];
  teamIds?: string[];
  participantScores?: {
    participantId: string;
    score: number;
    isWinner: boolean;
  }[];
  teamScores?: { teamId: string; score: number; isWinner: boolean }[];
};

export type TournamentMatchUpdateData = Partial<TournamentMatchCreateData>;

export type GameData = {
  gameId?: string;
  mapId: string;
  participants: {
    matchParticipantId: string;
    civId?: string;
    isWinner: boolean;
  }[];
};

export const tournamentMatchRepository = {
  async getMatchParticipants(id: string) {
    return db.tournamentMatchParticipant.findMany({
      where: { matchId: id },
      include: {
        participant: {
          include: {
            user: true,
            team: true,
          },
        },
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
    });
  },

  async getTournamentMatchById(id: string) {
    return db.tournamentMatch.findUnique({
      where: { id },
      include: {
        TournamentMatchParticipant: {
          include: {
            participant: {
              include: {
                user: true,
                team: true,
              },
            },
            team: {
              include: {
                TournamentParticipant: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            gameParticipants: true,
          },
        },
        Game: {
          include: {
            map: true,
            participants: {
              include: {
                civ: true,
                matchParticipant: true,
              },
            },
          },
        },
        group: {
          include: {
            stage: {
              include: {
                tournament: true,
              },
            },
          },
        },
        TournamentMatchMode: true,
      },
    });
  },

  async getMatchesByGroupId(groupId: string) {
    return db.tournamentMatch.findMany({
      where: { groupId },
      include: {
        TournamentMatchParticipant: {
          include: {
            participant: {
              include: {
                user: true,
                team: true,
              },
            },
            team: {
              include: {
                TournamentParticipant: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            gameParticipants: true,
          },
        },
        Game: {
          include: {
            map: true,
            participants: {
              include: {
                civ: true,
                matchParticipant: true,
              },
            },
          },
        },
        TournamentMatchMode: true,
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async createTournamentMatch(data: TournamentMatchCreateData) {
    // Create participant data with scores and winners
    const participantData =
      data.participantIds?.map((id) => {
        const scoreData = data.participantScores?.find(
          (s) => s.participantId === id,
        );
        return {
          participantId: id,
          isWinner: scoreData?.isWinner ?? false,
          score: scoreData?.score ?? 0,
        };
      }) ?? [];

    const teamData =
      data.teamIds?.map((id) => {
        const scoreData = data.teamScores?.find((s) => s.teamId === id);
        return {
          teamId: id,
          isWinner: scoreData?.isWinner ?? false,
          score: scoreData?.score ?? 0,
        };
      }) ?? [];

    return db.tournamentMatch.create({
      data: {
        groupId: data.groupId,
        matchDate: data.matchDate,
        civDraftKey: data.civDraftKey ?? "",
        mapDraftKey: data.mapDraftKey ?? "",
        status: data.status ?? "SCHEDULED",
        comment: data.comment,
        adminComment: data.adminComment,
        isManualMatch: data.isManualMatch ?? false,
        TournamentMatchParticipant: {
          create: [...participantData, ...teamData],
        },
      },
      include: {
        TournamentMatchParticipant: {
          include: {
            participant: {
              include: {
                user: true,
                team: true,
              },
            },
            team: true,
          },
        },
      },
    });
  },

  async updateTournamentMatch(id: string, data: TournamentMatchUpdateData) {
    const updateData: {
      matchDate?: Date;
      civDraftKey?: string;
      mapDraftKey?: string;
      status?: MatchStatus;
      comment?: string;
      adminComment?: string;
    } = {
      matchDate: data.matchDate,
      civDraftKey: data.civDraftKey,
      mapDraftKey: data.mapDraftKey,
      status: data.status,
      comment: data.comment,
      adminComment: data.adminComment,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      const typedKey = key as keyof typeof updateData;
      if (updateData[typedKey] === undefined) {
        delete updateData[typedKey];
      }
    });

    return db.$transaction(async (tx) => {
      // Update match data
      const updatedMatch = await tx.tournamentMatch.update({
        where: { id },
        data: updateData,
        include: {
          TournamentMatchParticipant: {
            include: {
              participant: {
                include: {
                  user: true,
                  team: true,
                },
              },
              team: true,
            },
          },
        },
      });

      // Update participant scores if provided
      if (data.participantScores) {
        for (const scoreData of data.participantScores) {
          await tx.tournamentMatchParticipant.updateMany({
            where: {
              matchId: id,
              participantId: scoreData.participantId,
            },
            data: {
              score: scoreData.score,
              isWinner: scoreData.isWinner,
            },
          });
        }
      }

      // Update team scores if provided
      if (data.teamScores) {
        for (const scoreData of data.teamScores) {
          await tx.tournamentMatchParticipant.updateMany({
            where: {
              matchId: id,
              teamId: scoreData.teamId,
            },
            data: {
              score: scoreData.score,
              isWinner: scoreData.isWinner,
            },
          });
        }
      }

      return updatedMatch;
    });
  },

  async updateMatchParticipant(
    matchId: string,
    participantId: string,
    data: {
      isWinner?: boolean;
      score?: number;
    },
  ) {
    return db.tournamentMatchParticipant.update({
      where: {
        matchId_participantId: {
          matchId,
          participantId,
        },
      },
      data,
    });
  },

  async updateMatchParticipantByTeam(
    matchId: string,
    teamId: string,
    data: {
      isWinner?: boolean;
      score?: number;
    },
  ) {
    return db.tournamentMatchParticipant.update({
      where: {
        matchId_teamId: {
          matchId,
          teamId,
        },
      },
      data,
    });
  },

  async deleteTournamentMatch(id: string) {
    return db.tournamentMatch.delete({ where: { id } });
  },

  async manageGames(matchId: string, games: GameData[], applyScore: boolean) {
    console.log("manageGames called with:", { matchId, games, applyScore });

    await db.$transaction(async (tx) => {
      const matchParticipants = await tx.tournamentMatchParticipant.findMany({
        where: { matchId },
        include: {
          participant: {
            include: {
              user: true,
            },
          },
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
      });

      console.log("Found match participants:", matchParticipants.length);

      if (matchParticipants.length === 0) {
        console.log("No match participants found, returning early");
        return;
      }

      // Get existing games for this match
      const existingGames = await tx.game.findMany({
        where: { matchId },
        include: {
          participants: true,
        },
      });

      console.log("Existing games:", existingGames.length);
      // we should not delete games here!
      await tx.game.deleteMany({
        where: { matchId },
      });

      // Process each game data
      for (const gameData of games) {
        console.log("Processing game:", gameData);

        // Create new game
        const game = await tx.game.create({
          data: {
            matchId,
            mapId: gameData.mapId,
          },
        });
        console.log("Created new game:", game.id);

        // Create game participants
        for (const participantData of gameData.participants) {
          console.log("Creating participant:", participantData);
          await tx.gameParticipant.create({
            data: {
              gameId: game.id,
              matchParticipantId: participantData.matchParticipantId,
              civId: participantData.civId,
              isWinner: participantData.isWinner,
            },
          });
        }
      }

      if (applyScore) {
        // Calculate scores based on game wins
        const participantWins = new Map<string, number>();
        matchParticipants.forEach((p) => participantWins.set(p.id, 0));

        for (const gameData of games) {
          for (const participant of gameData.participants) {
            if (participant.isWinner && participant.matchParticipantId) {
              const currentWins =
                participantWins.get(participant.matchParticipantId) ?? 0;
              participantWins.set(
                participant.matchParticipantId,
                currentWins + 1,
              );
            }
          }
        }

        // Update match participant scores
        const scoreUpdatePromises = matchParticipants.map(async (p) => {
          const score = participantWins.get(p.id) ?? 0;
          let isWinner = false;

          const otherScores = Array.from(participantWins.values()).filter(
            (_, index) => matchParticipants[index]?.id !== p.id,
          );

          if (otherScores.every((s) => score > s)) {
            isWinner = true;
          }

          return tx.tournamentMatchParticipant.update({
            where: { id: p.id },
            data: { score, isWinner },
          });
        });

        await Promise.all(scoreUpdatePromises);

        await tx.tournamentMatch.update({
          where: { id: matchId },
          data: { status: "ADMIN_APPROVED" },
        });
      }
    });
    return this.getTournamentMatchById(matchId);
  },
};
