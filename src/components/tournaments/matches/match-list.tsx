"use client";

import { ADMIN_MARKER_META } from "@/components/tournaments/matches/admin-stream-marker";
import { STREAM_TYPE_META } from "@/components/tournaments/matches/stream-type-meta";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isBrightColor } from "@/lib/utils";
import type { AdminStreamStatus, StreamType } from "@prisma/client";
import { format } from "date-fns";
import { CalendarClock, CircleCheck, CircleDashed, Tv } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface MatchListRow {
  id: string;
  matchNumber: number;
  matchDate: Date | null;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "ADMIN_APPROVED";
  adminStreamStatus: AdminStreamStatus | null;
  group: { id: string; name: string; color: string | null } | null;
  TournamentMatchParticipant: {
    participant: {
      id: string;
      nickname: string;
      user: { name: string | null } | null;
    } | null;
    team: { id: string; name: string } | null;
  }[];
  TournamentMatchStream: {
    id: string;
    status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
    streamType: StreamType | null;
    streamer: { id: string; name: string | null; playerNumber: number };
  }[];
}

type SortKey = "date-asc" | "date-desc" | "group" | "player";
type StatusFilter = "ALL" | MatchListRow["status"];
type MarkerFilter = "ALL" | "NONE" | AdminStreamStatus;

const STATUS_LABEL_KEYS = {
  PENDING: "status.pending",
  SCHEDULED: "status.scheduled",
  COMPLETED: "status.completed",
  ADMIN_APPROVED: "status.admin_approved",
} as const;

const STATUS_FILTERS = [
  "PENDING",
  "SCHEDULED",
  "COMPLETED",
  "ADMIN_APPROVED",
] as const;

const MARKER_FILTERS: { value: MarkerFilter; labelKey: string }[] = [
  { value: "ALL", labelKey: "filters.all_markers" },
  { value: "NONE", labelKey: "filters.no_marker" },
  ...Object.entries(ADMIN_MARKER_META).map(([value, marker]) => ({
    value: value as AdminStreamStatus,
    labelKey: marker.labelKey,
  })),
];

/** Shared desktop column layout for the header and every row. */
const ROW_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_4rem_4rem_4rem_9.5rem] sm:items-center sm:gap-3";

function getSlotName(
  p: MatchListRow["TournamentMatchParticipant"][number],
): string {
  if (p.participant)
    return p.participant.nickname ?? p.participant.user?.name ?? "?";
  if (p.team) return p.team.name;
  return "TBD";
}

interface MatchListProps {
  matches: MatchListRow[];
  matchUrlBase: string;
  /** Admin markers and their filter are only rendered for admins. */
  showAdminMarker: boolean;
}

export function MatchList({
  matches,
  matchUrlBase,
  showAdminMarker,
}: MatchListProps) {
  const t = useTranslations("tournament.matches");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [markerFilter, setMarkerFilter] = useState<MarkerFilter>("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = matches.filter((m) => {
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;

      if (showAdminMarker && markerFilter !== "ALL") {
        if (
          markerFilter === "NONE"
            ? m.adminStreamStatus !== null
            : m.adminStreamStatus !== markerFilter
        ) {
          return false;
        }
      }

      if (!q) return true;
      const p1 = m.TournamentMatchParticipant[0];
      const p2 = m.TournamentMatchParticipant[1];
      const names = [
        p1 ? getSlotName(p1) : "",
        p2 ? getSlotName(p2) : "",
        m.group?.name ?? "",
      ].map((s) => s.toLowerCase());
      return names.some((n) => n.includes(q));
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "date-asc" || sort === "date-desc") {
        const da = a.matchDate?.getTime() ?? Infinity;
        const db = b.matchDate?.getTime() ?? Infinity;
        return sort === "date-asc" ? da - db : db - da;
      }
      if (sort === "group") {
        return (a.group?.name ?? "").localeCompare(b.group?.name ?? "");
      }
      if (sort === "player") {
        const pa = a.TournamentMatchParticipant[0];
        const pb = b.TournamentMatchParticipant[0];
        return (pa ? getSlotName(pa) : "").localeCompare(
          pb ? getSlotName(pb) : "",
        );
      }
      return 0;
    });

    return rows;
  }, [matches, search, sort, statusFilter, markerFilter, showAdminMarker]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder={t("search_players_or_group")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filters.all_statuses")}</SelectItem>
            {STATUS_FILTERS.map((status) => (
              <SelectItem
                key={status}
                value={status}
              >
                {t(STATUS_LABEL_KEYS[status])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showAdminMarker && (
          <Select
            value={markerFilter}
            onValueChange={(v) => setMarkerFilter(v as MarkerFilter)}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKER_FILTERS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc"> {t("date")} ↑</SelectItem>
            <SelectItem value="date-desc">{t("date")} ↓</SelectItem>
            <SelectItem value="group">{t("group")}</SelectItem>
            <SelectItem value="player">{t("player")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("no_matches")}</p>
      ) : (
        <div className="divide-y rounded-md border">
          <div
            className={`text-muted-foreground hidden px-4 py-2 text-xs font-medium ${ROW_GRID}`}
          >
            <span>{t("columns.players")}</span>
            <span>{t("columns.group")}</span>
            <span className="text-center">{t("columns.status")}</span>
            <span className="text-center">{t("columns.marker")}</span>
            <span className="text-center">{t("columns.stream")}</span>
            <span className="text-right">{t("columns.date")}</span>
          </div>

          {filtered.map((match) => {
            const p1 = match.TournamentMatchParticipant[0];
            const p2 = match.TournamentMatchParticipant[1];
            const player1 = p1 ? getSlotName(p1) : "TBD";
            const player2 = p2 ? getSlotName(p2) : "TBD";

            const labelColor = isBrightColor(match.group?.color ?? "")
              ? "#000"
              : "#fff";

            const adminMarker = match.adminStreamStatus
              ? ADMIN_MARKER_META[match.adminStreamStatus]
              : null;
            const AdminMarkerIcon = adminMarker?.icon;

            const activeStreams = match.TournamentMatchStream.filter(
              (stream) => stream.status !== "CANCELLED",
            );
            const isStreamed = activeStreams.length > 0;
            const streamTypes = [
              ...new Set(
                activeStreams
                  .map((stream) => stream.streamType)
                  .filter((type): type is StreamType => type !== null),
              ),
            ];

            const approved = match.status === "ADMIN_APPROVED";
            const completed = match.status === "COMPLETED";
            const scheduled = match.status === "SCHEDULED";
            const pending = match.status === "PENDING";

            return (
              <Link
                key={match.id}
                href={`${matchUrlBase}/${match.matchNumber}`}
                className={`hover:bg-muted/50 flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors ${ROW_GRID}`}
              >
                <span className="w-full min-w-0 truncate font-medium sm:w-auto">
                  {player1}
                  <span className="text-muted-foreground mx-2 font-normal">
                    vs
                  </span>
                  {player2}
                </span>

                <span className="min-w-0">
                  {match.group && (
                    <Badge
                      className="max-w-full truncate text-sm font-bold"
                      style={
                        match.group.color
                          ? {
                              backgroundColor: match.group.color,
                              color: labelColor,
                            }
                          : undefined
                      }
                    >
                      {match.group.name}
                    </Badge>
                  )}
                </span>

                <span className="flex items-center justify-center">
                  {pending && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <CircleDashed
                            className="text-muted-foreground size-4"
                            aria-hidden
                          />
                          <span className="sr-only">{t("status.pending")}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t("status.pending")}</TooltipContent>
                    </Tooltip>
                  )}
                  {scheduled && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <CalendarClock
                            className="size-4 text-blue-500"
                            aria-hidden
                          />
                          <span className="sr-only">
                            {t("status.scheduled")}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t("status.scheduled")}</TooltipContent>
                    </Tooltip>
                  )}
                  {approved && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <CircleCheck
                            className="size-4 text-green-500"
                            aria-hidden
                          />
                          <span className="sr-only">
                            {t("status.admin_approved")}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("status.admin_approved")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {completed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <CircleCheck
                            className="size-4 text-orange-500"
                            aria-hidden
                          />
                          <span className="sr-only">
                            {t("status.completed")}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t("status.completed")}</TooltipContent>
                    </Tooltip>
                  )}
                </span>

                <span className="flex items-center justify-center">
                  {showAdminMarker && adminMarker && AdminMarkerIcon && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <AdminMarkerIcon
                            className={`size-4 ${adminMarker.className}`}
                            aria-hidden
                          />
                          <span className="sr-only">
                            {t(adminMarker.labelKey)}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t(adminMarker.labelKey)}</TooltipContent>
                    </Tooltip>
                  )}
                </span>

                <span className="flex items-center justify-center gap-1">
                  {streamTypes.map((type) => {
                    const streamMeta = STREAM_TYPE_META[type];
                    const StreamIcon = streamMeta.icon;

                    return (
                      <Tooltip key={type}>
                        <TooltipTrigger asChild>
                          <span className="flex cursor-default items-center">
                            <StreamIcon
                              className={`size-4 ${streamMeta.className}`}
                              aria-hidden
                            />
                            <span className="sr-only">
                              {t(streamMeta.labelKey)}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t(streamMeta.labelKey)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {isStreamed && streamTypes.length === 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex cursor-default items-center">
                          <Tv
                            className="size-4 text-red-500"
                            aria-hidden
                          />
                          <span className="sr-only">
                            {t("stream.will_be_streamed")}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("stream.will_be_streamed")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>

                <span className="text-muted-foreground text-sm sm:text-right">
                  {match.matchDate &&
                    format(new Date(match.matchDate), "dd MMM yyyy, HH:mm")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
