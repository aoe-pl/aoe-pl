import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { mapRepository } from "@/lib/repositories/mapRepository";

export const mapRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return mapRepository.getMaps();
  }),
});
