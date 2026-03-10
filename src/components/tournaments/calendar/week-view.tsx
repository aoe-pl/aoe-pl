import { format } from "date-fns";
import { useLocale } from "next-intl";
import { buildWeekDays, getMatchesForDay } from "./calendar-utils";
import { getDateFnsLocale } from "./locale-utils";
import { MatchTile } from "./match-tile";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface WeekViewProps {
  currentWeekStart: Date;
  matches: CalendarMatch[];
  groups: CalendarGroup[];
  players: CalendarPlayer[];
  matchUrlBase: string;
}

export function WeekView({
  currentWeekStart,
  matches,
  groups,
  players,
  matchUrlBase,
}: WeekViewProps) {
  const locale = getDateFnsLocale(useLocale());
  const days = buildWeekDays(currentWeekStart);

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
    <div className="overflow-hidden rounded-lg border">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {days.map((day) => {
          return (
            <div
              key={day.toISOString()}
              className="py-2 text-center"
            >
              <p className="text-muted-foreground py-2 text-center text-sm font-semibold tracking-wide uppercase">
                {format(day, "EEEE", { locale })}
              </p>
              <span className="text-foreground mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold">
                {format(day, "d")}
              </span>
              <p className="text-muted-foreground text-sm">
                {format(day, "MMM", { locale })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Match columns */}
      <div className="grid grid-cols-7 divide-x">
        {days.map((day) => {
          const dayMatches = matchesForDay(day);

          return (
            <div
              key={day.toISOString()}
              className="min-h-50 p-0.5"
            >
              {
                <div className="flex flex-col gap-1">
                  {dayMatches.map((m) => {
                    const group = getGroupById(m.groupId);
                    const p1 = getPlayerById(m.player1Id);
                    const p2 = getPlayerById(m.player2Id);

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
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
