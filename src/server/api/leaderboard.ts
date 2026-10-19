import {
  fetchAoe2CompanionProfile,
  getAoe2Companion1v1,
} from "@/lib/aoe2companion";
import { getPlayerProfileIdFromCompanionUrl } from "@/lib/utils";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/** Maximum number of players the top-players list supports. */
const MAX_PLAYERS = 100;

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
  const playersByProfileId = new Map<number, LeaderboardPlayer>();
  const maxPages = 100;

  let page = 1;

  while (playersByProfileId.size < count && page <= maxPages) {
    try {
      const params = new URLSearchParams({
        search: "",
        language: "en",
        country: "pl",
        page: String(page),
      });

      const response = await fetch(
        `https://data.aoe2companion.com/api/leaderboards/rm_1v1?${params.toString()}`,
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

      for (const player of polishFromPage) {
        if (!playersByProfileId.has(player.profileId)) {
          playersByProfileId.set(player.profileId, player);
        }
      }

      page++;

      if (polishFromPage.length === 0) {
        continue;
      }
    } catch (error) {
      console.error(`Error fetching leaderboard page:`, error);
      break;
    }
  }

  return [...playersByProfileId.values()].slice(0, count);
}

/**
 * Builds a leaderboard entry for a manually included AoE2Companion profile.
 * Returns null when the profile or its 1v1 Random Map standing is unavailable.
 */
async function fetchIncludedPlayer(
  profileId: number,
): Promise<LeaderboardPlayer | null> {
  const profile = await fetchAoe2CompanionProfile(profileId);

  if (!profile) return null;

  const leaderboard = getAoe2Companion1v1(profile);

  if (!leaderboard) return null;

  return {
    leaderboardId: leaderboard.leaderboardId,
    profileId: profile.profileId,
    name: profile.name,
    rank: leaderboard.rank ?? 0,
    rating: leaderboard.rating,
    country: profile.country ?? "",
    wins: leaderboard.wins,
    losses: leaderboard.losses,
    games: leaderboard.games,
    streak: leaderboard.streak,
  };
}

/**
 * Merges the Polish leaderboard players with manually included players,
 * deduplicating by profile id and sorting by rating (highest first).
 */
function mergePlayers(
  polishPlayers: LeaderboardPlayer[],
  includedPlayers: LeaderboardPlayer[],
): LeaderboardPlayer[] {
  const byProfileId = new Map<number, LeaderboardPlayer>();

  for (const player of [...polishPlayers, ...includedPlayers]) {
    if (!byProfileId.has(player.profileId)) {
      byProfileId.set(player.profileId, player);
    }
  }

  return [...byProfileId.values()].sort((a, b) => b.rating - a.rating);
}

/**
 * Builds a map of AoE2Companion profileId -> internal playerNumber for users
 * who linked their AoE2Companion profile. This lets us link leaderboard entries
 * to their in-app profile page when the account exists.
 */
async function getProfileIdToPlayerNumberMap(): Promise<Map<number, number>> {
  const users = await db.user.findMany({
    where: { aoe2companionUrl: { not: null } },
    select: { playerNumber: true, aoe2companionUrl: true },
  });

  const map = new Map<number, number>();
  for (const user of users) {
    const profileId = getPlayerProfileIdFromCompanionUrl(
      user.aoe2companionUrl ?? "",
    );
    if (profileId !== null) map.set(profileId, user.playerNumber);
  }
  return map;
}

export const leaderboardRouter = createTRPCRouter({
  getTopPolishPlayers: publicProcedure
    .input(
      z.object({
        count: z.number().min(1).max(MAX_PLAYERS).default(MAX_PLAYERS),
      }),
    )
    .query(async ({ input }) => {
      const [filters, includedProfiles] = await Promise.all([
        db.leaderboardPlayerFilter.findMany({
          select: { profileId: true, name: true },
        }),
        db.leaderboardPlayerInclude.findMany({
          select: { profileId: true },
        }),
      ]);

      const [players, includedPlayers] = await Promise.all([
        fetchTopPolishPlayers(input.count + filters.length),
        Promise.all(
          includedProfiles.map((included) =>
            fetchIncludedPlayer(included.profileId),
          ),
        ),
      ]);

      const validIncludedPlayers = includedPlayers.filter(
        (player): player is LeaderboardPlayer => player !== null,
      );

      const merged = mergePlayers(players, validIncludedPlayers);

      const filtered = merged
        .filter((p) => !isPlayerFiltered(p, filters))
        .slice(0, input.count);

      const profileIdToPlayerNumber = await getProfileIdToPlayerNumberMap();

      return filtered.map((player) => ({
        ...player,
        playerNumber: profileIdToPlayerNumber.get(player.profileId) ?? null,
      }));
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

  getIncludedPlayers: adminProcedure.query(async () => {
    return db.leaderboardPlayerInclude.findMany({
      orderBy: { createdAt: "asc" },
    });
  }),

  addIncludedPlayer: adminProcedure
    .input(z.object({ profileId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const profile = await fetchAoe2CompanionProfile(input.profileId);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found on AoE2Companion.",
        });
      }

      if (!getAoe2Companion1v1(profile)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Player has no 1v1 Random Map rating.",
        });
      }

      return db.leaderboardPlayerInclude.upsert({
        where: { profileId: input.profileId },
        create: { profileId: input.profileId, name: profile.name },
        update: { name: profile.name },
      });
    }),

  removeIncludedPlayer: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.leaderboardPlayerInclude.delete({ where: { id: input.id } });
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
