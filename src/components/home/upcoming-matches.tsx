"use client";

import { formatMatchModeName } from "@/lib/helpers/match-mode";
import { isBrightColor, slugify } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export function UpcomingMatches() {
  const t = useTranslations("home.upcoming_matches");
  const tGlobal = useTranslations();
  const locale = useLocale();
  const { data: matches, isLoading } =
    api.tournaments.matches.upcoming.useQuery();

  if (isLoading) {
    return (
      <div>
        <div className="panel-header text-center">{t("title")}</div>
        <div className="text-muted-foreground p-4 text-center text-sm">
          {t("loading")}
        </div>
      </div>
    );
  }

  // If no matches are found
  if (!matches || matches.length === 0) {
    return (
      <div>
        <div className="panel-header text-center">{t("title")}</div>
        <div className="text-muted-foreground p-4 text-center text-sm">
          {t("no_matches")}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="panel-header text-center">{t("title")}</div>

      <div className="space-y-2">
        {matches.map((match) => {
          const group = match.group?.name;

          const matchMode =
            match.TournamentMatchMode ??
            match.group?.matchMode ??
            match.group?.tournament?.matchMode;

          if (matchMode == null) return null;

          const matchModeText = formatMatchModeName(
            matchMode.mode,
            matchMode.gameCount,
            (key, params) => tGlobal(key, params),
          );

          const tournament = match.group?.tournament;
          const participants = match.TournamentMatchParticipant;
          const groupColor = match.group?.color;

          // Link to the dedicated match page. Matches on the home page always
          // belong to a group tournament, but the series is optional in the
          // schema, so guard against a missing slug.
          const seriesName = tournament?.tournamentSeries?.name;
          const matchHref =
            tournament && seriesName
              ? `/tournaments/${slugify(seriesName)}/${tournament.urlKey}/matches/${match.matchNumber}`
              : null;

          const player1 =
            participants[0]?.participant?.user?.name ??
            participants[0]?.team?.name ??
            "TBD";

          const player2 =
            participants[1]?.participant?.user?.name ??
            participants[1]?.team?.name ??
            "TBD";

          const timeText = match.matchDate
            ? match.matchDate.toLocaleString(locale, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          const tagStyle =
            "bg-secondary/40 text-foreground/80 rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

          const tileContent = (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-foreground text-sm font-semibold">
                  {player1}
                </span>
                <span className="text-muted-foreground text-xs">{t("vs")}</span>
                <span className="text-foreground text-sm font-semibold">
                  {player2}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {timeText && (
                  <div className="text-primary flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span className="whitespace-nowrap">{timeText}</span>
                  </div>
                )}

                {tournament && (
                  <span className={tagStyle}>{tournament.name}</span>
                )}

                {group && (
                  <span
                    className="rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: groupColor!,
                      color: isBrightColor(groupColor!) ? "black" : "white",
                    }}
                  >
                    {group}
                  </span>
                )}

                <span className={tagStyle}>{matchModeText}</span>
              </div>
            </>
          );

          if (matchHref) {
            return (
              <Link
                key={match.id}
                href={matchHref}
                className="panel-parchment hover:ring-medieval-gold/60 block transition-all hover:ring-2"
              >
                {tileContent}
              </Link>
            );
          }

          return (
            <div
              key={match.id}
              className="panel-parchment transition-colors"
            >
              {tileContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
