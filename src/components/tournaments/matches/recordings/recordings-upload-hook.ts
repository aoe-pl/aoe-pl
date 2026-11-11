import { RecordingParser } from "@/lib/recording-parser/RecordingParser";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import {
  computeScores,
  findDifferentPlayers,
  gameKey,
  getGameAlignment,
  getGameWinner,
  getSeriesGames,
  getSwapForMappedPlayer,
  groupRecordingFiles,
  isSeriesDecided,
  resolveRecordingAlignment,
  validateGameRecFileData,
} from "./recordings-helpers";
import type {
  MatchMode,
  ParsedGame,
  ParsedRecordingFile,
  RecordedPlayer,
} from "./types";

interface UseRecordingsUploadOptions {
  gameCount: number; // Total number of games in the series (5 for BO5)
  mode: MatchMode;
  p1Name: string;
  p2Name: string;
  p1ProfileId: number | null;
  p2ProfileId: number | null;
}

/**
 * Custom hook for managing the state of a recordings upload dialog.
 * Parses every dropped file immediately, groups recordings that belong to the
 * same game and validates the result.
 * @param gameCount The total number of games in the series (e.g., 5 for a best-of-5 series).
 */
export function useRecordingsUpload({
  gameCount,
  mode,
  p1Name,
  p2Name,
  p1ProfileId,
  p2ProfileId,
}: UseRecordingsUploadOptions) {
  const t = useTranslations("tournament.matches.recordings");
  const [entries, setEntries] = useState<ParsedRecordingFile[]>([]);
  const [winnerOverrides, setWinnerOverrides] = useState<
    Record<string, 1 | 2 | null>
  >({});
  // All recordings are expected to feature the same players, so the mapping is
  // chosen once and applied to every game.
  const [mappedPlayer1, setMappedPlayer1] = useState<RecordedPlayer | null>(
    null,
  );
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);

  const parser = useMemo(() => new RecordingParser(), []);

  // Games are derived from the parsed files, so adding or removing a file
  // automatically re-groups and re-validates everything.
  const allGames = useMemo<ParsedGame[]>(
    () =>
      groupRecordingFiles(entries).map((group) => {
        const recordings = group.map((entry) => entry.recording);
        const key = gameKey(group);
        const lastRecording = recordings.at(-1);
        const autoAlignment = lastRecording
          ? resolveRecordingAlignment(lastRecording, p1ProfileId, p2ProfileId)
          : "unknown";
        const manualSwap =
          lastRecording && mappedPlayer1
            ? getSwapForMappedPlayer(lastRecording, mappedPlayer1)
            : null;

        return {
          key,
          files: group.map((entry) => entry.file),
          recordings,
          // Validation is skipped while an admin takes manual control. The
          // match-up check against profile ids is handled by the global player
          // mapping, so only the consistency of the game's own recordings is
          // checked here.
          validationError: adminOverride
            ? null
            : validateGameRecFileData(
                recordings,
                p1ProfileId,
                p2ProfileId,
                {
                  profileMismatch: t("validation_error_profile_mismatch"),
                  invalidRecordings: t("validation_error"),
                },
                { allowProfileMismatch: true },
              ),
          autoAlignment,
          winnerOverride: winnerOverrides[key] ?? null,
          playerSwapOverride: manualSwap,
        };
      }),
    [
      entries,
      winnerOverrides,
      mappedPlayer1,
      adminOverride,
      p1ProfileId,
      p2ProfileId,
      t,
    ],
  );

  // In best-of series, games played after the clinching win do not count.
  const games = useMemo(
    () => getSeriesGames(allGames, gameCount, mode),
    [allGames, gameCount, mode],
  );
  const ignoredGamesCount = allGames.length - games.length;

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
        const parsedFiles = await Promise.all(
          newFiles.map(async (file) => ({
            file,
            recording: await parser.parse(file),
          })),
        );

        // Drop the same file if it is added twice; the browser cannot tell us
        // whether two files are identical beyond their metadata.
        setEntries((prev) => {
          const seen = new Set(
            prev.map(
              ({ file }) => `${file.name}:${file.size}:${file.lastModified}`,
            ),
          );

          return [
            ...prev,
            ...parsedFiles.filter(({ file }) => {
              const key = `${file.name}:${file.size}:${file.lastModified}`;
              if (seen.has(key)) return false;

              seen.add(key);

              return true;
            }),
          ];
        });
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : t("parse_error_failed"),
        );
      } finally {
        setParsing(false);
      }
    },
    [parser, t],
  );

  const handleRemoveGame = useCallback((key: string) => {
    setEntries((prev) => {
      const target = groupRecordingFiles(prev).find(
        (group) => gameKey(group) === key,
      );

      if (!target) return prev;

      const filesToRemove = new Set(target.map(({ file }) => file));

      return prev.filter(({ file }) => !filesToRemove.has(file));
    });

    setWinnerOverrides((prev) => {
      if (!(key in prev)) return prev;

      const next = { ...prev };
      delete next[key];

      return next;
    });
  }, []);

  /**
   * Selects which recorded player is match player 1. The other recorded player
   * is match player 2. Applies to every uploaded game.
   */
  const handleSetMappedPlayer1 = useCallback(
    (player: RecordedPlayer | null) => {
      setMappedPlayer1(player);
      // A winner picked earlier may no longer be valid after remapping.
      setWinnerOverrides({});
    },
    [],
  );

  const handleSetWinner = useCallback((key: string, winner: 1 | 2) => {
    setWinnerOverrides((prev) => ({ ...prev, [key]: winner }));
  }, []);

  /**
   * Toggle admin override. Enabling it clears validation errors so an admin can
   * take manual control; disabling it re-validates every loaded game.
   */
  const handleSetAdminOverride = useCallback((value: boolean) => {
    setAdminOverride(value);
  }, []);

  const reset = useCallback(() => {
    setEntries([]);
    setWinnerOverrides({});
    setMappedPlayer1(null);
    setParseError(null);
    setParsing(false);
    setAdminOverride(false);
  }, []);

  // Best-of extras are ignored rather than rejected; play-all must be exact.
  const tooManyGames = mode === "PLAY_ALL" && games.length > gameCount;
  const differentPlayers = findDifferentPlayers(games);
  const playersMismatchError = differentPlayers
    ? t("validation_error_different_players", { ...differentPlayers })
    : null;
  const unmappedRecording = games
    .find((game) => getGameAlignment(game) === "unknown")
    ?.recordings.at(-1);
  const playerMappingError =
    unmappedRecording && mappedPlayer1 === null
      ? t("validation_error_player_mismatch", {
          recordedPlayer1: unmappedRecording.player1Data.name,
          recordedPlayer2: unmappedRecording.player2Data.name,
          player1: p1Name,
          player2: p2Name,
        })
      : null;

  const hasValidationErrors =
    tooManyGames ||
    differentPlayers !== null ||
    games.some((game) => game.validationError !== null);
  const hasNoFiles = entries.length === 0;
  const hasMissingWinners = games.some((game) => getGameWinner(game) === null);
  const hasUnmappedGames = games.some(
    (game) => getGameAlignment(game) === "unknown",
  );
  const seriesComplete =
    mode === "PLAY_ALL"
      ? games.length === gameCount
      : isSeriesDecided(computeScores(games), gameCount, mode);
  const canSubmit =
    !parsing &&
    !hasNoFiles &&
    !hasValidationErrors &&
    !hasMissingWinners &&
    !hasUnmappedGames &&
    seriesComplete;

  return {
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
    hasValidationErrors,
    hasNoFiles,
    hasMissingWinners,
    hasUnmappedGames,
    canSubmit,
    handleFiles,
    handleRemoveGame,
    handleSetMappedPlayer1,
    handleSetWinner,
    handleSetAdminOverride,
    reset,
  };
}
