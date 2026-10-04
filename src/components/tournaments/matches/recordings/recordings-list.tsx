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
          className="border-medieval-wood-border space-y-1 rounded-xl border p-3 text-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
        >
          <p
            className="text-medieval-gold truncate text-xs font-medium"
            title={recording.fileName}
          >
            {recording.fileName}
          </p>

          <RecordingField
            label={t("player1")}
            value={`${recording.player1Data.name} - ${recording.player1Data.civ}`}
          />
          <RecordingField
            label={t("player2")}
            value={`${recording.player2Data.name} - ${recording.player2Data.civ}`}
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
          <RecordingField
            label={t("winner")}
            value={
              recording.winner === null ? (
                <span className="text-medieval-gold-muted">
                  {t("winner_unknown")}
                </span>
              ) : (
                <span className="text-medieval-parchment-foreground inline-flex items-center gap-1 font-semibold">
                  <Crown className="text-medieval-gold size-3.5" />
                  {recording.winner === 1
                    ? recording.player1Data.name
                    : recording.player2Data.name}
                </span>
              )
            }
          />
        </li>
      ))}
    </ul>
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
