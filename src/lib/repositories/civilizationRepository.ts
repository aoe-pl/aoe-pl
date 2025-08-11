import { db } from "@/server/db";
import type {
  CivilizationCreateData,
  CivilizationUpdateData,
} from "@/lib/admin-panel/settings/types";

export const civilizationRepository = {
  async getAllCivilizations() {
    return db.civ.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getCivilizationById(id: string) {
    return db.civ.findUnique({
      where: { id },
    });
  },

  async createCivilization(data: CivilizationCreateData) {
    return db.civ.create({
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl,
      },
    });
  },

  async updateCivilization(id: string, data: CivilizationUpdateData) {
    return db.civ.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl,
      },
    });
  },

  async deleteCivilization(id: string) {
    return db.civ.delete({
      where: { id },
    });
  },

  async getCivilizationUsageCount(id: string) {
    const count = await db.gameParticipant.count({
      where: { civId: id },
    });
    return count;
  },
};
