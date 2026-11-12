"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { TriangleAlertIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminOverridePanel } from "./recordings/admin-override-panel";
import { DropZone } from "./recordings/drop-zone";
import {
  buildGamePayload,
  buildRecordingFileName,
  computeScores,
  getGameAlignment,
  getGameSwap,
  getGameWinner,
  isRestoredGame,
} from "./recordings/recordings-helpers";
import { PlayerMappingPanel } from "./recordings/player-mapping-panel";
import { RecordingsList } from "./recordings/recordings-list";
import { useRecordingsUpload } from "./recordings/recordings-upload-hook";
import type { MatchMode } from "./recordings/types";

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
  gameCount?: number;
  mode?: MatchMode;
  isAdmin?: boolean;
  canManageRecordings?: boolean;
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
  mode = "BEST_OF",
  isAdmin = false,
  canManageRecordings = true,
}: RecordingsUploadDialogProps) {
  const player1Name = player1Data.name;
  const player2Name = player2Data.name;
  const t = useTranslations("tournament.matches.recordings");

  // A player may not have an aoe2companion profile linked, so profileId can be
  // null. At least one known id is required to map the recording's players onto
  // the match's players, so upload is only disabled when neither player has one.
  // Whether the id actually matches a recording is checked during validation,
  // once the files have been parsed.
  const isUploadDisabled =
    player1Data.profileId === null && player2Data.profileId === null;

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { mutateAsync: saveRecordings } =
    api.tournaments.matches.saveRecordings.useMutation();

  const {
    games,
    parsing,
    parseError,
    adminOverride,
    tooManyGames,
    ignoredGamesCount,
    seriesComplete,
    mappedPlayer1,
    playerMappingError,
    playersMismatchError,
    canSubmit,
    handleFiles,
    handleRemoveGame,
    handleSetMappedPlayer1,
    handleSetWinner,
    handleSetAdminOverride,
    reset,
  } = useRecordingsUpload({
    gameCount,
    mode,
    p1Name: player1Name,
    p2Name: player2Name,
    p1ProfileId: player1Data.profileId,
    p2ProfileId: player2Data.profileId,
  });

  // All games are expected to feature the same players, so the mapping is
  // selected once. Admins can also use the panel to force a mapping.
  const mappingNeeded = games.some((game) => game.autoAlignment === "unknown");
  const showMappingPanel =
    games.length > 0 && (mappingNeeded || (isAdmin && adminOverride));
  const referenceRecording = games[0]?.recordings.at(-1);

  const isPlayAll = mode === "PLAY_ALL";
  const [p1Wins, p2Wins] = computeScores(games);
  const uploadedCount = games.length;
  // A play-all series always consists of every game; a best-of series consists
  // of the games that were actually decided (i.e. have a winner).
  const expectedGames = isPlayAll ? gameCount : p1Wins + p2Wins;

  // Warn when the amount of uploaded games doesn't match the series result.
  const countMismatch =
    uploadedCount > 0 &&
    !tooManyGames &&
    (seriesComplete ? uploadedCount !== expectedGames : true);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const path = storagePaths.tournamentMatchGames(
        tournamentName,
        String(matchNumber),
      );
      const usedNames = new Set<string>();

      // Collect every raw file across all games, naming each one after the
      // players and game number parsed from it.
      const uploads = games.flatMap((game, gameIndex) =>
        game.files.map((file, fileIndex) => ({
          file,
          gameIndex,
          fileName: buildRecordingFileName(
            file,
            game.recordings[fileIndex],
            gameIndex + 1,
            usedNames,
            getGameSwap(game),
          ),
        })),
      );

      // The storage key is deterministic (path + sanitized file name), so we
      // can predict it and group the keys per game without waiting for Minio.
      const keysByGame = new Map<number, string[]>();
      for (const upload of uploads) {
        const key = buildObjectKey(path, upload.fileName);
        keysByGame.set(upload.gameIndex, [
          ...(keysByGame.get(upload.gameIndex) ?? []),
          key,
        ]);
      }

      // Build the payload for every detected game.
      const gamePayloads = games.flatMap((game, gameIndex) => {
        const recordingKeys = keysByGame.get(gameIndex);
        if (!recordingKeys || recordingKeys.length === 0) return [];

        return [
          buildGamePayload({
            game,
            gameNumber: gameIndex + 1,
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
      await saveRecordings({ matchId, games: gamePayloads });

      toast.success(t("saved_toast", { count: gamePayloads.length }));

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
          loading: t("uploading_toast"),
          success: t("uploaded_toast"),
          error: t("upload_failed_toast"),
        },
      );
    } catch (error) {
      toast.error(
        <ErrorToast
          message={error instanceof Error ? error.message : t("save_error")}
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

  // Only admins and players directly involved in the match may upload recs.
  if (!canManageRecordings) {
    return null;
  }

  if (isUploadDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-full">
            <Button
              size="lg"
              variant="gold"
              disabled
              className="w-full disabled:pointer-events-auto disabled:cursor-not-allowed"
            >
              {t("upload_button")}
            </Button>
          </span>
        </TooltipTrigger>

        <TooltipContent>{t("upload_disabled_tooltip")}</TooltipContent>
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
          variant="gold"
          disabled={isUploadDisabled}
          className="w-full disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          <UploadCloudIcon />
          {t("upload_button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-medieval-gold text-center">
            {t("title")}
          </DialogTitle>
          <p className="text-medieval-gold-muted text-center text-sm">
            {t("subtitle", { player1: player1Name, player2: player2Name })}
            <br />
          </p>
        </DialogHeader>

        <DropZone
          onFiles={handleFiles}
          disabled={parsing || isSubmitting}
          compact={games.length > 0}
        />

        {parseError && (
          <Alert variant="destructive">
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {tooManyGames && (
          <Alert variant="destructive">
            <AlertDescription>
              {t("too_many_games", {
                count: uploadedCount,
                total: gameCount,
              })}
            </AlertDescription>
          </Alert>
        )}

        {ignoredGamesCount > 0 && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 [&>svg]:text-amber-500">
            <TriangleAlertIcon className="size-4" />
            <AlertDescription>
              {t("ignored_games", { count: ignoredGamesCount })}
            </AlertDescription>
          </Alert>
        )}

        {playersMismatchError && (
          <Alert variant="destructive">
            <AlertDescription>{playersMismatchError}</AlertDescription>
          </Alert>
        )}

        {playerMappingError && (
          <Alert variant="destructive">
            <AlertDescription>{playerMappingError}</AlertDescription>
          </Alert>
        )}

        {showMappingPanel && (
          <PlayerMappingPanel
            player1Name={player1Name}
            player2Name={player2Name}
            recordedPlayer1={referenceRecording?.player1Data ?? null}
            recordedPlayer2={referenceRecording?.player2Data ?? null}
            selectedPlayer1={mappedPlayer1}
            onSelectPlayer1={handleSetMappedPlayer1}
          />
        )}

        {games.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {games.map((game, gameIndex) => {
              const winner = getGameWinner(game);
              const mappingResolved = getGameAlignment(game) !== "unknown";

              return (
                <div
                  key={game.key}
                  className="border-medieval-wood-border w-full space-y-3 rounded-xl border p-3 sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-medieval-gold font-semibold">
                        {t("confirm.game_label", { number: gameIndex + 1 })}
                      </p>
                      {isRestoredGame(game) && (
                        <Badge
                          variant="outline"
                          className="border-medieval-gold-muted/40 text-medieval-gold-muted"
                        >
                          {t("restored_badge")}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-medieval-gold-muted hover:text-destructive"
                      disabled={isSubmitting || parsing}
                      onClick={() => handleRemoveGame(game.key)}
                    >
                      <XIcon className="size-4" />
                      <span className="sr-only">{t("clear_files")}</span>
                    </Button>
                  </div>

                  <RecordingsList recordings={game.recordings} />

                  {game.validationError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {game.validationError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Manual winner selection when it couldn't be read. */}
                  {winner === null &&
                    mappingResolved &&
                    (!isAdmin || !adminOverride) && (
                      <Alert variant="destructive">
                        <AlertDescription className="space-y-2">
                          <p>{t("winner_manual_prompt")}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetWinner(game.key, 1)}
                            >
                              {player1Name}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetWinner(game.key, 2)}
                            >
                              {player2Name}
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                  {/* Admins can fix the player orientation and the winner by hand. */}
                  {isAdmin && adminOverride && (
                    <AdminOverridePanel
                      player1Name={player1Name}
                      player2Name={player2Name}
                      winner={winner}
                      onSetWinner={(value) => handleSetWinner(game.key, value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {games.length > 0 && (
          <div className="space-y-3">
            <p className="text-medieval-parchment-foreground text-center text-lg font-medium">
              <span>{player1Name}</span>{" "}
              <span className={p1Wins > p2Wins ? "text-medieval-gold" : ""}>
                {p1Wins}
              </span>
              <span className="text-medieval-gold-muted mx-1">:</span>
              <span className={p2Wins > p1Wins ? "text-medieval-gold" : ""}>
                {p2Wins}
              </span>{" "}
              <span>{player2Name}</span>
            </p>

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
        )}

        <div className="flex flex-col items-center gap-3">
          {isAdmin && (
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs select-none">
              <Checkbox
                checked={adminOverride}
                onCheckedChange={(v) => handleSetAdminOverride(!!v)}
              />
              {t("admin.toggle")}
            </label>
          )}

          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full min-w-48 sm:w-auto"
          >
            {isSubmitting ? t("submitting_button") : t("submit_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
