import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { z } from "zod";

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
      const filters = await db.leaderboardPlayerFilter.findMany({
        select: { profileId: true, name: true },
      });

      const players = await fetchTopPolishPlayers(input.count + filters.length);

      const filtered = players.filter((p) => !isPlayerFiltered(p, filters));

      return filtered.slice(0, input.count);
    }),

  getPlayerFilters: adminProcedure.query(async () => {
    return db.leaderboardPlayerFilter.findMany({
      orderBy: { createdAt: "asc" },
    });
  }),

  addPlayerFilter: adminProcedure
    .input(
      z
        .object({
          profileId: z.number().int().positive().optional(),
          name: z.string().min(1).optional(),
        })
        .refine((d) => d.profileId !== undefined || d.name !== undefined, {
          message: "Must provide profileId or name",
        }),
    )
    .mutation(async ({ input }) => {
      return db.leaderboardPlayerFilter.create({
        data: {
          profileId: input.profileId ?? null,
          name: input.name ?? null,
        },
      });
    }),

  removePlayerFilter: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.leaderboardPlayerFilter.delete({ where: { id: input.id } });
    }),
});

// Check if player is in filters list. We don't want to list those in the top players list.
function isPlayerFiltered(
  player: LeaderboardPlayer,
  filters: { profileId: number | null; name: string | null }[],
): boolean {
  return filters.some((f) => {
    if (f.profileId !== null && f.profileId === player.profileId) {
      return true;
    }

    if (f.name !== null && f.name.toLowerCase() === player.name.toLowerCase()) {
      return true;
    }

    return false;
  });
}
