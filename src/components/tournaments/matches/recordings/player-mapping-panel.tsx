"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { sameRecordedPlayer } from "./recordings-helpers";
import type { RecordedPlayer } from "./types";

interface PlayerMappingPanelProps {
  player1Name: string;
  player2Name: string;
  recordedPlayer1: RecordedPlayer | null;
  recordedPlayer2: RecordedPlayer | null;
  /** The recorded player already selected as match player 1, if any. */
  selectedPlayer1: RecordedPlayer | null;
  onSelectPlayer1: (player: RecordedPlayer) => void;
}

/**
 * Asks the uploader which recorded player corresponds to match player 1. Shown
 * once for the whole upload because all games must feature the same players.
 */
export function PlayerMappingPanel({
  player1Name,
  player2Name,
  recordedPlayer1,
  recordedPlayer2,
  selectedPlayer1,
  onSelectPlayer1,
}: PlayerMappingPanelProps) {
  const t = useTranslations("tournament.matches.recordings");

  const isSelected = (player: RecordedPlayer | null) =>
    player != null &&
    selectedPlayer1 != null &&
    sameRecordedPlayer(player, selectedPlayer1);

  return (
    <div
      className="border-medieval-gold-muted/40 space-y-3 rounded-xl border p-3 text-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
    >
      <p className="text-medieval-gold font-semibold">{t("mapping.title")}</p>

      <p className="text-medieval-gold-muted text-xs">
        {t("mapping.prompt", { player: player1Name })}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={isSelected(recordedPlayer1) ? "gold" : "outline"}
          disabled={recordedPlayer1 === null}
          onClick={() => recordedPlayer1 && onSelectPlayer1(recordedPlayer1)}
        >
          {recordedPlayer1?.name ?? "?"}
        </Button>
        <Button
          size="sm"
          variant={isSelected(recordedPlayer2) ? "gold" : "outline"}
          disabled={recordedPlayer2 === null}
          onClick={() => recordedPlayer2 && onSelectPlayer1(recordedPlayer2)}
        >
          {recordedPlayer2?.name ?? "?"}
        </Button>
      </div>

      <p className="text-medieval-gold-muted text-xs">
        {t("mapping.hint", { player: player2Name })}
      </p>
    </div>
  );
}
