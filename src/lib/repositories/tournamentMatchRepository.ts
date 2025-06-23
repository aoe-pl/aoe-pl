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
  mapId: string;
  winnerId: string;
};

export const tournamentMatchRepository = {
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
            team: true,
            gamesWon: true,
            gamesLost: true,
          },
        },
        Game: {
          include: {
            map: true,
            winner: {
              include: {
                participant: true,
                team: true,
              },
            },
            loser: {
              include: {
                participant: true,
                team: true,
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
            team: true,
            gamesWon: true,
            gamesLost: true,
          },
        },
        Game: {
          include: {
            map: true,
            winner: {
              include: {
                participant: true,
                team: true,
              },
            },
            loser: {
              include: {
                participant: true,
                team: true,
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
    await db.$transaction(async (tx) => {
      const matchParticipants = await tx.tournamentMatchParticipant.findMany({
        where: { matchId },
      });

      if (matchParticipants.length === 0) {
        return;
      }

      await tx.game.deleteMany({
        where: { matchId },
      });

      const gameCreationPromises = games.map((game) => {
        const winner = matchParticipants.find((p) => p.id === game.winnerId);
        const loser = matchParticipants.find((p) => p.id !== game.winnerId);

        if (!winner || !loser) {
          throw new Error(
            `Invalid winner specified for the game in match ${matchId}.`,
          );
        }

        return tx.game.create({
          data: {
            matchId,
            mapId: game.mapId,
            winnerId: winner.id,
            loserId: loser.id,
          },
        });
      });

      await Promise.all(gameCreationPromises);

      if (applyScore) {
        const gamesWon = new Map<string, number>();
        matchParticipants.forEach((p) => gamesWon.set(p.id, 0));

        for (const game of games) {
          gamesWon.set(game.winnerId, (gamesWon.get(game.winnerId) ?? 0) + 1);
        }

        const scoreUpdatePromises = matchParticipants.map(async (p) => {
          const score = gamesWon.get(p.id) ?? 0;
          let isWinner = false;

          const otherScores = Array.from(gamesWon.values()).filter(
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
