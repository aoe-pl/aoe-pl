import { db } from "@/server/db";
import type { TournamentMatchModeType } from "@prisma/client";

export const tournamentMatchModeRepository = {
  async getMatchModes() {
    return db.tournamentMatchMode.findMany({
      orderBy: [{ mode: "asc" }, { gameCount: "asc" }],
    });
  },
  async getMatchModeById(id: string) {
    return db.tournamentMatchMode.findUnique({
      where: { id },
    });
  },
  async createMatchMode(data: {
    mode: TournamentMatchModeType;
    gameCount: number;
  }) {
    return db.tournamentMatchMode.create({
      data,
    });
  },
  async updateMatchMode(
    id: string,
    data: Partial<{
      mode: TournamentMatchModeType;
      gameCount: number;
    }>,
  ) {
    return db.tournamentMatchMode.update({
      where: { id },
      data,
    });
  },
  async deleteMatchMode(id: string) {
    return db.tournamentMatchMode.delete({ where: { id } });
  },
};
