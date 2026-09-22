"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMatchSpoiler } from "./match-spoiler-context";

export interface GameRecordingInfo {
  gameNumber: number;
  fileCount: number;
}

interface MatchRecordingsDownloadProps {
  matchId: string;
  gameCount: number; // Total games possible in the match (e.g. 5 for a Bo5).
  gamesWithRecordings: GameRecordingInfo[];
}

/** Read the download file name the server set via Content-Disposition. */
function getDownloadFileName(response: Response): string | null {
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) return null;

  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? null;
}

/**
 * Download recs control.
 *
 * While the score is hidden (spoiler protection) the list mirrors the score
 * table and always shows every possible game, so it can't reveal how many
 * games were played; selecting a game without a recording does nothing.
 * Once the score is revealed, only real games are listed.
 */
export function MatchRecordingsDownload({
  matchId,
  gameCount,
  gamesWithRecordings,
}: MatchRecordingsDownloadProps) {
  const t = useTranslations("tournament.matches.recordings");
  const { revealed } = useMatchSpoiler();
  const [downloading, setDownloading] = useState<number | null>(null);

  // How many recording files each game has (restored games have several).
  const fileCounts = new Map(
    gamesWithRecordings.map((game) => [game.gameNumber, game.fileCount]),
  );

  const gameNumbers = revealed
    ? gamesWithRecordings.map((game) => game.gameNumber).sort((a, b) => a - b)
    : Array.from({ length: gameCount }, (_, index) => index + 1);

  const handleDownload = async (gameNumber: number) => {
    const fileCount = fileCounts.get(gameNumber) ?? 0;

    // No recording exists for this game
    if (fileCount === 0) return;

    setDownloading(gameNumber);

    try {
      // A restored game is stored as several files; download every one of them.
      for (let fileIndex = 0; fileIndex < fileCount; fileIndex++) {
        const response = await fetch(
          `/api/tournaments/matches/${matchId}/recordings/${gameNumber}?file=${fileIndex}`,
        );

        if (!response.ok) continue;

        const blob = await response.blob();
        const fileName =
          getDownloadFileName(response) ??
          `game_${gameNumber}_${fileIndex + 1}.aoe2record`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Release the object URL once the download has had time to start.
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        // Small gap so the browser between downloads.
        if (fileIndex < fileCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch {
      // Swallow errors: a failed download should behave like "nothing to get".
    } finally {
      setDownloading(null);
    }
  };

  if (gameNumbers.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant="gold"
          className="w-full"
        >
          <Download />
          {t("download_button")}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width)">
        {gameNumbers.map((gameNumber) => (
          <DropdownMenuItem
            key={gameNumber}
            onSelect={() => void handleDownload(gameNumber)}
            disabled={downloading === gameNumber}
            className="justify-between"
          >
            {t("download_game", { number: gameNumber })}
            <Download className="size-3.5 opacity-70" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
