import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { streamerRepository } from "@/lib/repositories/streamerRepository";

export const streamerRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return streamerRepository.getStreamers();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return streamerRepository.getStreamerById(input.id);
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return streamerRepository.getStreamerByUserId(input.userId);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        streamerName: z.string().min(1),
        streamerUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      return streamerRepository.createStreamer(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        streamerName: z.string().min(1).optional(),
        streamerUrl: z.string().url().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return streamerRepository.updateStreamer(input);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return streamerRepository.deleteStreamer(input.id);
    }),

  availableUsers: publicProcedure.query(async () => {
    return streamerRepository.getAvailableUsers();
  }),
});
