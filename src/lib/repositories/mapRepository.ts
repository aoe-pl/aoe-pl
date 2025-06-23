import { db } from "@/server/db";

export const mapRepository = {
  async getMaps() {
    return db.map.findMany({
      include: {
        baseMap: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
};
