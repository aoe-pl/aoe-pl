"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast-content";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildObjectKey, storagePaths } from "@/lib/storage/paths";
import { uploadFile } from "@/lib/storage/upload-client";
import { api } from "@/trpc/react";
import { UploadCloudIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmStep } from "./recordings/confirm-step";
import { DropZone } from "./recordings/drop-zone";
import {
  buildGamePayload,
  buildRecordingFileName,
  getStepWinner,
} from "./recordings/recordings-helpers";
import { RecordingsTable } from "./recordings/recordings-table";
import { useRecordingsUpload } from "./recordings/recordings-upload-hook";
import { StepIndicator } from "./recordings/step-indicator";
export interface RecordingsUploadDialogProps {
  player1Data: {
    profileId: number | null;
    name: string;
  };
  player2Data: {
    profileId: number | null;
    name: string;
  };
  matchNumber: number;
  tournamentName: string;
  matchId: string;
  player1MatchParticipantId: string;
  player2MatchParticipantId: string;
  gameCount?: number /** Total games possible (e.g. 5 for BO5). Falls back to 5 if not provided. */;
  isAdmin?: boolean;
}

export function RecordingsUploadDialog({
  player1Data,
  player2Data,
  matchNumber,
  tournamentName,
  matchId,
  player1MatchParticipantId,
  player2MatchParticipantId,
  gameCount = 5,
  isAdmin = false,
}: RecordingsUploadDialogProps) {
  const player1Name = player1Data.name;
  const player2Name = player2Data.name;

  // TODO See whether this check is needed.
  // IF enabled, users wont be able to upload recs to matches they are not a part of.
  // As apparently not everyone will have playerId, disabling this for now.
  const isUploadDisabled = false;

  // IF player1Data.profileId or player2Data.profileId, don't allow to upload recs. Disable the button.
  // const isUploadDisabled = player1Data.profileId === null || player2Data.profileId === null;

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { mutateAsync: saveRecordings } =
    api.tournaments.matches.saveRecordings.useMutation();

  const {
    steps,
    currentStep,
    parsing,
    parseError,
    strictValidation,
    setStrictValidation,
    isConfirmStep,
    currentGameStep,
    hasValidationErrors,
    hasNoFiles,
    canGoNext,
    handleFiles,
    handleClearStep,
    handleSetWinner,
    handleNext,
    handleBack,
    reset,
  } = useRecordingsUpload({
    gameCount,
    p1ProfileId: player1Data.profileId!, // ! Assume dialog won't even open if profileId is null, so we can safely assert non-null here.
    p2ProfileId: player2Data.profileId!,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const path = storagePaths.tournamentMatchGames(
        tournamentName,
        String(matchNumber),
      );
      const usedNames = new Set<string>();

      // Collect every raw file across all games, naming each one after the
      // players, map and game number parsed from it.
      const uploads = steps.flatMap((step, stepIndex) =>
        step.files.map((file) => {
          const recording = step.recordings.find(
            (r) => r.fileName === file.name,
          );
          return {
            file,
            stepIndex,
            fileName: buildRecordingFileName(
              file,
              recording,
              stepIndex + 1,
              usedNames,
            ),
          };
        }),
      );

      // The storage key is deterministic (path + sanitized file name), so we
      // can predict it and group the keys per game without waiting for Minio.
      const keysByStep = new Map<number, string[]>();
      for (const upload of uploads) {
        const key = buildObjectKey(path, upload.fileName);
        keysByStep.set(upload.stepIndex, [
          ...(keysByStep.get(upload.stepIndex) ?? []),
          key,
        ]);
      }

      // Build the payload for every game that has recordings attached.
      const games = steps.flatMap((step, stepIndex) => {
        const recordingKeys = keysByStep.get(stepIndex);
        if (!recordingKeys || recordingKeys.length === 0) return [];

        return [
          buildGamePayload({
            step,
            gameNumber: stepIndex + 1,
            recordingKeys,
            player1: {
              matchParticipantId: player1MatchParticipantId,
              profileId: player1Data.profileId,
            },
            player2: {
              matchParticipantId: player2MatchParticipantId,
              profileId: player2Data.profileId,
            },
          }),
        ];
      });

      // Persist the games first so the score table updates right away; the
      // (slower) Minio uploads happen in the background afterwards.
      await saveRecordings({ matchId, games });

      toast.success(
        games.length === 1 ? "Recording saved" : `${games.length} games saved`,
      );

      router.refresh();
      setOpen(false);

      // Fire-and-forget: the games already reference the predicted keys.
      void toast.promise(
        Promise.all(
          uploads.map((upload) =>
            uploadFile({
              file: upload.file,
              path,
              fileName: upload.fileName,
            }),
          ),
        ),
        {
          loading: "Uploading recordings…",
          success: "Recordings uploaded",
          error: "Recordings saved, but the upload failed",
        },
      );
    } catch (error) {
      toast.error(
        <ErrorToast
          message={
            error instanceof Error ? error.message : "Failed to save recordings"
          }
        />,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  if (isUploadDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              size="lg"
              disabled
              className="disabled:pointer-events-auto disabled:cursor-not-allowed"
            >
              Upload Recs
            </Button>
          </span>
        </TooltipTrigger>

        <TooltipContent>
          Upload is disabled because because one or both players do not have a
          valid aoe2companion link set on their profile page.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          disabled={isUploadDisabled}
          className="disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          <UploadCloudIcon />
          Upload Recs
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Upload Game Recordings
          </DialogTitle>
          <p className="text-center">
            Upload aoe2record files for <strong>{player1Name}</strong> vs{" "}
            <strong>{player2Name}</strong>.
            <br />
            One file per game; add multiple if a game was restored.
          </p>
        </DialogHeader>

        <StepIndicator
          totalGames={gameCount}
          currentStep={currentStep}
          steps={steps}
        />

        {!isConfirmStep && currentGameStep && (
          <div className="space-y-4">
            <DropZone
              onFiles={handleFiles}
              disabled={parsing}
            />

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
                    className="text-destructive shrink-0 underline"
                  >
                    Clear files
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {!hasNoFiles && (
              <RecordingsTable recordings={currentGameStep.recordings} />
            )}

            {currentGameStep.files.length > 0 &&
              (() => {
                const winner = getStepWinner(currentGameStep);

                const winnerName =
                  winner === 1
                    ? player1Data.name
                    : winner === 2
                      ? player2Data.name
                      : null;

                return winnerName ? (
                  <p className="text-sm">
                    Winner:{" "}
                    <span className="font-semibold text-green-500">
                      {winnerName}
                    </span>
                  </p>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription className="space-y-2">
                      <p>
                        Winner could not be determined automatically. Please
                        select the winner manually.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetWinner(1)}
                        >
                          {player1Name}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetWinner(2)}
                        >
                          {player2Name}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })()}
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

        <div className="flex items-center justify-between gap-2">
          {!isConfirmStep && isAdmin && (
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs select-none">
              <Checkbox
                checked={strictValidation}
                onCheckedChange={(v) => setStrictValidation(!!v)}
              />
              Validate files
            </label>
          )}
          <div className="flex flex-1 justify-end gap-2">
            {currentStep > 0 && <Button onClick={handleBack}>Back</Button>}

            {isConfirmStep && (
              <Button
                onClick={handleSubmit}
                disabled={hasValidationErrors || hasNoFiles || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            )}

            {!isConfirmStep && canGoNext && (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
