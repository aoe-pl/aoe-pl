import "server-only";

/**
 * Client for the public AoE2Companion profile API.
 */

const aoe2CompanionApi = "https://data.aoe2companion.com/api/profiles";

/** Endpoint exposing recent match history for one or more profiles. */
const aoe2CompanionMatchesApi = "https://data.aoe2companion.com/api/matches";

/** How long (in seconds) the AoE2Companion response is cached by Next.js. */
const cacheForSeconds = 60 * 60;

/**
 * Builds the public AoE2Companion profile page URL for a given profile id.
 */
export function getAoe2CompanionProfileUrl(profileId: number): string {
  return `https://www.aoe2companion.com/players/${profileId}`;
}

export interface Aoe2CompanionLeaderboard {
  leaderboardId: string;
  leaderboardName: string;
  abbreviation: string;
  rank: number | null;
  rating: number;
  maxRank: number | null;
  maxRating: number;
  rankCountry: number | null;
  wins: number;
  losses: number;
  games: number;
  streak: number;
  active: boolean;
  lastMatchTime: string | null;
}

export interface Aoe2CompanionProfile {
  profileId: number;
  name: string;
  country: string | null;
  countryIcon: string | null;
  countryName: string | null;
  platform: string | null;
  platformName: string | null;
  games: number;
  leaderboards: Aoe2CompanionLeaderboard[];
}

export interface Aoe2CompanionMatchPlayer {
  profileId: number;
  name: string;
  civ: string | null;
  civName: string | null;
  civImageUrl: string | null;
  color: number | null;
  colorHex: string | null;
  slot: number;
  team: number;
  country: string | null;
  rating: number | null;
  ratingDiff: number | null;
  won: boolean | null;
}

export interface Aoe2CompanionMatchTeam {
  teamId: number;
  players: Aoe2CompanionMatchPlayer[];
}

export interface Aoe2CompanionMatch {
  matchId: number;
  started: string | null;
  finished: string | null;
  leaderboardId: string;
  leaderboardName: string;
  map: string | null;
  mapName: string | null;
  mapImageUrl: string | null;
  teams: Aoe2CompanionMatchTeam[];
}

export interface Aoe2CompanionMatchesOptions {
  leaderboardId?: string; //`rm_1v1`

  count?: number;
}

/**
 * Fetches a player's profile from the AoE2Companion API.
 */
export async function fetchAoe2CompanionProfile(
  profileId: number,
): Promise<Aoe2CompanionProfile | null> {
  try {
    const response = await fetch(`${aoe2CompanionApi}/${profileId}`, {
      next: { revalidate: cacheForSeconds },
      headers: { "User-Agent": "AoE2PL/1.0" },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch AoE2Companion profile ${profileId}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    // The top-level `games` field is returned as a string, unlike the numeric
    // `games` on each leaderboard entry, so coerce it here.
    const data = (await response.json()) as Omit<
      Aoe2CompanionProfile,
      "games"
    > & {
      games: number | string;
    };

    return {
      ...data,
      games: Number(data.games) || 0,
      leaderboards: Array.isArray(data.leaderboards) ? data.leaderboards : [],
    };
  } catch (error) {
    console.error(`Error fetching AoE2Companion profile ${profileId}:`, error);
    return null;
  }
}

/** Returns the 1v1 Random Map standing, if the player has one. */
export function getAoe2Companion1v1(
  profile: Aoe2CompanionProfile,
): Aoe2CompanionLeaderboard | undefined {
  return profile.leaderboards.find((lb) => lb.leaderboardId === "rm_1v1");
}

/**
 * Fetches a player's most recent matches from the AoE2Companion API.
 */
export async function fetchAoe2CompanionMatches(
  profileId: number,
  options: Aoe2CompanionMatchesOptions = {},
): Promise<Aoe2CompanionMatch[]> {
  const { leaderboardId, count = 10 } = options;

  try {
    const params = new URLSearchParams({
      profile_ids: String(profileId),
      per_page: String(count),
    });

    if (leaderboardId) {
      params.set("leaderboard_ids", leaderboardId);
    }

    const response = await fetch(
      `${aoe2CompanionMatchesApi}?${params.toString()}`,
      {
        next: { revalidate: cacheForSeconds },
        headers: { "User-Agent": "AoE2PL/1.0" },
      },
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch AoE2Companion matches for ${profileId}: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = (await response.json()) as {
      matches?: Aoe2CompanionMatch[];
    };

    const matches = Array.isArray(data.matches) ? data.matches : [];

    return matches
      .map((match) => ({
        ...match,
        teams: Array.isArray(match.teams) ? match.teams : [],
      }))
      .slice(0, count);
  } catch (error) {
    console.error(
      `Error fetching AoE2Companion matches for ${profileId}:`,
      error,
    );

    return [];
  }
}

/** Returns the match entry belonging to the given profile, if present. */
export function getAoe2CompanionMatchPlayer(
  match: Aoe2CompanionMatch,
  profileId: number,
): Aoe2CompanionMatchPlayer | undefined {
  for (const team of match.teams) {
    const player = team.players.find((p) => p.profileId === profileId);
    if (player) return player;
  }

  return undefined;
}

/** Returns every player in the match that is not on the given profile's team. */
export function getAoe2CompanionMatchOpponents(
  match: Aoe2CompanionMatch,
  profileId: number,
): Aoe2CompanionMatchPlayer[] {
  const ownPlayer = getAoe2CompanionMatchPlayer(match, profileId);
  const opponents: Aoe2CompanionMatchPlayer[] = [];

  for (const team of match.teams) {
    for (const player of team.players) {
      if (player.profileId === profileId) continue;

      if (ownPlayer && player.team === ownPlayer.team) continue;

      opponents.push(player);
    }
  }

  return opponents;
}
