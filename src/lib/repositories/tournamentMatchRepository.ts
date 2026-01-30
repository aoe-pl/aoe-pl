import { db } from "@/server/db";
import type { MatchStatus, Prisma } from "@prisma/client";
import { createAoe2RecsService } from "@/lib/storage";

const upcomingMatchesInclude = {
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
    },
  },
  group: {
    include: {
      matchMode: true,
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
  },
  TournamentMatchMode: true,
} satisfies Prisma.TournamentMatchInclude;

export type UpcomingMatch = Prisma.TournamentMatchGetPayload<{
  include: typeof upcomingMatchesInclude;
}>;

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
    wonScore: number;
    lostScore: number;
    isWinner: boolean;
  }[];
  teamScores?: {
    teamId: string;
    wonScore: number;
    lostScore: number;
    isWinner: boolean;
  }[];
};

export type TournamentMatchUpdateData = Partial<TournamentMatchCreateData>;

export type GameData = {
  gameId?: string;
  mapId: string;
  recUrl?: string;
  tempFileKey?: string; // Temporary file key from upload endpoint
  participants: {
    matchParticipantId: string;
    civId?: string;
    isWinner: boolean;
  }[];
};

export const tournamentMatchRepository = {
  async getUpcomingMatches(): Promise<UpcomingMatch[]> {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59);

    // Get all matches today
    const todayMatches = await db.tournamentMatch.findMany({
      where: {
        matchDate: {
          gte: now,
          lte: endOfToday,
        },
        status: {
          in: ["PENDING", "SCHEDULED"],
        },
        group: {
          stage: {
            tournament: {
              status: "ACTIVE",
              isVisible: true,
            },
          },
        },
      },
      include: upcomingMatchesInclude,
      orderBy: { matchDate: "asc" },
    });

    // Get future matches (up to 5 minus today's count)
    const futureMatchesLimit = Math.max(0, 5 - todayMatches.length);

    if (futureMatchesLimit === 0) {
      return todayMatches;
    }

    const futureMatches = await db.tournamentMatch.findMany({
      where: {
        matchDate: {
          gt: endOfToday,
        },
        status: {
          in: ["PENDING", "SCHEDULED"],
        },
        group: {
          stage: {
            tournament: {
              status: "ACTIVE",
              isVisible: true,
            },
          },
        },
      },
      include: upcomingMatchesInclude,
      orderBy: { matchDate: "asc" },
      take: futureMatchesLimit,
    });

    return todayMatches.concat(futureMatches);
  },

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
          wonScore: scoreData?.wonScore ?? 0,
          lostScore: scoreData?.lostScore ?? 0,
        };
      }) ?? [];

    const teamData =
      data.teamIds?.map((id) => {
        const scoreData = data.teamScores?.find((s) => s.teamId === id);
        return {
          teamId: id,
          isWinner: scoreData?.isWinner ?? false,
          wonScore: scoreData?.wonScore ?? 0,
          lostScore: scoreData?.lostScore ?? 0,
        };
      }) ?? [];

    return db.tournamentMatch.create({
      data: {
        groupId: data.groupId,
        matchDate: data.matchDate,
        civDraftKey: data.civDraftKey ?? "",
        mapDraftKey: data.mapDraftKey ?? "",
        status: data.status ?? "PENDING",
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
              wonScore: scoreData.wonScore,
              lostScore: scoreData.lostScore,
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
              wonScore: scoreData.wonScore,
              lostScore: scoreData.lostScore,
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
      wonScore?: number;
      lostScore?: number;
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
      wonScore?: number;
      lostScore?: number;
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

  async manageGames(
    matchId: string,
    games: GameData[],
    applyScore: boolean,
    filesToRemove?: string[],
  ) {
    const s3Service = createAoe2RecsService();
    const tempFilesToCleanup: string[] = [];
    const movedFiles: { from: string; to: string }[] = [];

    // Delete specific files marked for removal
    if (filesToRemove && filesToRemove.length > 0) {
      console.log("Deleting specific replay files:", filesToRemove);
      for (const fileKey of filesToRemove) {
        try {
          await s3Service.delete(fileKey);
          console.log("Deleted replay file:", fileKey);
        } catch (error) {
          console.warn("Failed to delete replay file:", fileKey, error);
        }
      }
    }

    try {
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

        // Delete existing games
        await tx.game.deleteMany({
          where: { matchId },
        });

        // Process each game data
        for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
          const gameData = games[gameIndex];
          if (!gameData) continue;

          console.log("Processing game:", gameData);

          let recUrl: string | undefined = gameData.recUrl;

          // Handle temp file if provided
          if (gameData.tempFileKey) {
            // Create permanent key with game number and timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const gameNumber = gameIndex + 1;
            const originalExtension =
              gameData.tempFileKey.split(".").pop() ?? "mgz";
            const fileName = `game_${gameNumber}_${timestamp}.${originalExtension}`;
            const permanentKey = `tournaments/${matchId}/games/${fileName}`;

            // Move file from temp to permanent location
            await s3Service.copy(gameData.tempFileKey, permanentKey);
            movedFiles.push({ from: gameData.tempFileKey, to: permanentKey });
            tempFilesToCleanup.push(gameData.tempFileKey);
            recUrl = permanentKey;

            console.log("Moved replay file from temp to permanent:", {
              from: gameData.tempFileKey,
              to: permanentKey,
            });
          }

          // Create new game
          const game = await tx.game.create({
            data: {
              matchId,
              mapId: gameData.mapId,
              recUrl,
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
          const participantLosses = new Map<string, number>();
          matchParticipants.forEach((p) => {
            participantWins.set(p.id, 0);
            participantLosses.set(p.id, 0);
          });

          for (const gameData of games) {
            for (const participant of gameData.participants) {
              if (participant.matchParticipantId) {
                if (participant.isWinner) {
                  const currentWins =
                    participantWins.get(participant.matchParticipantId) ?? 0;
                  participantWins.set(
                    participant.matchParticipantId,
                    currentWins + 1,
                  );
                } else {
                  const currentLosses =
                    participantLosses.get(participant.matchParticipantId) ?? 0;
                  participantLosses.set(
                    participant.matchParticipantId,
                    currentLosses + 1,
                  );
                }
              }
            }
          }

          // Update match participant scores
          const scoreUpdatePromises = matchParticipants.map(async (p) => {
            const wonScore = participantWins.get(p.id) ?? 0;
            const lostScore = participantLosses.get(p.id) ?? 0;

            // Find the highest won score among all participants
            const maxWonScore = Math.max(
              ...Array.from(participantWins.values()),
            );

            // Set as winner if this participant has the highest won score (supports multiple winners)
            const isWinner = wonScore === maxWonScore && maxWonScore > 0;

            return tx.tournamentMatchParticipant.update({
              where: { id: p.id },
              data: { wonScore, lostScore, isWinner },
            });
          });

          await Promise.all(scoreUpdatePromises);

          await tx.tournamentMatch.update({
            where: { id: matchId },
            data: { status: "ADMIN_APPROVED" },
          });
        }
      });

      // Clean up temp files after successful transaction
      for (const tempKey of tempFilesToCleanup) {
        try {
          await s3Service.delete(tempKey);
          console.log("Cleaned up temp file:", tempKey);
        } catch (error) {
          console.warn("Failed to cleanup temp file:", tempKey, error);
        }
      }

      return this.getTournamentMatchById(matchId);
    } catch (error) {
      console.error("Transaction failed, rolling back file moves:", error);

      // Rollback: delete any files that were moved to permanent locations
      for (const move of movedFiles) {
        try {
          await s3Service.delete(move.to);
          console.log("Rolled back moved file:", move.to);
        } catch (rollbackError) {
          console.warn("Failed to rollback file:", move.to, rollbackError);
        }
      }

      throw error;
    }
  },
};
