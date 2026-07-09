import { RecordingParser } from "@/lib/recording-parser/RecordingParser";
import { useCallback, useMemo, useState } from "react";
import {
  buildInitialSteps,
  computeScores,
  getStepWinner,
  validateGameRecFileData,
  winsNeeded,
} from "./helpers";
import type { GameStep } from "./types";

interface UseRecordingsUploadOptions {
  gameCount: number; // Total number of games in the series (5 for BO5)
  p1ProfileId: number;
  p2ProfileId: number;
}

/**
 * Custom hook for managing the state of a recordings upload dialog.
 * Handles the current step, parsing of files, validation, and navigation between steps.
 * @param gameCount The total number of games in the series (e.g., 5 for a best-of-5 series).
 */
export function useRecordingsUpload({
  gameCount,
  p1ProfileId,
  p2ProfileId,
}: UseRecordingsUploadOptions) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GameStep[]>(() =>
    buildInitialSteps(gameCount),
  );
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [strictValidation, setStrictValidation] = useState(true);
  const [recPlayerNames, setRecPlayerNames] = useState<{
    player1: string;
    player2: string;
  }>();

  const parser = useMemo(() => new RecordingParser(), []);

  const totalSteps = gameCount + 1;
  const isConfirmStep = currentStep === gameCount;
  const currentGameStep = !isConfirmStep ? steps[currentStep] : null;

  const handleFiles = useCallback(
    async (newFiles: File[]) => {
      const invalidFiles = newFiles.filter(
        (f) => !f.name.endsWith(".aoe2record"),
      );

      if (invalidFiles.length > 0) {
        setParseError(
          `Invalid file type: ${invalidFiles.map((f) => f.name).join(", ")}. Only .aoe2record files are accepted.`,
        );
        return;
      }

      setParsing(true);
      setParseError(null);

      try {
        const parsedResults = await Promise.all(
          newFiles.map((file) => parser.parse(file)),
        );

        setSteps((prev) => {
          const next = [...prev];
          const step = { ...next[currentStep]! };

          step.files = [...step.files, ...newFiles];
          step.recordings = [...step.recordings, ...parsedResults];

          // Auto-sort by worldtime.
          step.recordings.sort((a, b) => a.worldTime - b.worldTime);

          if (strictValidation) {
            step.validationError = validateGameRecFileData(
              step.recordings,
              p1ProfileId,
              p2ProfileId,
            );
          } else {
            step.validationError = null;
          }

          next[currentStep] = step;

          setRecPlayerNames({
            player1: step.recordings[0]?.player1Data?.name ?? "?",
            player2: step.recordings[0]?.player2Data?.name ?? "?",
          });

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
    [currentStep, gameCount, strictValidation, parser],
  );

  const handleClearStep = useCallback(() => {
    setSteps((prev) => {
      const next = [...prev];
      next[currentStep] = {
        files: [],
        recordings: [],
        skipped: false,
        validationError: null,
        winnerOverride: null,
      };
      return next;
    });
    setParseError(null);
  }, [currentStep]);

  const handleSetWinner = useCallback(
    (winner: 1 | 2) => {
      setSteps((prev) => {
        const next = [...prev];
        const step = { ...next[currentStep]! };
        step.winnerOverride = winner;
        next[currentStep] = step;

        const [p1Wins, p2Wins] = computeScores(next);
        const needed = winsNeeded(gameCount);
        if (p1Wins >= needed || p2Wins >= needed) {
          for (let i = currentStep + 1; i < gameCount; i++) {
            next[i] = { ...next[i]!, skipped: true };
          }
        }

        return next;
      });
    },
    [currentStep, gameCount],
  );

  const handleNext = () => {
    let next = currentStep + 1;
    while (next < gameCount && steps[next]?.skipped) next++;
    if (next <= totalSteps - 1) setCurrentStep(next);
  };

  const handleBack = () => {
    let prev = currentStep - 1;
    while (prev > 0 && steps[prev]?.skipped) prev--;
    setCurrentStep(prev);
  };

  const reset = () => {
    setCurrentStep(0);
    setSteps(buildInitialSteps(gameCount));
    setParseError(null);
    setParsing(false);
    setStrictValidation(true);
  };

  const hasValidationErrors = steps.some((s) => s.validationError !== null);
  const hasNoFiles = steps.every((s) => s.files.length === 0);
  const currentWinner = currentGameStep ? getStepWinner(currentGameStep) : null;
  const canGoNext =
    !parsing &&
    (currentGameStep?.files.length ?? 0) > 0 &&
    !currentGameStep?.validationError &&
    currentWinner !== null;

  console.log(canGoNext, currentGameStep?.validationError);
  return {
    steps,
    currentStep,
    parsing,
    parseError,
    strictValidation,
    setStrictValidation,
    recPlayerNames,
    isConfirmStep,
    currentGameStep,
    hasValidationErrors,
    hasNoFiles,
    currentWinner,
    canGoNext,
    handleFiles,
    handleClearStep,
    handleSetWinner,
    handleNext,
    handleBack,
    reset,
  };
}
