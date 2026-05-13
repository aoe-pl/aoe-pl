"use client";

import { Button } from "@/components/ui/button";
import { isSameDay } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";
import { ScheduledMatchCard } from "./scheduled-match-card";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";
import { UserScheduleDialog } from "./user-schedule-dialog";

interface SelectedDayPanelProps {
  selectedDay: Date;
  matches: CalendarMatch[];
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  isFiltered: boolean;
  matchUrlBase: string;
  pendingRows: TournamentMatchRow[];
  tournamentMatchRows: TournamentMatchRow[];
  userId: string | null;
  isAdmin: boolean;
  onScheduleMatch: (match: TournamentMatchRow, date: Date) => void;
  onRescheduleMatch: (match: TournamentMatchRow) => void;
  onCancelMatch: (match: TournamentMatchRow) => void;
}

// Selected day panel for month and week view. Shows all matches for the selected day.
export function SelectedDayPanel({
  selectedDay,
  matches,
  groups,
  players,
  isFiltered,
  matchUrlBase,
  pendingRows,
  tournamentMatchRows,
  userId,
  isAdmin,
  onScheduleMatch: _onScheduleMatch,
  onRescheduleMatch,
  onCancelMatch,
}: SelectedDayPanelProps) {
  const t = useTranslations("tournament.calendar");
  const fmt = useFormatter();

  const dayMatches = matches
    .filter((m) => isSameDay(m.date, selectedDay))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const userPendingRows = pendingRows.filter((row) =>
    row.TournamentMatchParticipant.some(
      (p) => p.participant?.userId === userId,
    ),
  );

  // Build matchId -> participant userIds map from original rows
  const matchUserIds = new Map<string, (string | null)[]>();

  for (const row of tournamentMatchRows) {
    matchUserIds.set(
      row.id,
      row.TournamentMatchParticipant.map((p) => p.participant?.userId ?? null),
    );
  }

  // Only allow users involved in the match or admins to reschedule/cancel from the calendar tile.
  function canActOnScheduled(matchId: string): boolean {
    if (isAdmin) return true;
    if (!userId) return false;
    return matchUserIds.get(matchId)?.includes(userId) ?? false;
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">
          {fmt.dateTime(selectedDay, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
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
              <ScheduledMatchCard
                key={m.id}
                match={m}
                group={group}
                player1={p1}
                player2={p2}
                matchUrlBase={matchUrlBase}
                canAct={canActOnScheduled(m.id)}
                onReschedule={onRescheduleMatch}
                onCancel={onCancelMatch}
              />
            );
          })}
        </div>
      )}

      {userPendingRows.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("schedule.unscheduled_count", { count: userPendingRows.length })}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUserDialogOpen(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            {t("schedule.schedule_button")}
          </Button>
        </div>
      )}

      {userDialogOpen && userId && (
        <UserScheduleDialog
          pendingRows={userPendingRows}
          userId={userId}
          defaultDate={selectedDay}
          onClose={() => setUserDialogOpen(false)}
        />
      )}
    </div>
  );
}
