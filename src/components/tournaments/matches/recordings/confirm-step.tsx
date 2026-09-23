import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { computeScores, getStepSwap, winsNeeded } from "./recordings-helpers";
import type { GameStep, MatchMode } from "./types";

interface ConfirmStepProps {
  steps: GameStep[];
  gameCount: number;
  mode: MatchMode;
  player1Name: string;
  player2Name: string;
}

/**
 * Final review before submitting.
 */
export function ConfirmStep({
  steps,
  gameCount,
  mode,
  player1Name,
  player2Name,
}: ConfirmStepProps) {
  const t = useTranslations("tournament.matches.recordings");
  const isPlayAll = mode === "PLAY_ALL";

  const uploadedSteps = steps
    .map((step, i) => ({ step, gameNumber: i + 1 }))
    .filter(({ step }) => step.files.length > 0);

  const [p1Wins, p2Wins] = computeScores(steps);

  const needed = winsNeeded(gameCount);
  const uploadedCount = uploadedSteps.length;
  // A play-all series always consists of every game; a best-of series consists
  // of the games that were actually decided (i.e. have a winner).
  const expectedGames = isPlayAll ? gameCount : p1Wins + p2Wins;
  const seriesComplete = isPlayAll
    ? uploadedCount === gameCount
    : p1Wins >= needed || p2Wins >= needed;

  // Warn if the series looks incomplete:
  // - Series is complete but not all expected recordings are present
  // - Series is not complete but some recordings were uploaded (no clear winner yet)
  const countMismatch =
    uploadedCount > 0 &&
    (seriesComplete ? uploadedCount !== expectedGames : true);

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-[color:var(--medieval-gold-muted)]">
        {t("confirm.review")}
      </p>

      <p className="text-center text-lg font-medium text-[color:var(--medieval-parchment-foreground)]">
        <span>{player1Name}</span>{" "}
        <span
          className={p1Wins > p2Wins ? "text-[color:var(--medieval-gold)]" : ""}
        >
          {p1Wins}
        </span>
        <span className="mx-1 text-[color:var(--medieval-gold-muted)]">:</span>
        <span
          className={p2Wins > p1Wins ? "text-[color:var(--medieval-gold)]" : ""}
        >
          {p2Wins}
        </span>{" "}
        <span>{player2Name}</span>
      </p>

      <div className="space-y-3">
        {uploadedSteps.map(({ step, gameNumber }) => {
          const recording = step.recordings.at(-1);
          const swap = getStepSwap(step);
          const player1Civ = swap
            ? recording?.player2Data.civ
            : recording?.player1Data.civ;
          const player2Civ = swap
            ? recording?.player1Data.civ
            : recording?.player2Data.civ;

          return (
            <div
              key={gameNumber}
              className="space-y-1 rounded-xl border border-[color:var(--medieval-wood-border)] px-3 py-2 text-sm"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
            >
              <p className="font-semibold text-[color:var(--medieval-gold)]">
                {t("confirm.game_label", { number: gameNumber })}
              </p>
              <p className="text-[color:var(--medieval-gold-muted)]">
                {player1Name}: {player1Civ ?? "-"}
              </p>
              <p className="text-[color:var(--medieval-gold-muted)]">
                {player2Name}: {player2Civ ?? "-"}
              </p>
              <p className="text-[color:var(--medieval-gold-muted)]">
                {t("map")}: {recording?.map ?? "-"}
              </p>
            </div>
          );
        })}
      </div>

      {countMismatch && (
        <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 [&>svg]:text-amber-500">
          <TriangleAlertIcon className="size-4" />
          <AlertDescription>
            {isPlayAll
              ? t("confirm.count_mismatch_play_all", {
                  uploaded: uploadedCount,
                  total: gameCount,
                })
              : seriesComplete
                ? t("confirm.count_mismatch_complete", {
                    uploaded: uploadedCount,
                    p1: p1Wins,
                    p2: p2Wins,
                    expected: expectedGames,
                  })
                : t("confirm.count_mismatch_incomplete", {
                    p1: p1Wins,
                    p2: p2Wins,
                  })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
