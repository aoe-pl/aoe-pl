import { db } from "@/server/db";

export const tournamentSeriesRepository = {
  async getTournamentSeries() {
    return db.tournamentSeries.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getTournamentSeriesById(id: string) {
    return db.tournamentSeries.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async createTournamentSeries(data: {
    name: string;
    description?: string;
    displayOrder: number;
    ownerId?: string;
  }) {
    return db.tournamentSeries.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async updateTournamentSeries(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      displayOrder: number;
      ownerId: string;
    }>,
  ) {
    return db.tournamentSeries.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async deleteTournamentSeries(id: string) {
    return db.tournamentSeries.delete({ where: { id } });
  },
};
