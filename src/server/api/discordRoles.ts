import { TRPCError } from "@trpc/server";
import {
  getDiscordRoleApiConfig,
  syncDiscordRoles,
  type DiscordRoleApiAttempt,
  type DiscordRoleApiMember,
  type DiscordRoleApiMemberResult,
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
  | "duplicate_discord_id"
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
  roleId: string | null;
}

const INVALID_REQUEST_CODES = new Set([
  "INVALID_BODY",
  "INVALID_ID",
  "INVALID_JSON",
]);

const MAX_MEMBERS_PER_REQUEST = 200;

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;
const MAX_GROUP_NAME_LENGTH = 64;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

const roleGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(64, "Group name must be at most 64 characters"),
  roleId: z
    .string()
    .trim()
    .regex(
      SNOWFLAKE_PATTERN,
      "Role ID must be a Discord role snowflake (17-20 digits)",
    ),
});

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

function memberErrorStatus(code: string | undefined): DiscordRoleSyncStatus {
  switch (code) {
    case "MEMBER_NOT_FOUND":
      return "member_not_found";
    case "INVALID_BODY":
    case "INVALID_ID":
      return "invalid_request";
    case "UNAUTHORIZED":
      return "unauthorized";
    case "DISCORD_RATE_LIMITED":
    case "RATE_LIMITED":
      return "rate_limited";
    case "DISCORD_NOT_CONNECTED":
      return "unavailable";
    case "ROLE_NOT_FOUND":
    case "DISCORD_GUILD_UNAVAILABLE":
    case "DISCORD_MISSING_ACCESS":
    case "DISCORD_PERMISSION_DENIED":
    case "DISCORD_BAD_REQUEST":
    case "DISCORD_MEMBER_HIERARCHY":
      return "discord_api_error";
    case "INTERNAL_ERROR":
      return "server_error";
    default:
      return "error";
  }
}

function classifyMemberResult(
  target: SyncTarget,
  member: DiscordRoleApiMemberResult,
  httpStatus: number,
): DiscordRoleSyncResult {
  const base = baseResult(target);

  if (member.ok) {
    return {
      ...base,
      status: member.changed ? "synced" : "already_assigned",
      httpStatus,
      roleId:
        member.roleId.length > 0 ? member.roleId : (target.roleId ?? undefined),
      changed: member.changed,
      alreadyAssigned: member.alreadyAssigned,
      removedRoleIds: member.removedRoleIds,
    };
  }

  return {
    ...base,
    status: memberErrorStatus(member.error?.code),
    httpStatus,
    roleId:
      member.roleId.length > 0 ? member.roleId : (target.roleId ?? undefined),
    errorCode: member.error?.code,
    errorMessage: member.error?.message,
  };
}

function requestLevelStatus(
  attempt: DiscordRoleApiAttempt,
): DiscordRoleSyncStatus {
  const error =
    attempt.payload?.success === false ? attempt.payload.error : undefined;

  switch (attempt.httpStatus) {
    case 400:
      return error?.code && INVALID_REQUEST_CODES.has(error.code)
        ? "invalid_request"
        : "config_error";
    case 401:
      return "unauthorized";
    case 404:
      return "member_not_found";
    case 429:
      return "rate_limited";
    case 502:
      return "discord_api_error";
    case 503:
      return "unavailable";
    case 500:
      return "server_error";
    default:
      return "error";
  }
}

function summarize(results: DiscordRoleSyncResult[]): DiscordRoleSyncSummary {
  const synced = results.filter((r) => r.status === "synced").length;
  const alreadyAssigned = results.filter(
    (r) => r.status === "already_assigned",
  ).length;
  const skipped = results.filter((r) =>
    [
      "no_discord_id",
      "duplicate_discord_id",
      "member_not_found",
      "aborted",
    ].includes(r.status),
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

async function ensureGroupNameAvailable(name: string, exceptId?: string) {
  const existing = await discordRoleRepository.getRoleGroupByName(name);

  if (existing && existing.id !== exceptId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `A Discord role group named "${name}" already exists.`,
    });
  }
}

export const discordRolesRouter = createTRPCRouter({
  listGroups: adminProcedure.query(async () => {
    return discordRoleRepository.listRoleGroups();
  }),

  createGroup: adminProcedure
    .input(roleGroupSchema)
    .mutation(async ({ input }) => {
      await ensureGroupNameAvailable(input.name);
      return discordRoleRepository.createRoleGroup(input);
    }),

  updateGroup: adminProcedure
    .input(z.object({ id: z.string(), data: roleGroupSchema }))
    .mutation(async ({ input }) => {
      const existing = await discordRoleRepository.getRoleGroupById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Discord role group not found.",
        });
      }

      await ensureGroupNameAvailable(input.data.name, input.id);
      return discordRoleRepository.updateRoleGroup(input.id, input.data);
    }),

  deleteGroup: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return discordRoleRepository.deleteRoleGroup(input.id);
    }),

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

      const [targets, roleGroups] = await Promise.all([
        discordRoleRepository.getTournamentRoleTargets(input.tournamentId),
        discordRoleRepository.listRoleGroups(),
      ]);

      const syncTargets: SyncTarget[] = targets.groups.flatMap((group) =>
        group.participants.map((participant) => ({
          ...participant,
          groupId: group.id,
          group: group.name,
          roleId: group.roleId,
        })),
      );

      const groupRoleIds = Array.from(
        new Set(
          roleGroups
            .map((group) => group.roleId)
            .filter((roleId) => SNOWFLAKE_PATTERN.test(roleId)),
        ),
      );

      const results = new Array<DiscordRoleSyncResult | undefined>(
        syncTargets.length,
      );
      const pending: Array<{
        index: number;
        target: SyncTarget;
        member: DiscordRoleApiMember;
      }> = [];
      const seenDiscordIds = new Set<string>();

      syncTargets.forEach((target, index) => {
        if (!target.discordId) {
          results[index] = { ...baseResult(target), status: "no_discord_id" };
          return;
        }

        if (!SNOWFLAKE_PATTERN.test(target.discordId)) {
          results[index] = {
            ...baseResult(target),
            status: "invalid_request",
            errorMessage: `Discord ID ${target.discordId} is not a valid Discord snowflake.`,
          };
          return;
        }

        if (!target.roleId) {
          results[index] = {
            ...baseResult(target),
            status: "config_error",
            errorMessage: `No Discord role is configured for group "${target.group}".`,
          };
          return;
        }

        if (!SNOWFLAKE_PATTERN.test(target.roleId)) {
          results[index] = {
            ...baseResult(target),
            status: "config_error",
            roleId: target.roleId,
            errorMessage: `The role ID configured for group "${target.group}" is not a valid Discord snowflake.`,
          };
          return;
        }

        if (
          target.group.trim().length === 0 ||
          target.group.length > MAX_GROUP_NAME_LENGTH ||
          CONTROL_CHARACTERS.test(target.group)
        ) {
          results[index] = {
            ...baseResult(target),
            status: "config_error",
            roleId: target.roleId,
            errorMessage: `Group name "${target.group}" cannot be sent to the bot (1-${MAX_GROUP_NAME_LENGTH} characters, no control characters).`,
          };
          return;
        }

        if (seenDiscordIds.has(target.discordId)) {
          results[index] = {
            ...baseResult(target),
            status: "duplicate_discord_id",
            errorMessage: `Discord ID ${target.discordId} appears in more than one group; only the first occurrence is synced.`,
          };
          return;
        }

        seenDiscordIds.add(target.discordId);
        pending.push({
          index,
          target,
          member: {
            discordId: target.discordId,
            roleId: target.roleId,
            group: target.group,
          },
        });
      });

      if (groupRoleIds.length === 0) {
        const configError =
          "No Discord role groups are configured. Add at least one group and role ID first.";

        for (const { index, target } of pending) {
          results[index] = {
            ...baseResult(target),
            status: "config_error",
            errorMessage: configError,
          };
        }

        const filledResults = Array.from(
          results,
          (result) =>
            result ?? {
              participantId: "",
              nickname: "",
              userName: null,
              playerNumber: null,
              discordId: null,
              groupId: "",
              group: "",
              status: "error" as const,
            },
        );

        return {
          configError,
          summary: summarize(filledResults),
          results: filledResults,
        };
      }

      for (
        let start = 0;
        start < pending.length;
        start += MAX_MEMBERS_PER_REQUEST
      ) {
        const chunk = pending.slice(start, start + MAX_MEMBERS_PER_REQUEST);
        const attempt = await syncDiscordRoles(
          chunk.map((entry) => entry.member),
          groupRoleIds,
        );

        if (attempt.httpStatus === null) {
          for (const { index, target } of chunk) {
            results[index] = {
              ...baseResult(target),
              status: "network_error",
              errorMessage:
                attempt.networkError ?? "The bot could not be reached.",
            };
          }

          for (const { index, target } of pending.slice(start + chunk.length)) {
            results[index] = {
              ...baseResult(target),
              status: "aborted",
              errorMessage: "Skipped because the bot could not be reached.",
            };
          }
          break;
        }

        const payload = attempt.payload;

        if (
          attempt.httpStatus >= 200 &&
          attempt.httpStatus < 300 &&
          payload?.success === true
        ) {
          const resultByDiscordId = new Map(
            payload.data.results.map((result) => [result.discordId, result]),
          );

          for (const { index, target, member } of chunk) {
            const memberResult = resultByDiscordId.get(member.discordId);

            if (!memberResult) {
              results[index] = {
                ...baseResult(target),
                status: "error",
                httpStatus: attempt.httpStatus,
                errorMessage:
                  "The bot did not return a result for this member.",
              };
              continue;
            }

            const result = classifyMemberResult(
              target,
              memberResult,
              attempt.httpStatus,
            );
            results[index] = result;
            logResult(result);
          }

          continue;
        }

        const error = payload?.success === false ? payload.error : undefined;
        const status = requestLevelStatus(attempt);

        for (const { index, target } of chunk) {
          results[index] = {
            ...baseResult(target),
            status,
            httpStatus: attempt.httpStatus,
            errorCode: error?.code,
            errorMessage:
              error?.message ??
              attempt.rawBody ??
              `The bot responded with HTTP ${attempt.httpStatus}.`,
            requestId: error?.requestId,
            retryAfterSeconds: attempt.retryAfterSeconds,
            rawResponse: payload ?? attempt.rawBody,
          };
        }

        for (const { index, target } of pending.slice(start + chunk.length)) {
          results[index] = {
            ...baseResult(target),
            status: "aborted",
            errorMessage:
              "Skipped because the bot rejected the previous request.",
          };
        }
        break;
      }

      const filledResults = Array.from(
        results,
        (result) =>
          result ?? {
            participantId: "",
            nickname: "",
            userName: null,
            playerNumber: null,
            discordId: null,
            groupId: "",
            group: "",
            status: "aborted" as const,
            errorMessage: "The request did not complete.",
          },
      );

      return {
        configError: undefined,
        summary: summarize(filledResults),
        results: filledResults,
      };
    }),
});
