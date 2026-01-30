"use client";

import { Sword, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/trpc/react";
import { isBrightColor } from "@/lib/utils";
import { formatMatchModeName } from "@/lib/helpers/match-mode";

export function UpcomingMatches() {
  const t = useTranslations("home.upcoming_matches");
  const tGlobal = useTranslations();
  const locale = useLocale();
  const { data: matches, isLoading } =
    api.tournaments.matches.upcoming.useQuery();

  if (isLoading) {
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <Sword className="h-5 w-5" />
          {t("title")}
        </div>
        <div className="text-muted-foreground p-4 text-center text-sm">
          {t("loading")}
        </div>
      </div>
    );
  }

  // If no matches are found
  if (!matches || matches.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <Sword className="h-5 w-5" />
          {t("title")}
        </div>
        <div className="text-muted-foreground p-4 text-center text-sm">
          {t("no_matches")}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Sword className="h-5 w-5" />
        {t("title")}
      </div>

      <div className="space-y-2">
        {matches.map((match) => {
          const group = match.group?.name;

          const matchMode =
            match.TournamentMatchMode ??
            match.group?.matchMode ??
            match.group?.stage?.tournament?.matchMode;

          if (matchMode == null) return null;

          const matchModeText = formatMatchModeName(
            matchMode.mode,
            matchMode.gameCount,
            (key, params) => tGlobal(key, params),
          );

          const tournament = match.group?.stage?.tournament?.name;
          const participants = match.TournamentMatchParticipant;
          const groupColor = match.group?.color;

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

          return (
            <div
              key={match.id}
              className="bg-background/50 border-border/50 rounded-lg border p-3 transition-colors"
            >
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
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span className="whitespace-nowrap">{timeText}</span>
                  </div>
                )}

                {tournament && <span className={tagStyle}>{tournament}</span>}

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
            </div>
          );
        })}
      </div>
    </div>
  );
}
