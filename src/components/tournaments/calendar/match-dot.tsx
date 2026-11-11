"use client";

import { format } from "date-fns";
import { useIsMounted } from "./hooks/use-is-mounted";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface MatchDotProps {
  match: CalendarMatch;
  group: CalendarGroup;
  player1: CalendarPlayer;
  player2: CalendarPlayer;
}

export function MatchDot({ match, group, player1, player2 }: MatchDotProps) {
  // Avoid rendering a server-timezone time that would change after hydration.
  const mounted = useIsMounted();
  const time = mounted ? `${format(match.date, "HH:mm")} · ` : "";

  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-sm"
      style={{ backgroundColor: group.color }}
      title={`${time}${player1.nickname} vs ${player2.nickname} (${group.name})`}
    />
  );
}
