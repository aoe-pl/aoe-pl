import { db } from "@/server/db";
import type {
  MapCreateData,
  MapUpdateData,
} from "@/lib/admin-panel/settings/types";

export const mapRepository = {
  async getAllMaps() {
    return db.map.findMany({
      include: {
        baseMap: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async getMapById(id: string) {
    return db.map.findUnique({
      where: { id },
      include: {
        baseMap: true,
        Game: true,
      },
    });
  },

  async createMap(data: MapCreateData) {
    return db.map.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        baseMapId: data.baseMapId,
      },
      include: {
        baseMap: true,
      },
    });
  },

  async updateMap(id: string, data: MapUpdateData) {
    return db.map.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        baseMapId: data.baseMapId,
      },
      include: {
        baseMap: true,
      },
    });
  },

  async deleteMap(id: string) {
    return db.map.delete({
      where: { id },
    });
  },

  async getMapUsageCount(id: string) {
    const count = await db.game.count({
      where: { mapId: id },
    });
    return count;
  },
};
