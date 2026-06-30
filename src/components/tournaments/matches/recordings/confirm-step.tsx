import { computeScores, winsNeeded } from "./types";
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
  player1Name,
  player2Name,
}: ConfirmStepProps) {
  const uploadedSteps = steps
    .map((step, i) => ({ step, gameNumber: i + 1 }))
    .filter(({ step }) => step.files.length > 0);

  const [p1Wins, p2Wins] = computeScores(steps);

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
        </p>
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
