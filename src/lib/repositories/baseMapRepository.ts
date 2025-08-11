import { db } from "@/server/db";
import type {
  BaseMapCreateData,
  BaseMapUpdateData,
} from "@/lib/admin-panel/settings/types";

export const baseMapRepository = {
  async getAllBaseMaps() {
    return db.baseMap.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getBaseMapById(id: string) {
    return db.baseMap.findUnique({
      where: { id },
      include: {
        maps: true,
      },
    });
  },

  async createBaseMap(data: BaseMapCreateData) {
    return db.baseMap.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
      },
    });
  },

  async updateBaseMap(id: string, data: BaseMapUpdateData) {
    return db.baseMap.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
      },
    });
  },

  async deleteBaseMap(id: string) {
    return db.baseMap.delete({
      where: { id },
    });
  },

  async getBaseMapUsageCount(id: string) {
    const count = await db.map.count({
      where: { baseMapId: id },
    });
    return count;
  },
};