import "server-only";

import { env } from "@/env";

/**
 * Minimal client for the Twitch Helix API, used to detect which of our
 * players are currently streaming Age of Empires.
 */

const tokenEndpoint = "https://id.twitch.tv/oauth2/token";
const streamsEndpoint = "https://api.twitch.tv/helix/streams";

/** How long (in seconds) a fetched live-streams response is cached. */
const streamsCacheSeconds = 60;

/** Games that count as "Age of Empires" (matched case-insensitively). */
const ageOfEmpiresGamePattern = /age of empires/i;

/** Twitch allows at most 100 `user_login` parameters per request. */
const maxLoginsPerRequest = 100;

/** True when Twitch credentials are configured. */
export const isTwitchConfigured = Boolean(
  env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET,
);

export interface LiveTwitchStream {
  /** Lowercase channel name. */
  login: string;
  userName: string;
  title: string;
  gameName: string;
  viewerCount: number;
  startedAt: string | null;
  thumbnailUrl: string;
  url: string;
}

interface TwitchStreamPayload {
  user_login: string;
  user_name: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Returns a Twitch app access token, reusing a cached one until shortly before
 * it expires. Returns null when Twitch is not configured or the request fails.
 */
async function getAppAccessToken(): Promise<string | null> {
  const clientId = env.TWITCH_CLIENT_ID;
  const clientSecret = env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const response = await fetch(`${tokenEndpoint}?${params.toString()}`, {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch Twitch app token: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) return null;

    // Refresh a minute before the token actually expires.
    const expiresIn = (data.expires_in ?? 3600) - 60;
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return tokenCache.accessToken;
  } catch (error) {
    console.error("Error fetching Twitch app token:", error);
    return null;
  }
}

interface StreamsCache {
  key: string;
  expiresAt: number;
  streams: LiveTwitchStream[];
}

let streamsCache: StreamsCache | null = null;

/**
 * Fetches the currently live streams for the given channel logins and keeps
 * only those that are streaming an Age of Empires game. Results are cached for
 * a short while so we don't hammer the Twitch API on every request.
 */
export async function fetchLiveAgeOfEmpiresStreams(
  logins: string[],
): Promise<LiveTwitchStream[]> {
  const clientId = env.TWITCH_CLIENT_ID;
  const uniqueLogins = [
    ...new Set(logins.map((login) => login.toLowerCase()).filter(Boolean)),
  ].sort();

  if (!clientId || uniqueLogins.length === 0) return [];

  const cacheKey = uniqueLogins.join(",");
  if (
    streamsCache &&
    streamsCache.key === cacheKey &&
    streamsCache.expiresAt > Date.now()
  ) {
    return streamsCache.streams;
  }

  const accessToken = await getAppAccessToken();
  if (!accessToken) return [];

  const streams: LiveTwitchStream[] = [];

  for (let i = 0; i < uniqueLogins.length; i += maxLoginsPerRequest) {
    const batch = uniqueLogins.slice(i, i + maxLoginsPerRequest);
    const params = new URLSearchParams({ first: "100" });
    for (const login of batch) params.append("user_login", login);

    try {
      const response = await fetch(`${streamsEndpoint}?${params.toString()}`, {
        headers: {
          "Client-Id": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch Twitch streams: ${response.status} ${response.statusText}`,
        );
        continue;
      }

      const data = (await response.json()) as {
        data?: TwitchStreamPayload[];
      };

      for (const stream of data.data ?? []) {
        if (stream.type !== "live") continue;
        if (!ageOfEmpiresGamePattern.test(stream.game_name ?? "")) continue;

        streams.push({
          login: stream.user_login.toLowerCase(),
          userName: stream.user_name,
          title: stream.title,
          gameName: stream.game_name,
          viewerCount: stream.viewer_count,
          startedAt: stream.started_at ?? null,
          thumbnailUrl: (stream.thumbnail_url ?? "").replace(
            "{width}x{height}",
            "640x360",
          ),
          url: `https://twitch.tv/${stream.user_login}`,
        });
      }
    } catch (error) {
      console.error("Error fetching Twitch streams:", error);
    }
  }

  streamsCache = {
    key: cacheKey,
    expiresAt: Date.now() + streamsCacheSeconds * 1000,
    streams,
  };

  return streams;
}
