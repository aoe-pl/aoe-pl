import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { civilizationRepository } from "@/lib/repositories/civilizationRepository";

const createCivilizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const updateCivilizationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const civRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return civilizationRepository.getAllCivilizations();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return civilizationRepository.getCivilizationById(input.id);
    }),

  create: adminProcedure
    .input(createCivilizationSchema)
    .mutation(async ({ input }) => {
      return civilizationRepository.createCivilization(input);
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateCivilizationSchema }))
    .mutation(async ({ input }) => {
      return civilizationRepository.updateCivilization(input.id, input.data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if civilization is being used in any games
      const usageCount = await civilizationRepository.getCivilizationUsageCount(
        input.id,
      );
      if (usageCount > 0) {
        throw new Error(
          `Cannot delete civilization. It is currently used in ${usageCount} game(s).`,
        );
      }
      return civilizationRepository.deleteCivilization(input.id);
    }),

  getUsageCount: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return civilizationRepository.getCivilizationUsageCount(input.id);
    }),
});
