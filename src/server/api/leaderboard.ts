import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

interface LeaderboardPlayer {
  leaderboardId: string;
  profileId: number;
  name: string;
  rank: number;
  rating: number;
  country: string;
  wins: number;
  losses: number;
  games: number;
  streak: number;
}

interface LeaderboardResponse {
  players: LeaderboardPlayer[];
  total: number;
  page: number;
  perPage: number;
}

async function fetchTopPolishPlayers(
  count: number,
): Promise<LeaderboardPlayer[]> {
  const polishPlayers: LeaderboardPlayer[] = [];
  const maxPages = 20;

  let page = 1;

  while (polishPlayers.length < count && page <= maxPages) {
    try {
      const response = await fetch(
        `https://data.aoe2companion.com/api/leaderboards/rm_1v1?search=&language=en&page=${page}`,
        {
          next: { revalidate: 3600 }, // Cache for 1h
          headers: {
            "User-Agent": "AoE2PL/1.0",
          },
        },
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch leaderboard page: ${response.status} ${response.statusText}`,
        );

        break;
      }

      const data = (await response.json()) as LeaderboardResponse;
      const polishFromPage = data.players.filter((p) => p.country === "pl");

      polishPlayers.push(...polishFromPage);

      page++;

      if (polishFromPage.length === 0) {
        continue;
      }
    } catch (error) {
      console.error(`Error fetching leaderboard page:`, error);
      break;
    }
  }

  return polishPlayers.slice(0, count);
}

export const leaderboardRouter = createTRPCRouter({
  getTopPolishPlayers: publicProcedure
    .input(
      z.object({
        count: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      return fetchTopPolishPlayers(input.count);
    }),
});
