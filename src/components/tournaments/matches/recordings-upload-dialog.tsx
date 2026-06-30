"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2Icon, UploadCloudIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmStep } from "./recordings/confirm-step";
import { DropZone } from "./recordings/drop-zone";
import { RecordingsTable } from "./recordings/recordings-table";
import { StepIndicator } from "./recordings/step-indicator";
import {
  buildInitialSteps,
  computeScores,
  trimSubSeconds,
  validateRestoredGame,
  winsNeeded,
  type GameStep,
} from "./recordings/types";
import { initializePyodide, parseRecording } from "./rec-parser";

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
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const totalSteps = gameCount + 1;
  const isConfirmStep = currentStep === gameCount;
  const currentGameStep = !isConfirmStep ? steps[currentStep] : null;

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
      setParsing(true);
      setParseError(null);

      try {
        const parsedResults = await Promise.all(
          newFiles.map(async (file) => {
            const parsed = await parseRecording(file);

            return { file, parsed };
          }),
        );

        setSteps((prev) => {
          const next = [...prev];
          const step = { ...next[currentStep]! };

          const newRecordings = parsedResults.map(({ file, parsed }) => {
            const winnerIdx = parsed.players.findIndex((p) => p.winner);
            const winner: 1 | 2 | null =
              winnerIdx === 0 ? 1 : winnerIdx === 1 ? 2 : null;

            return {
              fileName: file.name,
              player1: parsed.players[0]?.name ?? "",
              player2: parsed.players[1]?.name ?? "",
              civ1: parsed.players[0]?.civilization ?? "",
              civ2: parsed.players[1]?.civilization ?? "",
              map: parsed.map.name,
              length: trimSubSeconds(parsed.duration),
              date: parsed.timestamp
                ? new Date(parsed.timestamp).toISOString().slice(0, 10)
                : "",
              winner,
              guid: parsed.guid,
              restored: parsed.restored,
            };
          });

          step.files = [...step.files, ...newFiles];
          step.recordings = [...step.recordings, ...newRecordings];
          step.validationError = validateRestoredGame(step.recordings);
          next[currentStep] = step;

          const [p1Wins, p2Wins] = computeScores(next);
          const needed = winsNeeded(gameCount);

          // Mark remaining steps as skipped if one player has won the series already
          if (p1Wins >= needed || p2Wins >= needed) {
            for (let i = currentStep + 1; i < gameCount; i++) {
              next[i] = { ...next[i]!, skipped: true };
            }
          }

          return next;
        });
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse recording",
        );
      } finally {
        setParsing(false);
      }
    },
    [currentStep, gameCount],
  );

  const handleClearStep = useCallback(() => {
    setSteps((prev) => {
      const next = [...prev];
      next[currentStep] = {
        files: [],
        recordings: [],
        skipped: false,
        validationError: null,
      };
      return next;
    });
    setParseError(null);
  }, [currentStep]);

  const handleNext = () => {
    // Jump over any auto-skipped steps to reach the confirm step.
    let next = currentStep + 1;

    while (next < gameCount && steps[next]?.skipped) next++;

    if (next <= totalSteps - 1) setCurrentStep(next);
  };

  const handleBack = () => {
    let prev = currentStep - 1;

    while (prev > 0 && steps[prev]?.skipped) prev--;

    setCurrentStep(prev);
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
      setParseError(null);
    }
  };

  const hasValidationErrors = steps.some((s) => s.validationError !== null);
  const canGoNext =
    !parsing &&
    (currentGameStep?.files.length ?? 0) > 0 &&
    !currentGameStep?.validationError;

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

      <DialogContent className="flex max-h-[90vh] max-w-[72rem] flex-col gap-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Game Recordings (mgz)</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Upload <code>.aoe2record</code> files for{" "}
            <strong>{player1Name}</strong> vs <strong>{player2Name}</strong>.
            One file per game; add multiple if a game was restored.
          </p>
        </DialogHeader>

        {pyodideError && (
          <Alert variant="destructive">
            <AlertDescription>
              Error loading parser: {pyodideError}
            </AlertDescription>
          </Alert>
        )}

        {!pyodideReady && !pyodideError && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2Icon className="size-5 animate-spin" />
            Loading parser…
          </div>
        )}

        {pyodideReady && (
          <>
            <StepIndicator
              totalGames={gameCount}
              currentStep={currentStep}
              steps={steps}
            />

            {!isConfirmStep && currentGameStep && (
              <div className="space-y-4">
                <DropZone
                  onFiles={handleFiles}
                  existingCount={currentGameStep.files.length}
                  disabled={parsing}
                />

                {parsing && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2Icon className="size-4 animate-spin" />
                    Parsing recording…
                  </div>
                )}

                {parseError && (
                  <Alert variant="destructive">
                    <AlertDescription>{parseError}</AlertDescription>
                  </Alert>
                )}

                {currentGameStep.validationError && (
                  <Alert variant="destructive">
                    <AlertDescription className="flex items-start justify-between gap-4">
                      <span>{currentGameStep.validationError}</span>
                      <button
                        onClick={handleClearStep}
                        className="text-destructive shrink-0 text-xs underline"
                      >
                        Clear files
                      </button>
                    </AlertDescription>
                  </Alert>
                )}

                <RecordingsTable
                  recordings={currentGameStep.recordings}
                  showExample={currentGameStep.files.length === 0}
                />
              </div>
            )}

            {isConfirmStep && (
              <ConfirmStep
                steps={steps}
                gameCount={gameCount}
                player1Name={player1Name}
                player2Name={player2Name}
              />
            )}

            <div className="flex justify-end gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              {!isConfirmStep ? (
                canGoNext && (
                  <Button
                    size="sm"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={hasValidationErrors}
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
