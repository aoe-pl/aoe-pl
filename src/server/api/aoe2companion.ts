import {
  fetchAoe2CompanionMatches,
  fetchAoe2CompanionProfile,
} from "@/lib/aoe2companion";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

const profileIdSchema = z.number().int().positive();

export const aoe2CompanionRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({ profileId: profileIdSchema }))
    .query(async ({ input }) => {
      return fetchAoe2CompanionProfile(input.profileId);
    }),

  /**
   * Fetches a player's most recent AoE2Companion matches, optionally scoped
   * to a single leaderboard (e.g. `rm_1v1`).
   */
  getMatches: publicProcedure
    .input(
      z.object({
        profileId: profileIdSchema,
        leaderboardId: z.string().optional(),
        count: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(async ({ input }) => {
      return fetchAoe2CompanionMatches(input.profileId, {
        leaderboardId: input.leaderboardId,
        count: input.count,
      });
    }),
});
