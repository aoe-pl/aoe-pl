import { db } from "@/server/db";
import { type TournamentSectionType } from "@prisma/client";

export const tournamentSectionRepository = {
  async getSectionsByTournamentId(tournamentId: string) {
    return db.tournamentSection.findMany({
      where: { tournamentId },
    });
  },

  async createSection(data: {
    tournamentId: string;
    type: TournamentSectionType;
    content?: string;
    isVisible: boolean;
  }) {
    return db.tournamentSection.create({
      data: {
        tournamentId: data.tournamentId,
        type: data.type,
        content: data.content,
        isVisible: data.isVisible,
      },
    });
  },

  async updateSection(
    id: string,
    data: {
      content?: string;
      isVisible: boolean;
    },
  ) {
    return db.tournamentSection.update({
      where: { id },
      data: {
        content: data.content,
        isVisible: data.isVisible,
      },
    });
  },

  async deleteSection(id: string) {
    return db.tournamentSection.delete({ where: { id } });
  },
};
