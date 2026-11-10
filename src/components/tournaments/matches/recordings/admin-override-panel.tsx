"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface AdminOverridePanelProps {
  player1Name: string;
  player2Name: string;
  winner: 1 | 2 | null;
  onSetWinner: (winner: 1 | 2) => void;
}

/**
 * Admin-only fallback for games where validation had errors, so the winner can
 * be set by hand. Player mapping is chosen globally for the whole upload.
 */
export function AdminOverridePanel({
  player1Name,
  player2Name,
  winner,
  onSetWinner,
}: AdminOverridePanelProps) {
  const t = useTranslations("tournament.matches.recordings");

  return (
    <div
      className="border-medieval-wood-border space-y-3 rounded-xl border p-3 text-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
    >
      <p className="text-medieval-gold font-semibold">{t("admin.title")}</p>

      <div className="space-y-1">
        <p className="text-medieval-gold-muted text-xs">{t("admin.winner")}</p>
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
