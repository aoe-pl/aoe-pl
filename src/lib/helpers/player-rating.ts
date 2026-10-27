import "server-only";

import { fetchAoe2CompanionStandings } from "@/lib/aoe2companion";
import { getPlayerProfileIdFromCompanionUrl } from "@/lib/utils";
import { db } from "@/server/db";

/**
 * How long a cached rating is considered fresh.
 * Ratings change after ranked games.
 */
const PLAYER_RATING_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Maximum number of profiles refreshed per call. Profiles are fetched in
 * batches of 100, so this is a handful of requests even for a big tournament.
 */
const DEFAULT_REFRESH_LIMIT = 500;

/**
 * Stores a freshly fetched rating for a user. `null` is a valid value: the
 * player may simply have no 1v1 Random Map standing. `maxRating` is left
 * untouched when omitted so invalid links don't erase the stored peak.
 */
export function savePlayerRating(
  userId: string,
  rating: number | null,
  maxRating?: number | null,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      rating,
      ratingUpdatedAt: new Date(),
      ...(maxRating !== undefined ? { maxRating } : {}),
    },
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
 * `PLAYER_RATING_MAX_AGE_MS`. Profiles are fetched in batches, so refreshing a
 * whole tournament costs a few requests instead of one per player.
 */
export async function refreshStalePlayerRatings({
  userIds,
  limit = DEFAULT_REFRESH_LIMIT,
}: RefreshStalePlayerRatingsOptions = {}) {
  if (userIds && userIds.length === 0) return;

  const staleBefore = new Date(Date.now() - PLAYER_RATING_MAX_AGE_MS);

  const users = await db.user.findMany({
    where: {
      aoe2companionUrl: { not: null },
      ...(userIds ? { id: { in: userIds } } : {}),
      OR: [{ ratingUpdatedAt: null }, { ratingUpdatedAt: { lt: staleBefore } }],
    },
    select: { id: true, aoe2companionUrl: true },
    orderBy: { ratingUpdatedAt: { sort: "asc", nulls: "first" } },
    take: limit,
  });

  if (users.length === 0) return;

  const profileIdByUserId = new Map<string, number>();

  for (const user of users) {
    const profileId = getPlayerProfileIdFromCompanionUrl(
      user.aoe2companionUrl ?? "",
    );

    if (profileId === null) {
      // An invalid link will not become valid on its own; mark it as checked
      // so it is not retried on every page view.
      await savePlayerRating(user.id, null);
      continue;
    }

    profileIdByUserId.set(user.id, profileId);
  }

  const { standings, failedProfileIds } = await fetchAoe2CompanionStandings([
    ...profileIdByUserId.values(),
  ]);

  await Promise.all(
    [...profileIdByUserId].map(async ([userId, profileId]) => {
      // A failed batch is most likely transient (network or rate limiting), so
      // leave the timestamp untouched and retry on a later run.
      if (failedProfileIds.has(profileId)) return;

      // Missing from a successful response means no 1v1 Random Map standing.
      const standing = standings.get(profileId);

      await savePlayerRating(
        userId,
        standing?.rating ?? null,
        standing?.maxRating ?? null,
      );
    }),
  );
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
