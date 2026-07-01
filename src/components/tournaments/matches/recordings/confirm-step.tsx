import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";
import { computeScores, winsNeeded } from "./helpers";
import { RecordingsTable } from "./recordings-table";
import type { GameStep } from "./types";

interface ConfirmStepProps {
  steps: GameStep[];
  gameCount: number;
  player1Name: string;
  player2Name: string;
}

export function ConfirmStep({
  steps,
  gameCount,
  player1Name,
  player2Name,
}: ConfirmStepProps) {
  const uploadedSteps = steps
    .map((step, i) => ({ step, gameNumber: i + 1 }))
    .filter(({ step }) => step.files.length > 0);

  const [p1Wins, p2Wins] = computeScores(steps);
  const needed = winsNeeded(gameCount);
  const expectedGames = p1Wins + p2Wins;
  const uploadedCount = uploadedSteps.length;
  const seriesComplete = p1Wins >= needed || p2Wins >= needed;

  // Warn if the series looks incomplete:
  // - Series is complete but not all expected recordings are present
  // - Series is not complete but some recordings were uploaded (no clear winner yet)
  const countMismatch =
    uploadedCount > 0 &&
    (seriesComplete ? uploadedCount !== expectedGames : true);

  const seriesWinner =
    p1Wins >= winsNeeded(gameCount)
      ? player1Name
      : p2Wins >= winsNeeded(gameCount)
        ? player2Name
        : null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Review the uploaded recordings before submitting.
        </p>

        <p className="text-md text-center font-medium">
          {player1Name}{" "}
          <span className={p1Wins > p2Wins ? "text-green-500" : ""}>
            {p1Wins}
          </span>
          {" : "}
          <span className={p2Wins > p1Wins ? "text-primary" : ""}>
            {p2Wins}
          </span>{" "}
          {player2Name}
          {seriesWinner && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({seriesWinner} wins)
            </span>
          )}
        </p>

        {countMismatch && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 [&>svg]:text-amber-500">
            <TriangleAlertIcon className="size-4" />
            <AlertDescription>
              {seriesComplete
                ? `${uploadedCount} recording${uploadedCount !== 1 ? "s" : ""} uploaded, but the score (${p1Wins}:${p2Wins}) suggests ${expectedGames} game${expectedGames !== 1 ? "s" : ""} were played. Double-check the files are correct.`
                : `No player has clinched the series yet based on the uploaded recordings (${p1Wins}:${p2Wins}). Make sure all games are accounted for.`}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {uploadedSteps.map(({ step, gameNumber }) => (
        <div
          key={gameNumber}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold">Game {gameNumber}</h3>
          <ul className="text-muted-foreground list-inside list-disc text-xs">
            {step.files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
          <RecordingsTable
            recordings={step.recordings}
            showExample={false}
          />
        </div>
      ))}
    </div>
  );
}
