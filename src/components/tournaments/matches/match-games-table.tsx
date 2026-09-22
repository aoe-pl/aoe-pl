"use client";

import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMatchSpoiler } from "./match-spoiler-context";

export interface MatchGameRow {
  player1Civ: string | null;
  player2Civ: string | null;
  map: string | null;
  player1Won: boolean;
  player2Won: boolean;
}

interface MatchGamesTableProps {
  rows: MatchGameRow[];
}

/**
 * Per-game breakdown (civ / map / civ) with a crown marking each game's
 * winner. Rows without data render a "-" placeholder. While the score is
 * hidden (spoiler protection) every cell is masked with "?" and a frosted
 * glass overlay covers the table, so neither the results nor the number of
 * games played leak.
 */
export function MatchGamesTable({ rows }: MatchGamesTableProps) {
  const { revealed } = useMatchSpoiler();
  const t = useTranslations("tournament.matches.spoiler");

  const hasData = rows.some(
    (row) =>
      row.player1Civ !== null ||
      row.player2Civ !== null ||
      row.map !== null ||
      row.player1Won ||
      row.player2Won,
  );

  // Mask the table only when there is something to hide and it is not revealed.
  const hidden = hasData && !revealed;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[color:var(--medieval-wood-border)]">
      {rows.map((row, index) => (
        <div
          key={index}
          className={`grid grid-cols-[2rem_minmax(0,1fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1fr)_2rem] items-center gap-1 px-3 py-3 text-sm ${
            index === 0
              ? ""
              : "border-t border-[color:var(--medieval-wood-border)]"
          } ${index % 2 === 1 ? "bg-black/10" : ""}`}
        >
          <span className="flex justify-center">
            {revealed && row.player1Won && (
              <Crown className="h-4 w-4 text-[color:var(--medieval-gold)]" />
            )}
          </span>
          <span className="text-primary truncate text-right">
            {hidden ? "?" : (row.player1Civ ?? "-")}
          </span>
          <span className="text-center text-[color:var(--medieval-gold-muted)]"></span>
          <span className="truncate text-center font-medium text-[color:var(--medieval-gold)]">
            {hidden ? "?" : (row.map ?? "-")}
          </span>
          <span className="text-center text-[color:var(--medieval-gold-muted)]"></span>
          <span className="text-primary truncate text-left">
            {hidden ? "?" : (row.player2Civ ?? "-")}
          </span>
          <span className="flex justify-center">
            {revealed && row.player2Won && (
              <Crown className="h-4 w-4 text-[color:var(--medieval-gold)]" />
            )}
          </span>
        </div>
      ))}

      {hidden && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 backdrop-blur-sm">
          <span className="text-lg font-black tracking-[0.35em] text-[color:var(--medieval-gold)] uppercase [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
            {t("overlay")}
          </span>
          <span className="text-xs tracking-widest text-[color:var(--medieval-gold-muted)] uppercase">
            {t("overlay_hint")}
          </span>
        </div>
      )}
    </div>
  );
}
