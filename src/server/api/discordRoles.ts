import {
  getDiscordRoleApiConfig,
  syncDiscordRole,
  type DiscordRoleApiAttempt,
} from "@/lib/discord-role-api";
import {
  discordRoleRepository,
  type DiscordRoleTargetParticipant,
} from "@/lib/repositories/discordRoleRepository";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";

export type DiscordRoleSyncStatus =
  | "synced"
  | "already_assigned"
  | "no_discord_id"
  | "member_not_found"
  | "invalid_request"
  | "config_error"
  | "unauthorized"
  | "rate_limited"
  | "discord_api_error"
  | "unavailable"
  | "server_error"
  | "network_error"
  | "aborted"
  | "error";

export interface DiscordRoleSyncResult {
  participantId: string;
  nickname: string;
  userName: string | null;
  playerNumber: number | null;
  discordId: string | null;
  groupId: string;
  group: string;
  status: DiscordRoleSyncStatus;
  httpStatus?: number;
  roleId?: string;
  changed?: boolean;
  alreadyAssigned?: boolean;
  removedRoleIds?: string[];
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  retryAfterSeconds?: number;
  rawResponse?: unknown;
}

export interface DiscordRoleSyncSummary {
  total: number;
  synced: number;
  alreadyAssigned: number;
  skipped: number;
  failed: number;
}

interface SyncTarget extends DiscordRoleTargetParticipant {
  groupId: string;
  group: string;
}

const INVALID_REQUEST_CODES = new Set([
  "INVALID_BODY",
  "INVALID_ID",
  "INVALID_JSON",
]);

function emptySummary(): DiscordRoleSyncSummary {
  return { total: 0, synced: 0, alreadyAssigned: 0, skipped: 0, failed: 0 };
}

function baseResult(target: SyncTarget) {
  return {
    participantId: target.participantId,
    nickname: target.nickname,
    userName: target.userName,
    playerNumber: target.playerNumber,
    discordId: target.discordId,
    groupId: target.groupId,
    group: target.group,
  };
}

function classifyAttempt(
  target: SyncTarget,
  attempt: DiscordRoleApiAttempt,
): DiscordRoleSyncResult {
  const base = baseResult(target);

  if (attempt.httpStatus === null) {
    return {
      ...base,
      status: "network_error",
      errorMessage: attempt.networkError ?? "The bot could not be reached.",
    };
  }

  const payload = attempt.payload;
  const error = payload?.success === false ? payload.error : undefined;
  const rawResponse = payload ?? attempt.rawBody;

  if (attempt.httpStatus >= 200 && attempt.httpStatus < 300) {
    if (payload?.success === true) {
      return {
        ...base,
        status: payload.data.changed ? "synced" : "already_assigned",
        httpStatus: attempt.httpStatus,
        roleId: payload.data.roleId,
        changed: payload.data.changed,
        alreadyAssigned: payload.data.alreadyAssigned,
        removedRoleIds: payload.data.removedRoleIds,
        rawResponse,
      };
    }

    return {
      ...base,
      status: "config_error",
      httpStatus: attempt.httpStatus,
      errorCode: error?.code,
      errorMessage:
        error?.message ?? "The bot returned an unexpected response body.",
      requestId: error?.requestId,
      rawResponse,
    };
  }

  let status: DiscordRoleSyncStatus;
  switch (attempt.httpStatus) {
    case 400:
      status =
        error?.code && INVALID_REQUEST_CODES.has(error.code)
          ? "invalid_request"
          : "config_error";
      break;
    case 401:
      status = "unauthorized";
      break;
    case 404:
      status = "member_not_found";
      break;
    case 429:
      status = "rate_limited";
      break;
    case 502:
      status = "discord_api_error";
      break;
    case 503:
      status = "unavailable";
      break;
    case 500:
      status = "server_error";
      break;
    default:
      status = "error";
  }

  return {
    ...base,
    status,
    httpStatus: attempt.httpStatus,
    errorCode: error?.code,
    errorMessage:
      error?.message ??
      attempt.rawBody ??
      `The bot responded with HTTP ${attempt.httpStatus}.`,
    requestId: error?.requestId,
    retryAfterSeconds: attempt.retryAfterSeconds,
    rawResponse,
  };
}

function summarize(results: DiscordRoleSyncResult[]): DiscordRoleSyncSummary {
  const synced = results.filter((r) => r.status === "synced").length;
  const alreadyAssigned = results.filter(
    (r) => r.status === "already_assigned",
  ).length;
  const skipped = results.filter((r) =>
    ["no_discord_id", "member_not_found", "aborted"].includes(r.status),
  ).length;

  return {
    total: results.length,
    synced,
    alreadyAssigned,
    skipped,
    failed: results.length - synced - alreadyAssigned - skipped,
  };
}

function logResult(result: DiscordRoleSyncResult) {
  if (
    result.status === "synced" ||
    result.status === "already_assigned" ||
    result.status === "no_discord_id"
  ) {
    return;
  }

  console.error(
    `[discord-role-sync] ${result.status} for discordId=${result.discordId ?? "none"} group="${result.group}"` +
      ` http=${result.httpStatus ?? "n/a"}` +
      ` code=${result.errorCode ?? "n/a"}` +
      ` requestId=${result.requestId ?? "n/a"}` +
      ` message=${result.errorMessage ?? "n/a"}`,
  );
}

export const discordRolesRouter = createTRPCRouter({
  getTournamentTargets: adminProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      return discordRoleRepository.getTournamentRoleTargets(input.tournamentId);
    }),

  syncTournament: adminProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      const { configured } = getDiscordRoleApiConfig();

      if (!configured) {
        return {
          configError:
            "Discord role API is not configured. Set DISCORD_ROLE_API_URL and DISCORD_ROLE_API_SECRET.",
          summary: emptySummary(),
          results: [] as DiscordRoleSyncResult[],
        };
      }

      const targets = await discordRoleRepository.getTournamentRoleTargets(
        input.tournamentId,
      );

      const syncTargets: SyncTarget[] = targets.groups.flatMap((group) =>
        group.participants.map((participant) => ({
          ...participant,
          groupId: group.id,
          group: group.name,
        })),
      );

      const results: DiscordRoleSyncResult[] = [];

      for (let index = 0; index < syncTargets.length; index++) {
        const target = syncTargets[index]!;

        if (!target.discordId) {
          results.push({ ...baseResult(target), status: "no_discord_id" });
          continue;
        }

        const attempt = await syncDiscordRole(target.discordId, target.group);
        const result = classifyAttempt(target, attempt);
        results.push(result);
        logResult(result);

        // A secret mismatch affects every request, so stop instead of burning
        // through the whole roster with guaranteed 401s.
        if (result.status === "unauthorized") {
          for (const remaining of syncTargets.slice(index + 1)) {
            results.push({
              ...baseResult(remaining),
              status: "aborted",
              errorMessage:
                "Skipped after the bot rejected the API secret (HTTP 401).",
            });
          }
          break;
        }
      }

      return {
        configError: undefined,
        summary: summarize(results),
        results,
      };
    }),
});
