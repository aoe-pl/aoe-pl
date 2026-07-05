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
import { UploadCloudIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmStep } from "./recordings/confirm-step";
import { DropZone } from "./recordings/drop-zone";
import { getStepWinner } from "./recordings/helpers";
import { RecordingsTable } from "./recordings/recordings-table";
import { useRecordingsUpload } from "./recordings/recordings-upload-hook";
import { StepIndicator } from "./recordings/step-indicator";

export interface RecordingsUploadDialogProps {
  player1Name: string;
  player2Name: string;
  gameCount?: number /** Total games possible (e.g. 5 for BO5). Falls back to 5 if not provided. */;
  isAdmin?: boolean;
}

export function RecordingsUploadDialog({
  player1Name,
  player2Name,
  gameCount = 5,
  isAdmin = false,
}: RecordingsUploadDialogProps) {
  const [open, setOpen] = useState(false);

  const {
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
    canGoNext,
    handleFiles,
    handleClearStep,
    handleSetWinner,
    handleNext,
    handleBack,
    reset,
  } = useRecordingsUpload(gameCount);

  // TODO: ! Will need to get playerIDs (from aoe2) so we can compare them and match with recording file data.
  // ! Otherwise we cannot know which player is which when uploading games!
  // -> game amon vs gwizdek can be uploaded with gwizdek as player1, and it's messed up

  const handleSubmit = () => {
    // TODO
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button size="lg">
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
              // TODO: fix "winner" being set to player (from website) instead of match player name
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
                    ? recPlayerNames?.player1
                    : winner === 2
                      ? recPlayerNames?.player2
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
                disabled={hasValidationErrors || hasNoFiles}
              >
                Confirm &amp; Submit
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
