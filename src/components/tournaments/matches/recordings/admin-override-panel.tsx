"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface AdminOverridePanelProps {
  player1Name: string;
  player2Name: string;
  recordedPlayer1Name: string | null;
  recordedPlayer2Name: string | null;
  swap: boolean;
  onSetSwap: (swap: boolean) => void;
  winner: 1 | 2 | null;
  onSetWinner: (winner: 1 | 2) => void;
}

/**
 * Admin-only fallback for games where validation had errors, so the orientation and the winner can be set
 * by hand.
 */
export function AdminOverridePanel({
  player1Name,
  player2Name,
  recordedPlayer1Name,
  recordedPlayer2Name,
  swap,
  onSetSwap,
  winner,
  onSetWinner,
}: AdminOverridePanelProps) {
  const t = useTranslations("tournament.matches.recordings");

  return (
    <div
      className="space-y-3 rounded-xl border border-[color:var(--medieval-wood-border)] p-3 text-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
    >
      <p className="font-semibold text-[color:var(--medieval-gold)]">
        {t("admin.title")}
      </p>

      <div className="space-y-1">
        <p className="text-xs text-[color:var(--medieval-gold-muted)]">
          {t("admin.assign_players", { player: player1Name })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={swap ? "outline" : "gold"}
            disabled={recordedPlayer1Name === null}
            onClick={() => onSetSwap(false)}
          >
            {recordedPlayer1Name ?? "?"}
          </Button>
          <Button
            size="sm"
            variant={swap ? "gold" : "outline"}
            disabled={recordedPlayer2Name === null}
            onClick={() => onSetSwap(true)}
          >
            {recordedPlayer2Name ?? "?"}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[color:var(--medieval-gold-muted)]">
          {t("admin.winner")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={winner === 1 ? "gold" : "outline"}
            onClick={() => onSetWinner(1)}
          >
            {player1Name}
          </Button>
          <Button
            size="sm"
            variant={winner === 2 ? "gold" : "outline"}
            onClick={() => onSetWinner(2)}
          >
            {player2Name}
          </Button>
        </div>
      </div>
    </div>
  );
}
