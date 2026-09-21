"use client";

import { getDateFnsLocale } from "@/components/tournaments/calendar/locale-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { GroupPageData } from "./types/types";

type GroupMatch = GroupPageData["matches"][number];
type MatchSlot = GroupMatch["TournamentMatchParticipant"][number];

const STATUS_BADGE_CLASSES = {
  PENDING: "bg-black/25 text-[color:var(--medieval-gold-muted)]",
  SCHEDULED: "bg-orange-500/20 text-orange-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-400/80",
  ADMIN_APPROVED: "bg-emerald-500/20 text-emerald-300",
} as const satisfies Record<GroupMatch["status"], string>;

/** Resolves a match slot (participant or team) to a displayable name. */
function getSlotName(slot: MatchSlot): string {
  if (slot.participant)
    return slot.participant.nickname ?? slot.participant.user?.name ?? "?";
  if (slot.team) return slot.team.name;
  return "TBD";
}

/**
 * Lists every match a selected group player takes part in - unscheduled,
 * scheduled and played. Each row links to the match page and only reveals the
 * score once the match has been admin-approved.
 */
export function GroupPlayerMatches({
  matches,
  playerId,
  playerName,
  matchUrlBase,
}: {
  matches: GroupPageData["matches"];
  playerId: string;
  playerName: string;
  matchUrlBase: string;
}) {
  const t = useTranslations("tournament.groups");
  const tMatches = useTranslations("tournament.matches");
  const dateLocale = getDateFnsLocale(useLocale());

  const statusLabels = {
    PENDING: tMatches("status.pending"),
    SCHEDULED: tMatches("status.scheduled"),
    COMPLETED: tMatches("status.completed"),
    ADMIN_APPROVED: tMatches("status.admin_approved"),
  } satisfies Record<GroupMatch["status"], string>;

  const playerMatches = matches
    .filter((match) =>
      match.TournamentMatchParticipant.some(
        (slot) => slot.participantId === playerId,
      ),
    )
    .sort((a, b) => {
      const dateA = a.matchDate ? new Date(a.matchDate).getTime() : Infinity;
      const dateB = b.matchDate ? new Date(b.matchDate).getTime() : Infinity;
      return dateA - dateB;
    });

  return (
    <div className="w-full space-y-3">
      <h3 className="text-center text-lg font-bold text-[color:var(--medieval-gold)]">
        {t("player_matches.title", { name: playerName })}
      </h3>

      {playerMatches.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--medieval-gold-muted)]">
          {t("player_matches.no_matches")}
        </p>
      ) : (
        <div className="w-full divide-y divide-[color:var(--medieval-wood-border)] overflow-hidden rounded-xl border border-[color:var(--medieval-wood-border)]">
          {playerMatches.map((match) => {
            const playerSlot = match.TournamentMatchParticipant.find(
              (slot) => slot.participantId === playerId,
            );
            const opponents = match.TournamentMatchParticipant.filter(
              (slot) => slot.participantId !== playerId,
            );
            const opponentName =
              opponents.map(getSlotName).join(" / ") || "TBD";

            // Scores are only revealed once a match has been admin-approved.
            const score =
              match.status === "ADMIN_APPROVED" && playerSlot
                ? `${playerSlot.wonScore} : ${opponents.reduce(
                    (sum, slot) => sum + slot.wonScore,
                    0,
                  )}`
                : null;

            const dateLabel = match.matchDate
              ? format(new Date(match.matchDate), "dd MMM yyyy, HH:mm", {
                  locale: dateLocale,
                })
              : tMatches("date_tbd");

            return (
              <Link
                key={match.id}
                href={`${matchUrlBase}/${match.matchNumber}`}
                className="flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-black/10"
              >
                <span className="text-primary min-w-0 flex-1 truncate">
                  <span className="mr-1.5 text-[color:var(--medieval-gold-muted)]">
                    {t("player_matches.vs")}
                  </span>
                  {opponentName}
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                    STATUS_BADGE_CLASSES[match.status],
                  )}
                >
                  {statusLabels[match.status]}
                </span>

                <span className="hidden w-32 shrink-0 text-right text-xs text-[color:var(--medieval-gold-muted)] tabular-nums sm:block">
                  {dateLabel}
                </span>

                <span className="text-primary w-12 shrink-0 text-right font-bold tabular-nums">
                  {score}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
