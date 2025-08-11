import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { baseMapRepository } from "@/lib/repositories/baseMapRepository";

const createBaseMapSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const updateBaseMapSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const baseMapRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return baseMapRepository.getAllBaseMaps();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return baseMapRepository.getBaseMapById(input.id);
    }),

  create: adminProcedure
    .input(createBaseMapSchema)
    .mutation(async ({ input }) => {
      return baseMapRepository.createBaseMap(input);
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateBaseMapSchema }))
    .mutation(async ({ input }) => {
      return baseMapRepository.updateBaseMap(input.id, input.data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if base map is being used by any maps
      const usageCount = await baseMapRepository.getBaseMapUsageCount(input.id);
      if (usageCount > 0) {
        throw new Error(`BASE_MAP_IN_USE:${usageCount}`);
      }
      return baseMapRepository.deleteBaseMap(input.id);
    }),

  getUsageCount: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return baseMapRepository.getBaseMapUsageCount(input.id);
    }),
});
