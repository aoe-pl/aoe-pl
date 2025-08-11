import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { mapRepository } from "@/lib/repositories/mapRepository";

const createMapSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  baseMapId: z.string().min(1, "Base map is required"),
});

const updateMapSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  baseMapId: z.string().min(1, "Base map is required").optional(),
});

export const mapRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return mapRepository.getAllMaps();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mapRepository.getMapById(input.id);
    }),

  create: adminProcedure.input(createMapSchema).mutation(async ({ input }) => {
    return mapRepository.createMap(input);
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateMapSchema }))
    .mutation(async ({ input }) => {
      return mapRepository.updateMap(input.id, input.data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if map is being used in any games
      const usageCount = await mapRepository.getMapUsageCount(input.id);
      if (usageCount > 0) {
        throw new Error(`MAP_IN_USE:${usageCount}`);
      }
      return mapRepository.deleteMap(input.id);
    }),

  getUsageCount: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mapRepository.getMapUsageCount(input.id);
    }),
});
