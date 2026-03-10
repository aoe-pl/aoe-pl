"use client";

import { format, isSameDay } from "date-fns";
import { useTranslations } from "next-intl";
import { MatchTile } from "./match-tile";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface SelectedDayPanelProps {
  selectedDay: Date;
  matches: CalendarMatch[];
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  isFiltered: boolean;
  matchUrlBase: string;
}

// Selected day panel for month view. Shows all matches for the selected day.
export function SelectedDayPanel({
  selectedDay,
  matches,
  groups,
  players,
  isFiltered,
  matchUrlBase,
}: SelectedDayPanelProps) {
  const t = useTranslations("tournament.calendar");

  const dayMatches = matches
    .filter((m) => isSameDay(m.date, selectedDay))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">
          {format(selectedDay, "EEEE, MMMM d")}
          {dayMatches.length > 0 && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {t("matches", { count: dayMatches.length })}
            </span>
          )}
        </h3>
      </div>

      {dayMatches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {isFiltered
            ? t("no_matches_on_day_filtered")
            : t("no_matches_on_day")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {dayMatches.map((m) => {
            const group = groups.find((g) => g.id === m.groupId);
            const p1 = players.find((p) => p.id === m.player1Id);
            const p2 = players.find((p) => p.id === m.player2Id);

            if (!group || !p1 || !p2) return null;

            return (
              <MatchTile
                key={m.id}
                match={m}
                group={group}
                player1={p1}
                player2={p2}
                href={`${matchUrlBase}/${m.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
