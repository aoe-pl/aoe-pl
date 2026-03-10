import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarMatch } from "./types";

/**
 * Returns all days that should appear in a month-grid calendar,
 */
export function buildMonthGridDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calStart, end: calEnd });
}

export function buildWeekDays(weekStart: Date): Date[] {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });

  return eachDayOfInterval({ start, end });
}

export function getMatchesForDay(
  matches: CalendarMatch[],
  day: Date,
): CalendarMatch[] {
  return matches
    .filter((m) => isSameDay(m.date, day))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
