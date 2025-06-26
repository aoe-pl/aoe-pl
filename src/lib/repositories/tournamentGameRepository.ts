import { db } from "@/server/db";

export const tournamentGameRepository = {
  async getGamesByMatchId(matchId: string) {
    return db.game.findMany({
      where: { matchId },
      include: {
        map: true,
        participants: {
          include: {
            matchParticipant: true,
            civ: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
  },
};
