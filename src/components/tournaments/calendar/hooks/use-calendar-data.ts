"use client";

import { useMemo } from "react";
import {
  CalendarMatchStatus,
  type CalendarGroup,
  type CalendarMatch,
  type CalendarPlayer,
} from "../types";

export interface TournamentMatchRow {
  id: string;
  matchDate: Date | null;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "ADMIN_APPROVED";
  group: MatchRowGroup | null;
  TournamentMatchParticipant: MatchRowParticipant[];
  TournamentMatchStream: MatchRowStream[];
}

interface MatchRowGroup {
  id: string;
  name: string;
  color: string | null;
}
interface MatchRowParticipant {
  participant: { id: string; nickname: string } | null;
  team: { id: string; name: string } | null;
}
interface MatchRowStream {
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
}

interface CalendarData {
  calendarMatches: CalendarMatch[];
  calendarGroups: CalendarGroup[];
  calendarPlayers: CalendarPlayer[];
}

/** Maps db rows to the calendar types */
export function useCalendarData(rows: TournamentMatchRow[]): CalendarData {
  return useMemo(() => {
    const groupMap = new Map<string, CalendarGroup>();
    const playerMap = new Map<string, CalendarPlayer>();
    const mapped: CalendarMatch[] = [];

    for (const row of rows) {
      if (!row.group || !row.matchDate) continue;

      if (!groupMap.has(row.group.id)) {
        groupMap.set(row.group.id, {
          id: row.group.id,
          name: row.group.name,
          color: row.group.color ?? "#ffffff55",
        });
      }

      const participants = row.TournamentMatchParticipant;

      // Each slot is either player or team.
      const slot1 = participants[0];
      const slot2 = participants[1];

      const p1 =
        slot1 &&
        (slot1.participant ??
          (slot1.team
            ? { id: slot1.team.id, nickname: slot1.team.name }
            : null));

      const p2 =
        slot2 &&
        (slot2.participant ??
          (slot2.team
            ? { id: slot2.team.id, nickname: slot2.team.name }
            : null));

      if (!p1 || !p2) continue;

      if (!playerMap.has(p1.id))
        playerMap.set(p1.id, { id: p1.id, nickname: p1.nickname });

      if (!playerMap.has(p2.id))
        playerMap.set(p2.id, { id: p2.id, nickname: p2.nickname });

      const streams = row.TournamentMatchStream;
      const hasAny = streams.some((s) => s.status !== "CANCELLED");

      const status =
        row.status === "COMPLETED" || row.status === "ADMIN_APPROVED"
          ? CalendarMatchStatus.Completed
          : CalendarMatchStatus.Scheduled;

      mapped.push({
        id: row.id,
        groupId: row.group.id,
        date: row.matchDate,
        player1Id: p1.id,
        player2Id: p2.id,
        status,
        isStreamed: hasAny,
        isVerified: row.status === "ADMIN_APPROVED",
      });
    }

    return {
      calendarMatches: mapped,
      calendarGroups: Array.from(groupMap.values()),
      calendarPlayers: Array.from(playerMap.values()),
    };
  }, [rows]);
}
