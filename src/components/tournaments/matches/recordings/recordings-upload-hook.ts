import { RecordingParser } from "@/lib/recording-parser/RecordingParser";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import {
  buildInitialSteps,
  computeScores,
  getStepWinner,
  isSeriesDecided,
  resolveRecordingAlignment,
  validateGameRecFileData,
} from "./recordings-helpers";
import type { GameStep, MatchMode } from "./types";

interface UseRecordingsUploadOptions {
  gameCount: number; // Total number of games in the series (5 for BO5)
  mode: MatchMode;
  p1ProfileId: number | null;
  p2ProfileId: number | null;
}

/**
 * Custom hook for managing the state of a recordings upload dialog.
 * Handles the current step, parsing of files, validation, and navigation between steps.
 * @param gameCount The total number of games in the series (e.g., 5 for a best-of-5 series).
 * @param mode How the series is decided (see {@link MatchMode}).
 */
export function useRecordingsUpload({
  gameCount,
  mode,
  p1ProfileId,
  p2ProfileId,
}: UseRecordingsUploadOptions) {
  const t = useTranslations("tournament.matches.recordings");
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GameStep[]>(() =>
    buildInitialSteps(gameCount),
  );
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);

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
          t("parse_error_invalid_type", {
            files: invalidFiles.map((f) => f.name).join(", "),
          }),
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

          // Detect the player orientation from the profile ids. An admin can
          // override it later; the override is preserved when more files are
          // added so it isn't clobbered.
          const lastRecording = step.recordings.at(-1);
          step.autoPlayerSwap =
            lastRecording != null &&
            resolveRecordingAlignment(
              lastRecording,
              p1ProfileId,
              p2ProfileId,
            ) === "swap";

          // Validation is skipped while an admin takes manual control, so their
          // overrides aren't blocked by a profile mismatch.
          step.validationError = adminOverride
            ? null
            : validateGameRecFileData(
                step.recordings,
                p1ProfileId,
                p2ProfileId,
                {
                  profileMismatch: t("validation_error_profile_mismatch"),
                  invalidRecordings: t("validation_error"),
                },
              );

          next[currentStep] = step;

          // Mark the remaining steps as skipped once the series is decided.
          // Play-all series never end early, so every game is still played.
          if (isSeriesDecided(computeScores(next), gameCount, mode)) {
            for (let i = currentStep + 1; i < gameCount; i++) {
              next[i] = { ...next[i]!, skipped: true };
            }
          }

          return next;
        });
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : t("parse_error_failed"),
        );
      } finally {
        setParsing(false);
      }
    },
    [
      currentStep,
      gameCount,
      mode,
      adminOverride,
      parser,
      t,
      p1ProfileId,
      p2ProfileId,
    ],
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
        autoPlayerSwap: false,
        playerSwapOverride: null,
      };
      return next;
    });
    setParseError(null);
  }, [currentStep]);

  /** Pins the player orientation for the current game (admin only). */
  const handleSetSwap = useCallback(
    (swap: boolean) => {
      setSteps((prev) => {
        const next = [...prev];
        next[currentStep] = {
          ...next[currentStep]!,
          playerSwapOverride: swap,
        };
        return next;
      });
    },
    [currentStep],
  );

  /**
   * Toggle admin override. Enabling it clears validation errors so an admin can
   * take manual control; disabling it re-validates every loaded game.
   */
  const handleSetAdminOverride = useCallback(
    (value: boolean) => {
      setAdminOverride(value);
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          validationError:
            !value && step.recordings.length > 0
              ? validateGameRecFileData(
                  step.recordings,
                  p1ProfileId,
                  p2ProfileId,
                  {
                    profileMismatch: t("validation_error_profile_mismatch"),
                    invalidRecordings: t("validation_error"),
                  },
                )
              : null,
        })),
      );
    },
    [p1ProfileId, p2ProfileId, t],
  );

  const handleSetWinner = useCallback(
    (winner: 1 | 2) => {
      setSteps((prev) => {
        const next = [...prev];
        const step = { ...next[currentStep]! };
        step.winnerOverride = winner;
        next[currentStep] = step;

        // Only best-of series end early once the winner is decided.
        if (isSeriesDecided(computeScores(next), gameCount, mode)) {
          for (let i = currentStep + 1; i < gameCount; i++) {
            next[i] = { ...next[i]!, skipped: true };
          }
        }

        return next;
      });
    },
    [currentStep, gameCount, mode],
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
    setAdminOverride(false);
  };

  const hasValidationErrors = steps.some((s) => s.validationError !== null);
  const hasNoFiles = steps.every((s) => s.files.length === 0);
  const currentWinner = currentGameStep ? getStepWinner(currentGameStep) : null;
  const canGoNext =
    !parsing &&
    (currentGameStep?.files.length ?? 0) > 0 &&
    !currentGameStep?.validationError &&
    currentWinner !== null;

  return {
    steps,
    currentStep,
    parsing,
    parseError,
    adminOverride,
    isConfirmStep,
    currentGameStep,
    hasValidationErrors,
    hasNoFiles,
    currentWinner,
    canGoNext,
    handleFiles,
    handleClearStep,
    handleSetWinner,
    handleSetSwap,
    handleSetAdminOverride,
    handleNext,
    handleBack,
    reset,
  };
}
