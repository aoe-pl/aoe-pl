/**
 * Client for the public AoE2Companion profile API.
 */

const aoe2CompanionApi = "https://data.aoe2companion.com/api/profiles";

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
