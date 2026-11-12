"use client";

import type { ParsedRecording } from "@/lib/recording-parser/types";
import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface RecordingsListProps {
  recordings: ParsedRecording[];
}

/**
 * Summary of the recordings parsed for a single game.
 */
export function RecordingsList({ recordings }: RecordingsListProps) {
  const t = useTranslations("tournament.matches.recordings");

  return (
    <ul className="space-y-2">
      {recordings.map((recording, index) => (
        <li
          key={`${recording.fileName}-${index}`}
          className="border-medieval-wood-border space-y-1 rounded-xl border p-3 text-center text-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
        >
          <p
            className="text-medieval-gold truncate text-xs font-medium"
            title={recording.fileName}
          >
            {recording.fileName}
          </p>

          <div className="mx-auto w-fit max-w-full space-y-1 text-left">
            <RecordingField
              label={t("player1")}
              value={
                <PlayerValue
                  value={`${recording.player1Data.name} - ${recording.player1Data.civ}`}
                  isWinner={recording.winner === 1}
                  winnerLabel={t("winner")}
                />
              }
            />
            <RecordingField
              label={t("player2")}
              value={
                <PlayerValue
                  value={`${recording.player2Data.name} - ${recording.player2Data.civ}`}
                  isWinner={recording.winner === 2}
                  winnerLabel={t("winner")}
                />
              }
            />
            <RecordingField
              label={t("map")}
              value={recording.map}
            />
            <RecordingField
              label={t("length")}
              value={recording.length}
            />
            <RecordingField
              label={t("date")}
              value={recording.date}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlayerValue({
  value,
  isWinner,
  winnerLabel,
}: {
  value: string;
  isWinner: boolean;
  winnerLabel: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="min-w-0 break-words">{value}</span>
      {isWinner && (
        <Crown
          role="img"
          aria-label={winnerLabel}
          className="text-medieval-gold size-3.5 shrink-0"
        />
      )}
    </span>
  );
}

function RecordingField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-medieval-gold-muted w-20 shrink-0">{label}</span>
      <span className="text-medieval-parchment-foreground min-w-0 break-words">
        {value}
      </span>
    </div>
  );
}
