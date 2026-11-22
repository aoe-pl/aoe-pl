"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { AlertCircle, Bot, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DiscordRoleGroups } from "./discord-role-groups";

export interface DiscordRoleTournamentOption {
  id: string;
  name: string;
}

type SyncResult = RouterOutputs["discordRoles"]["syncTournament"];
type SyncRow = SyncResult["results"][number];
type SyncStatus = SyncRow["status"];

const STATUS_LABEL_KEYS = {
  synced: "status.synced",
  already_assigned: "status.already_assigned",
  no_discord_id: "status.no_discord_id",
  duplicate_discord_id: "status.duplicate_discord_id",
  member_not_found: "status.member_not_found",
  invalid_request: "status.invalid_request",
  config_error: "status.config_error",
  unauthorized: "status.unauthorized",
  rate_limited: "status.rate_limited",
  discord_api_error: "status.discord_api_error",
  unavailable: "status.unavailable",
  server_error: "status.server_error",
  network_error: "status.network_error",
  aborted: "status.aborted",
  error: "status.error",
} as const;

const SKIPPED_STATUSES: SyncStatus[] = [
  "no_discord_id",
  "duplicate_discord_id",
  "member_not_found",
  "aborted",
];

interface DiscordRoleSyncTesterProps {
  tournaments: DiscordRoleTournamentOption[];
}

export function DiscordRoleSyncTester({
  tournaments,
}: DiscordRoleSyncTesterProps) {
  const t = useTranslations("admin.discordRoles");
  const [tournamentId, setTournamentId] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  const targetsQuery = api.discordRoles.getTournamentTargets.useQuery(
    { tournamentId },
    { enabled: tournamentId.length > 0 },
  );
  const syncMutation = api.discordRoles.syncTournament.useMutation();

  const targetRows = useMemo(() => {
    if (!targetsQuery.data) return [];

    return targetsQuery.data.groups.flatMap((group) =>
      group.participants.map((participant) => ({
        ...participant,
        groupId: group.id,
        groupName: group.name,
        groupColor: group.color,
        roleId: group.roleId,
      })),
    );
  }, [targetsQuery.data]);

  const resultByTarget = useMemo(() => {
    const map = new Map<string, SyncRow>();
    for (const row of result?.results ?? []) {
      map.set(`${row.participantId}:${row.groupId}`, row);
    }
    return map;
  }, [result]);

  const missingDiscordId =
    (targetsQuery.data?.totalParticipants ?? 0) -
    (targetsQuery.data?.withDiscordId ?? 0);

  const handleTournamentChange = (value: string) => {
    setTournamentId(value);
    setResult(null);
  };

  const handleSync = async () => {
    setResult(null);

    try {
      const data = await syncMutation.mutateAsync({ tournamentId });
      setResult(data);

      if (data.configError) {
        toast.error(data.configError);
      } else {
        toast.success(
          t("toast.success", {
            synced: data.summary.synced,
            alreadyAssigned: data.summary.alreadyAssigned,
          }),
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.error"));
    }
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-medieval-gold flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bot className="h-6 w-6" />
          {t("page_title")}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("page_description")}
        </p>
      </div>

      <DiscordRoleGroups onChanged={() => void targetsQuery.refetch()} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("select_tournament")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={tournamentId}
            onValueChange={handleTournamentChange}
          >
            <SelectTrigger
              id="discord-role-tournament"
              className="w-full max-w-lg"
            >
              <SelectValue placeholder={t("select_tournament_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem
                  key={tournament.id}
                  value={tournament.id}
                >
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {tournamentId && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">{t("targets_title")}</CardTitle>
              <CardDescription>{t("targets_description")}</CardDescription>
            </div>
            <Button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncMutation.isPending || targetRows.length === 0}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {syncMutation.isPending ? t("syncing") : t("sync_button")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {t("participants", { count: targetRows.length })}
              </Badge>
              {missingDiscordId > 0 && (
                <Badge
                  variant="outline"
                  className="text-amber-300"
                >
                  {t("missing_discord", { count: missingDiscordId })}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground text-xs">{t("sync_hint")}</p>

            {targetsQuery.isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loading_targets")}
              </div>
            )}

            {targetsQuery.error && (
              <div
                role="alert"
                className="border-medieval-danger bg-medieval-danger/10 flex items-start gap-2 rounded-md border p-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="break-all">{targetsQuery.error.message}</p>
              </div>
            )}

            {!targetsQuery.isLoading && targetRows.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("no_groups")}</p>
            )}

            {targetRows.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("player")}</TableHead>
                    <TableHead>{t("discord_id")}</TableHead>
                    <TableHead>{t("target_group")}</TableHead>
                    <TableHead>{t("status_column")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetRows.map((row) => {
                    const rowResult = resultByTarget.get(
                      `${row.participantId}:${row.groupId}`,
                    );

                    return (
                      <TableRow key={`${row.groupId}:${row.participantId}`}>
                        <TableCell>
                          <div className="font-medium">{row.nickname}</div>
                          <div className="text-muted-foreground text-xs">
                            {[
                              row.playerNumber ? `#${row.playerNumber}` : null,
                              row.userName,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.discordId ? (
                            <code className="text-xs">{row.discordId}</code>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              {t("not_linked")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="border-border size-2.5 rounded-full border"
                              style={{
                                backgroundColor: row.groupColor ?? undefined,
                              }}
                            />
                            {row.groupName}
                          </span>
                          {row.roleId ? (
                            <code className="text-muted-foreground mt-1 block text-xs">
                              {row.roleId}
                            </code>
                          ) : (
                            <Badge
                              variant="outline"
                              className="mt-1 text-amber-300"
                            >
                              {t("role_not_configured")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rowResult ? (
                            <StatusBadge
                              status={rowResult.status}
                              label={t(STATUS_LABEL_KEYS[rowResult.status])}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("results_title")}</CardTitle>
            <CardDescription>{t("results_description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.configError && (
              <div
                role="alert"
                className="border-medieval-danger bg-medieval-danger/10 flex items-start gap-2 rounded-md border p-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{result.configError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <SummaryValue
                label={t("summary_total")}
                value={result.summary.total}
              />
              <SummaryValue
                label={t("summary_synced")}
                value={result.summary.synced}
                tone="success"
              />
              <SummaryValue
                label={t("summary_already")}
                value={result.summary.alreadyAssigned}
                tone="gold"
              />
              <SummaryValue
                label={t("summary_skipped")}
                value={result.summary.skipped}
              />
              <SummaryValue
                label={t("summary_failed")}
                value={result.summary.failed}
                tone="danger"
              />
            </div>

            {result.results.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("player")}</TableHead>
                    <TableHead>{t("target_group")}</TableHead>
                    <TableHead>{t("status_column")}</TableHead>
                    <TableHead>{t("http")}</TableHead>
                    <TableHead>{t("details")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((row, index) => (
                    <TableRow
                      key={`${row.groupId}:${row.participantId}:${index}`}
                    >
                      <TableCell>
                        <div className="font-medium">{row.nickname}</div>
                        <code className="text-muted-foreground text-xs">
                          {row.discordId ?? "—"}
                        </code>
                      </TableCell>
                      <TableCell>{row.group}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={row.status}
                          label={t(STATUS_LABEL_KEYS[row.status])}
                        />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.httpStatus ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <ResultDetails row={row} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <details className="rounded-md border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {t("raw_response")}
              </summary>
              <pre className="bg-muted/50 max-h-[32rem] overflow-auto p-3 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status, label }: { status: SyncStatus; label: string }) {
  const isSkipped = SKIPPED_STATUSES.includes(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        status === "synced" && "bg-emerald-500/15 text-emerald-400",
        status === "already_assigned" &&
          "bg-medieval-gold/15 text-medieval-gold",
        isSkipped && "text-muted-foreground",
        status !== "synced" &&
          status !== "already_assigned" &&
          !isSkipped &&
          "bg-red-500/15 text-red-300",
      )}
    >
      {label}
    </Badge>
  );
}

function SummaryValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "gold" | "danger";
}) {
  return (
    <div className="bg-muted/30 rounded-md border p-3">
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </p>
      <p
        className={cn(
          "text-xl font-semibold tabular-nums",
          tone === "success" && "text-emerald-400",
          tone === "gold" && "text-medieval-gold",
          tone === "danger" && value > 0 && "text-red-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ResultDetails({ row }: { row: SyncRow }) {
  const details: string[] = [];

  if (row.roleId) details.push(`roleId: ${row.roleId}`);
  if (row.changed !== undefined) {
    details.push(`changed: ${row.changed ? "true" : "false"}`);
  }
  if (row.alreadyAssigned !== undefined) {
    details.push(`alreadyAssigned: ${row.alreadyAssigned ? "true" : "false"}`);
  }
  if (row.removedRoleIds !== undefined) {
    details.push(
      `removedRoleIds: ${row.removedRoleIds.length > 0 ? row.removedRoleIds.join(", ") : "none"}`,
    );
  }
  if (row.errorCode) details.push(row.errorCode);
  if (row.errorMessage) details.push(row.errorMessage);
  if (row.requestId) details.push(`requestId: ${row.requestId}`);
  if (row.retryAfterSeconds !== undefined) {
    details.push(`Retry-After: ${row.retryAfterSeconds}s`);
  }

  if (details.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1 text-xs break-all whitespace-normal">
      {details.map((detail) => (
        <p key={detail}>{detail}</p>
      ))}
    </div>
  );
}
