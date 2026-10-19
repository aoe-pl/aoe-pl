import "server-only";

import {
  fetchAoe2CompanionProfile,
  getAoe2Companion1v1,
} from "@/lib/aoe2companion";
import { getPlayerProfileIdFromCompanionUrl } from "@/lib/utils";
import { db } from "@/server/db";

/**
 * How long a cached rating is considered fresh.
 * Ratings change after ranked games.
 */
const PLAYER_RATING_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Maximum number of profiles refreshed per call.
 */
const DEFAULT_REFRESH_LIMIT = 100;

/** Keep concurrent requests to AoE2Companion low to avoid rate limiting. */
const REFRESH_CONCURRENCY = 3;

/**
 * Users currently being refreshed in this process, so concurrent page views
 * don't fetch the same profile twice.
 */
const inFlightUserIds = new Set<string>();

/**
 * Stores a freshly fetched rating for a user. `null` is a valid value: the
 * player may simply have no 1v1 Random Map standing.
 */
export function savePlayerRating(userId: string, rating: number | null) {
  return db.user.update({
    where: { id: userId },
    data: { rating, ratingUpdatedAt: new Date() },
  });
}

interface RefreshStalePlayerRatingsOptions {
  /** Restrict the refresh to these users (e.g. one tournament's players). */
  userIds?: string[];
  /** Maximum number of users to refresh in this call. */
  limit?: number;
}

/**
 * Refreshes cached ratings that are missing or older than
 * `PLAYER_RATING_MAX_AGE_MS`. Users are processed with bounded concurrency so
 * a large tournament cannot flood the AoE2Companion API.
 */
export async function refreshStalePlayerRatings({
  userIds,
  limit = DEFAULT_REFRESH_LIMIT,
}: RefreshStalePlayerRatingsOptions = {}) {
  if (userIds && userIds.length === 0) return;

  const staleBefore = new Date(Date.now() - PLAYER_RATING_MAX_AGE_MS);

  const candidates = await db.user.findMany({
    where: {
      aoe2companionUrl: { not: null },
      ...(userIds ? { id: { in: userIds } } : {}),
      OR: [{ ratingUpdatedAt: null }, { ratingUpdatedAt: { lt: staleBefore } }],
    },
    select: { id: true, aoe2companionUrl: true },
    orderBy: { ratingUpdatedAt: { sort: "asc", nulls: "first" } },
    take: limit + inFlightUserIds.size,
  });

  const users = candidates
    .filter((user) => !inFlightUserIds.has(user.id))
    .slice(0, limit);

  await runWithConcurrency(users, REFRESH_CONCURRENCY, async (user) => {
    if (inFlightUserIds.has(user.id)) return;

    inFlightUserIds.add(user.id);
    try {
      const profileId = getPlayerProfileIdFromCompanionUrl(
        user.aoe2companionUrl ?? "",
      );

      if (profileId === null) {
        // An invalid link will not become valid on its own; mark it as checked
        // so it is not retried on every page view.
        await savePlayerRating(user.id, null);
        return;
      }

      // The profile request is shared through Next.js' data cache for 30
      // minutes, so concurrent page loads don't hit AoE2Companion repeatedly.
      const profile = await fetchAoe2CompanionProfile(profileId);

      // A failed request is most likely transient (network or rate limiting),
      // so leave the timestamp untouched and retry on a later run.
      if (!profile) return;

      await savePlayerRating(
        user.id,
        getAoe2Companion1v1(profile)?.rating ?? null,
      );
    } catch (error) {
      console.error(`Failed to refresh rating for user ${user.id}:`, error);
    } finally {
      inFlightUserIds.delete(user.id);
    }
  });
}

/** Refreshes the stale ratings of every player registered in a tournament. */
export async function refreshStalePlayerRatingsForTournament(
  tournamentId: string,
  limit = DEFAULT_REFRESH_LIMIT,
) {
  const participants = await db.tournamentParticipant.findMany({
    where: { tournamentId, userId: { not: null } },
    select: { userId: true },
  });

  const userIds = participants
    .map((participant) => participant.userId)
    .filter((id): id is string => Boolean(id));

  await refreshStalePlayerRatings({ userIds, limit });
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>,
) {
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;

        if (item !== undefined) {
          await task(item);
        }
      }
    },
  );

  await Promise.all(workers);
}
