"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isBrightColor } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
export interface MatchListRow {
  id: string;
  matchDate: Date | null;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "ADMIN_APPROVED";
  group: { id: string; name: string; color: string | null } | null;
  TournamentMatchParticipant: {
    participant: {
      id: string;
      nickname: string;
      user: { name: string | null } | null;
    } | null;
    team: { id: string; name: string } | null;
  }[];
}

type SortKey = "date-asc" | "date-desc" | "group" | "player";

function getSlotName(
  p: MatchListRow["TournamentMatchParticipant"][number],
): string {
  if (p.participant)
    return p.participant.nickname ?? p.participant.user?.name ?? "?";
  if (p.team) return p.team.name;
  return "TBD";
}

function getStatusLabel(row: MatchListRow): string {
  if (row.matchDate)
    return format(new Date(row.matchDate), "dd MMM yyyy, HH:mm");
  if (row.status === "COMPLETED" || row.status === "ADMIN_APPROVED")
    return "Completed";
  return "Date TBD";
}

interface MatchListProps {
  matches: MatchListRow[];
  matchUrlBase: string;
}

export function MatchList({ matches, matchUrlBase }: MatchListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-asc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = matches.filter((m) => {
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
  }, [matches, search, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search players or group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc">Date ↑</SelectItem>
            <SelectItem value="date-desc">Date ↓</SelectItem>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="player">Player</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No matches found.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {filtered.map((match) => {
            const p1 = match.TournamentMatchParticipant[0];
            const p2 = match.TournamentMatchParticipant[1];
            const player1 = p1 ? getSlotName(p1) : "TBD";
            const player2 = p2 ? getSlotName(p2) : "TBD";

            const labelColor = isBrightColor(match.group?.color ?? "")
              ? "#000"
              : "#fff";

            return (
              <Link
                key={match.id}
                href={`${matchUrlBase}/${match.id}`}
                className="hover:bg-muted/50 flex w-full items-center gap-4 px-4 py-3 text-left transition-colors"
              >
                <span className="min-w-0 flex-1 font-medium">
                  {player1}
                  <span className="text-muted-foreground mx-2 font-normal">
                    vs
                  </span>
                  {player2}
                </span>
                <span className="text-muted-foreground hidden shrink-0 text-sm sm:block">
                  {getStatusLabel(match)}
                </span>
                {match.group && (
                  <Badge
                    className="text-sm font-bold"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
