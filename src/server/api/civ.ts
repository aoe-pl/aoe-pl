import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

export const civRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return db.civ.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
