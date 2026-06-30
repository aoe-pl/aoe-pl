import { RecordingsTable } from "./recordings-table";
import type { GameStep } from "./types";

interface ConfirmStepProps {
  steps: GameStep[];
}

export function ConfirmStep({ steps }: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Review the uploaded recordings before submitting.
      </p>
      {steps.map((step, i) => (
        <div
          key={i}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold">Game {i + 1}</h3>
          {step.files.length === 0 ? (
            <p className="text-muted-foreground text-xs">No file uploaded.</p>
          ) : (
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {step.files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
          <RecordingsTable
            recordings={step.recordings}
            showExample={false}
          />
        </div>
      ))}
    </div>
  );
}
