import "server-only";

import { env } from "@/env";

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;
const MAX_RETRY_WAIT_MS = 20_000;

export interface DiscordRoleApiMember {
  discordId: string;
  roleId: string;
  group: string;
}

export interface DiscordRoleApiMemberResult {
  discordId: string;
  roleId: string;
  group: string | null;
  ok: boolean;
  changed?: boolean;
  alreadyAssigned?: boolean;
  removedRoleIds?: string[];
  error?: {
    code: string;
    message: string;
  };
}

export interface DiscordRoleApiSuccessPayload {
  success: true;
  data: {
    requestId?: string;
    summary?: {
      total: number;
      succeeded: number;
      failed: number;
      changed: number;
    };
    results: DiscordRoleApiMemberResult[];
  };
}

export interface DiscordRoleApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export type DiscordRoleApiPayload =
  | DiscordRoleApiSuccessPayload
  | DiscordRoleApiErrorPayload;

export interface DiscordRoleApiAttempt {
  /** `null` means the request never reached the bot (network/timeout). */
  httpStatus: number | null;
  payload?: DiscordRoleApiPayload;
  rawBody?: string;
  retryAfterSeconds?: number;
  networkError?: string;
}

/**
 * Accepts both `https://bot.example.com` and `bot.example.com`, matching the
 * loose handling used for `SITE_URL` elsewhere. The URL is intentionally not
 * validated at startup, so a malformed value can never prevent the app from
 * booting.
 */
function normalizeApiUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const scheme = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)/i.test(trimmed)
    ? "http"
    : "https";

  return `${scheme}://${trimmed}`;
}

export function getDiscordRoleApiConfig(): {
  apiUrl: string | null;
  configured: boolean;
} {
  const apiUrl = normalizeApiUrl(env.DISCORD_ROLE_API_URL);
  const configured = Boolean(apiUrl && env.DISCORD_ROLE_API_SECRET);

  return { apiUrl, configured };
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }

  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readResponseBody(response: Response): Promise<{
  payload?: DiscordRoleApiPayload;
  rawBody?: string;
}> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return {};
  }

  if (!text) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return { payload: parsed as DiscordRoleApiPayload, rawBody: text };
    }
  } catch {
    // Non-JSON responses are reported as raw text below.
  }

  return { rawBody: text };
}

/** Retries 429/503 three times and 500 once. */
function shouldRetry(status: number, attempt: number): boolean {
  if (status === 429 || status === 503) {
    return attempt < MAX_ATTEMPTS - 1;
  }
  if (status === 500) {
    return attempt < 1;
  }
  return false;
}

/**
 * Calls the role bot for a batch of Discord members.
 *
 * The bot is idempotent, so retrying after transient failures is safe. A
 * 429 response is retried only after the delay advertised in `Retry-After`;
 * if that delay is longer than we are willing to hold the request open, the
 * response is returned to the caller instead of blocking for minutes.
 */
export async function syncDiscordRoles(
  members: DiscordRoleApiMember[],
  groupRoleIds: string[],
): Promise<DiscordRoleApiAttempt> {
  const { apiUrl, configured } = getDiscordRoleApiConfig();
  const secret = env.DISCORD_ROLE_API_SECRET;

  if (!apiUrl || !secret || !configured) {
    throw new Error(
      "Discord role API is not configured. Set DISCORD_ROLE_API_URL and DISCORD_ROLE_API_SECRET.",
    );
  }

  const url = `${apiUrl}/api/roles/sync`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupRoleIds, members }),
        signal: controller.signal,
      });

      const { payload, rawBody } = await readResponseBody(response);

      if (response.status === 429) {
        const retryAfterSeconds = parseRetryAfter(
          response.headers.get("retry-after"),
        );

        if (shouldRetry(response.status, attempt)) {
          const waitMs =
            retryAfterSeconds !== undefined
              ? retryAfterSeconds * 1000
              : 1000 * 2 ** attempt;

          if (waitMs > MAX_RETRY_WAIT_MS) {
            return {
              httpStatus: response.status,
              payload,
              rawBody,
              retryAfterSeconds,
            };
          }

          await sleep(waitMs);
          continue;
        }

        return {
          httpStatus: response.status,
          payload,
          rawBody,
          retryAfterSeconds,
        };
      }

      if (shouldRetry(response.status, attempt)) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }

      return { httpStatus: response.status, payload, rawBody };
    } catch (error) {
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(500 * 2 ** attempt);
        continue;
      }

      return {
        httpStatus: null,
        networkError:
          error instanceof Error ? error.message : "Unknown network error",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { httpStatus: null, networkError: "Request failed after retries" };
}
