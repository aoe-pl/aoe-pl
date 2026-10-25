import { ADMIN_MARKER_META } from "@/components/tournaments/matches/admin-stream-marker";
import { isBrightColor } from "@/lib/utils";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CalendarMatchStatus } from "./types";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface MatchTileProps {
  match: CalendarMatch;
  group: CalendarGroup;
  player1: CalendarPlayer;
  player2: CalendarPlayer;
  href: string;
  showAdminMarker?: boolean;
  reserveActionSpace?: boolean;
}

export function MatchTile({
  match,
  group,
  player1,
  player2,
  href,
  showAdminMarker = false,
  reserveActionSpace = false,
}: MatchTileProps) {
  const t = useTranslations("tournament.calendar");
  const tMatches = useTranslations("tournament.matches");
  const {
    isStreamed = false,
    isVerified = false,
    adminStreamStatus = null,
  } = match;
  const textColor = isBrightColor(group.color) ? "#000000" : "#ffffff";

  const sharedStyle = {
    backgroundColor: group.color + "51",
    borderColor: group.color + "66",
  };

  const adminMarker = adminStreamStatus
    ? ADMIN_MARKER_META[adminStreamStatus]
    : null;
  const AdminMarkerIcon = adminMarker?.icon;

  const isCompleted =
    match.status === CalendarMatchStatus.Completed && !isVerified;
  const showAdminMarkerIcon =
    showAdminMarker && !!adminMarker && !!AdminMarkerIcon;

  const hasFooter =
    isStreamed || showAdminMarkerIcon || isVerified || isCompleted;

  return (
    <Link
      href={href}
      className="relative flex w-full flex-col overflow-hidden rounded-md border"
      style={sharedStyle}
      title={`${player1.nickname} vs ${player2.nickname} — ${group.name}`}
    >
      <div className="px-2.5 py-1.5">
        {/* Group label + time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-sm px-1 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: group.color, color: textColor }}
          >
            {group.name}
          </span>
          <span className="text-primary shrink-0 text-[12px] font-medium">
            {format(match.date, "HH:mm")}
          </span>
        </div>

        {/* Player names */}
        <div className="mt-1 flex min-w-0 flex-col items-center text-sm font-medium">
          <span className="text-primary w-full truncate text-center">
            {player1.nickname}
          </span>
          <span className="text-medieval-gold-muted text-[10px] leading-none">
            vs
          </span>
          <span className="text-primary w-full truncate text-center">
            {player2.nickname}
          </span>
        </div>
      </div>

      {/* Status markers, separated from the match details */}
      {hasFooter && (
        <div
          className={`relative flex items-center justify-between gap-2 border-t px-2.5 py-1 ${
            reserveActionSpace ? "pr-9" : ""
          }`}
          style={{ borderColor: group.color + "66" }}
        >
          {/* Approval / completed checkmark: always left */}
          <span className="flex h-5 w-5 items-center justify-center">
            {(isVerified || isCompleted) && (
              <span
                title={
                  isVerified
                    ? tMatches("status.admin_approved")
                    : tMatches("status.completed")
                }
                aria-label={
                  isVerified
                    ? tMatches("status.admin_approved")
                    : tMatches("status.completed")
                }
              >
                <Check
                  className={`h-4 w-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${
                    isVerified ? "text-green-500" : "text-orange-500"
                  }`}
                  strokeWidth={4}
                  aria-hidden
                />
              </span>
            )}
          </span>

          {/* Admin coverage marker: always centered */}
          <span className="absolute top-1/2 left-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            {showAdminMarkerIcon && adminMarker && AdminMarkerIcon && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50"
                title={tMatches(adminMarker.labelKey)}
                aria-label={tMatches(adminMarker.labelKey)}
              >
                <AdminMarkerIcon
                  className={`h-4 w-4 ${adminMarker.className}`}
                  aria-hidden
                />
              </span>
            )}
          </span>

          {/* Stream mark: always right */}
          <span className="flex h-5 w-5 items-center justify-center">
            {isStreamed && (
              <span
                className="h-3 w-3 rounded-full bg-red-500 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                title={t("streamed")}
                aria-label={t("streamed")}
              />
            )}
          </span>
        </div>
      )}
    </Link>
  );
}
