import { cn, isBrightColor } from "@/lib/utils";
import { format } from "date-fns";
import { Check } from "lucide-react";
import Link from "next/link";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface MatchTileProps {
  match: CalendarMatch;
  group: CalendarGroup;
  player1: CalendarPlayer;
  player2: CalendarPlayer;
  href: string;
}

export function MatchTile({
  match,
  group,
  player1,
  player2,
  href,
}: MatchTileProps) {
  const { isStreamed = false, isVerified = false } = match;
  const textColor = isBrightColor(group.color) ? "#000000" : "#ffffff";

  const sharedStyle = {
    backgroundColor: group.color + "51",
    borderColor: group.color + "66",
  };

  const content = (
    <>
      {/* Stream indicator */}
      {isStreamed && (
        <span
          className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-red-500"
          title="Streamed"
        />
      )}

      {/* Verified checkmark */}
      {isVerified && (
        <Check
          className="absolute -bottom-1 -left-1.5 h-4 w-4 text-green-500"
          strokeWidth={5}
          aria-label="Verified"
        />
      )}

      {/* Group label + time */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-sm px-1 py-1 text-[10px] font-semibold"
          style={{ backgroundColor: group.color, color: textColor }}
        >
          {group.name}
        </span>
        <span className="shrink-0 text-[12px] font-medium">
          {format(match.date, "HH:mm")}
        </span>
      </div>

      {/* Player names */}
      <div className="mt-1 flex min-w-0 flex-col items-center text-sm font-medium">
        <span className="text-foreground w-full truncate text-center">
          {player1.nickname}
        </span>
        <span className="text-muted-foreground text-[10px] leading-none">
          vs
        </span>
        <span className="text-foreground w-full truncate text-center">
          {player2.nickname}
        </span>
      </div>
    </>
  );

  const sharedClass = cn(
    "relative w-full rounded-md border px-2.5 py-1.5",
    "hover:scale-[1.02] active:scale-[0.98]",
  );

  const sharedProps = {
    className: sharedClass,
    style: sharedStyle,
    title: `${player1.nickname} vs ${player2.nickname} — ${group.name}`,
  };

  return (
    <Link
      href={href}
      {...sharedProps}
    >
      {content}
    </Link>
  );
}
