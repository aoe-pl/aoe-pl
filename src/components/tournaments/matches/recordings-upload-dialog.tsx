"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloudIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmStep } from "./recordings/confirm-step";
import { DropZone } from "./recordings/drop-zone";
import { RecordingsTable } from "./recordings/recordings-table";
import { StepIndicator } from "./recordings/step-indicator";
import { buildInitialSteps, type GameStep } from "./recordings/types";
import { initializePyodide, parseRecording } from "./rec-parser";
import type { MgzMatch } from "./rec-types";

export interface RecordingsUploadDialogProps {
  player1Name: string;
  player2Name: string;
  gameCount?: number /** Total games possible (e.g. 5 for BO5). Falls back to 5 if not provided. */;
}

export function RecordingsUploadDialog({
  player1Name,
  player2Name,
  gameCount = 5,
}: RecordingsUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GameStep[]>(() =>
    buildInitialSteps(gameCount),
  );
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);

  const totalSteps = gameCount + 1;
  const isConfirmStep = currentStep === gameCount;

  useEffect(() => {
    if (!open || pyodideReady) return;
    setPyodideError(null);
    initializePyodide()
      .then(() => setPyodideReady(true))
      .catch((err: unknown) =>
        setPyodideError(
          err instanceof Error ? err.message : "Failed to load Pyodide",
        ),
      );
  }, [open, pyodideReady]);

  const handleFiles = useCallback(
    async (newFiles: File[]) => {
      const parsedResults = await Promise.all(
        newFiles.map(async (file) => {
          const parsed = await parseRecording(file);
          return { file, parsed };
        }),
      );

      setSteps((prev) => {
        const next = [...prev];
        const step = { ...next[currentStep]! };
        step.files = [...step.files, ...newFiles];
        step.recordings = [
          ...step.recordings,
          ...parsedResults.map(
            ({ file, parsed }: { file: File; parsed: MgzMatch }) => ({
              fileName: file.name,
              player1: parsed.players[0]?.name ?? "",
              player2: parsed.players[1]?.name ?? "",
              map: parsed.map.name,
              length: parsed.duration,
              date: parsed.timestamp
                ? new Date(parsed.timestamp).toISOString().slice(0, 10)
                : "",
            }),
          ),
        ];
        next[currentStep] = step;
        return next;
      });
    },
    [currentStep],
  );

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };

  const handleSubmit = () => {
    // TODO: call uploadRecordings() with matchId + uploader
    setOpen(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setCurrentStep(0);
      setSteps(buildInitialSteps(gameCount));
    }
  };

  const currentGameStep = !isConfirmStep ? steps[currentStep] : null;

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <UploadCloudIcon />
          Upload Recs
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Game Recordings (mgz)</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Upload <code>.aoe2record</code> files for{" "}
            <strong>{player1Name}</strong> vs <strong>{player2Name}</strong>.
            One file per game; add multiple if a game was restored.
          </p>
        </DialogHeader>

        {pyodideError && (
          <p className="text-destructive text-sm">
            Error loading parser: {pyodideError}
          </p>
        )}

        {pyodideReady && (
          <>
            <StepIndicator
              totalGames={gameCount}
              currentStep={currentStep}
            />

            {!isConfirmStep && currentGameStep && (
              <div className="space-y-4">
                <DropZone
                  onFiles={handleFiles}
                  existingCount={currentGameStep.files.length}
                />
                <RecordingsTable
                  recordings={currentGameStep.recordings}
                  showExample={currentGameStep.files.length === 0}
                />
              </div>
            )}

            {isConfirmStep && <ConfirmStep steps={steps} />}

            <div className="flex justify-end gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              {!isConfirmStep ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                >
                  Confirm &amp; Submit
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
