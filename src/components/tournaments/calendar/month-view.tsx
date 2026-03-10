import { cn } from "@/lib/utils";
import { format, isSameDay, isSameMonth } from "date-fns";
import { useLocale } from "next-intl";
import { buildMonthGridDays, getMatchesForDay } from "./calendar-utils";
import { getDateFnsLocale } from "./locale-utils";
import { MatchDot } from "./match-dot";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface MonthViewProps {
  currentMonth: Date;
  matches: CalendarMatch[];
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  selectedDay: Date | null;
  onDaySelect: (day: Date) => void;
}

// Could overlap with other tiles if we showed all matches.
const maxVisibleDots = 5;

export function MonthView({
  currentMonth,
  matches,
  groups,
  players,
  selectedDay,
  onDaySelect,
}: MonthViewProps) {
  const locale = getDateFnsLocale(useLocale());
  const days = buildMonthGridDays(currentMonth);

  // Derive localised weekday labels from the first 7 days of the grid
  const weekdays = days.slice(0, 7).map((d) => format(d, "EEEE", { locale }));

  function getGroupById(id: string): CalendarGroup | undefined {
    return groups.find((g) => g.id === id);
  }
  function getPlayerById(id: string): CalendarPlayer | undefined {
    return players.find((p) => p.id === id);
  }
  function matchesForDay(day: Date): CalendarMatch[] {
    return getMatchesForDay(matches, day);
  }

  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      {/* Day of week header */}
      <div className="grid grid-cols-7 border-b">
        {weekdays.map((d) => (
          <div
            key={d}
            className="text-muted-foreground py-2 text-center text-sm font-semibold tracking-wide uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayMatches = matchesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const visibleMatches = dayMatches.slice(0, maxVisibleDots);
          const hiddenCount = dayMatches.length - visibleMatches.length;
          const isLastRow = idx >= days.length - 7;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDaySelect(day)}
              className={cn(
                "flex min-h-8 cursor-pointer flex-col border-r border-b p-1",
                isLastRow && "border-b-0",
                (idx + 1) % 7 === 0 && "border-r-0",
                isCurrentMonth ? "bg-card" : "bg-muted/30",
                isSelected
                  ? "bg-primary/5 ring-primary/40 ring-1 ring-inset"
                  : "hover:bg-muted/50",
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center self-end text-sm",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Match dots */}
              <div className="mt-auto flex flex-wrap gap-0.5 pt-1">
                {visibleMatches.map((m) => {
                  const group = getGroupById(m.groupId);
                  const p1 = getPlayerById(m.player1Id);
                  const p2 = getPlayerById(m.player2Id);

                  if (!group || !p1 || !p2) return null;

                  return (
                    <MatchDot
                      key={m.id}
                      match={m}
                      group={group}
                      player1={p1}
                      player2={p2}
                    />
                  );
                })}
                {hiddenCount > 0 && (
                  <span className="text-muted-foreground text-sm leading-3 font-medium">
                    +{hiddenCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
