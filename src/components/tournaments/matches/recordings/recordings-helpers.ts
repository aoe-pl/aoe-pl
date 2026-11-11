import type { ParsedRecording } from "@/lib/recording-parser/types";
import { sanitizeFileName } from "@/lib/storage/paths";
import type {
  MatchMode,
  ParsedGame,
  ParsedRecordingFile,
  PlayerAlignment,
  RecordedPlayer,
} from "./types";

/**
 * A recording with a world time above this value was started from a saved game,
 * i.e. it is a later segment of a game that was restored.
 */
const RESTORED_WORLD_TIME_THRESHOLD = 1;

/**
 * Whether the recording starts in the middle of a game (restored game).
 */
export function isRestoredRecording(recording: ParsedRecording): boolean {
  return recording.worldTime > RESTORED_WORLD_TIME_THRESHOLD;
}

/**
 * Whether a game is made of more than one recording segment.
 */
export function isRestoredGame(game: ParsedGame): boolean {
  return game.recordings.some(isRestoredRecording);
}

/**
 * Number of game wins a player needs to win a best-of series.
 */
export function winsNeeded(gameCount: number): number {
  return Math.ceil(gameCount / 2);
}

/**
 * Whether the winner of the series is already decided by the played games.
 */
export function isSeriesDecided(
  scores: [number, number],
  gameCount: number,
  mode: MatchMode,
): boolean {
  if (mode === "PLAY_ALL") return false;

  const needed = winsNeeded(gameCount);
  return scores[0] >= needed || scores[1] >= needed;
}

/** Stable key for a group of recordings that belong to the same game. */
export function gameKey(entries: ParsedRecordingFile[]): string {
  const first = entries[0];

  return first
    ? `${first.file.name}:${first.file.size}:${first.file.lastModified}`
    : "";
}

/**
 * Sort recordings by their file modified date, falling back to the timestamp
 * stored in the recording header when the browser could not provide the date
 * or when the dates are equal.
 */
export function sortRecordingFiles(
  entries: ParsedRecordingFile[],
): ParsedRecordingFile[] {
  // Some environments cannot expose `lastModified` (it is then 0), so only use
  // file dates when every recording has one.
  const useFileDates = entries.every((entry) => entry.file.lastModified > 0);

  return [...entries].sort((a, b) => {
    if (useFileDates) {
      const byFileDate = a.file.lastModified - b.file.lastModified;

      if (byFileDate !== 0) return byFileDate;
    }

    return a.recording.timestamp - b.recording.timestamp;
  });
}

/** Whether two recordings look like segments of the same game. */
function isSameGame(a: ParsedRecording, b: ParsedRecording): boolean {
  const sameProfiles =
    (a.player1Data.profileId === b.player1Data.profileId &&
      a.player2Data.profileId === b.player2Data.profileId) ||
    (a.player1Data.profileId === b.player2Data.profileId &&
      a.player2Data.profileId === b.player1Data.profileId);

  return sameProfiles && a.map === b.map;
}

/**
 * Group parsed recordings into games. Files are ordered by their modified date,
 * then each restored segment (world time > 1) is merged into the preceding
 * game when it continues the same map and players. Recordings that start at
 * world time 0 always begin a new game.
 */
export function groupRecordingFiles(
  entries: ParsedRecordingFile[],
): ParsedRecordingFile[][] {
  const games: ParsedRecordingFile[][] = [];

  for (const entry of sortRecordingFiles(entries)) {
    const current = games.at(-1);
    const previous = current?.at(-1);

    const continuesGame =
      current != null &&
      previous != null &&
      isRestoredRecording(entry.recording) &&
      entry.recording.worldTime > previous.recording.worldTime &&
      isSameGame(previous.recording, entry.recording);

    if (continuesGame) {
      current.push(entry);
    } else {
      games.push([entry]);
    }
  }

  // Replay position is authoritative inside a game, so the last recording is
  // always the segment that finished it.
  for (const game of games) {
    game.sort((a, b) => {
      const byWorldTime = a.recording.worldTime - b.recording.worldTime;

      if (byWorldTime !== 0) return byWorldTime;

      return a.recording.timestamp - b.recording.timestamp;
    });
  }

  return games;
}

/**
 * Effective player alignment. A manual mapping wins over the value detected
 * from the aoe2companion profile ids.
 */
export function getGameAlignment(game: ParsedGame): PlayerAlignment {
  if (game.playerSwapOverride !== null) {
    return game.playerSwapOverride ? "swap" : "same";
  }

  return game.autoAlignment;
}

/**
 * Manual mapping state: `true` = swapped, `false` = same, `null` = not mapped
 * and not detectable from the profile ids.
 */
export function getGameSwapChoice(game: ParsedGame): boolean | null {
  const alignment = getGameAlignment(game);

  return alignment === "unknown" ? null : alignment === "swap";
}

/**
 * Whether the recording's parsed player 1 is the match's player 2. Defaults to
 * `false` when the alignment is unknown; submission is blocked in that case.
 */
export function getGameSwap(game: ParsedGame): boolean {
  return getGameSwapChoice(game) ?? false;
}

/**
 * Returns the effective winner for a game in match terms (1 = match player 1).
 * The manual override takes priority. Without a known player mapping the
 * recording's winner cannot be assigned to a match player.
 */
export function getGameWinner(game: ParsedGame): 1 | 2 | null {
  if (game.recordings.length === 0) return null;

  if (game.winnerOverride !== null) return game.winnerOverride;

  if (getGameAlignment(game) === "unknown") return null;

  const winner = game.recordings.at(-1)!.winner;
  if (winner === null) return null;

  return getGameSwap(game) ? (winner === 1 ? 2 : 1) : winner;
}

/**
 * Games that count towards the series result. In a best-of series, games after
 * the clinching win are ignored. Play-all counts every game.
 */
export function getSeriesGames(
  games: ParsedGame[],
  gameCount: number,
  mode: MatchMode,
): ParsedGame[] {
  if (mode === "PLAY_ALL") return games;

  const counted: ParsedGame[] = [];
  let p1Wins = 0;
  let p2Wins = 0;

  for (const game of games) {
    counted.push(game);

    const winner = getGameWinner(game);
    if (winner === 1) p1Wins++;
    else if (winner === 2) p2Wins++;

    if (isSeriesDecided([p1Wins, p2Wins], gameCount, mode)) break;
  }

  return counted;
}

/** Returns [player1Wins, player2Wins] across all parsed games. */
export function computeScores(games: ParsedGame[]): [number, number] {
  let p1 = 0;
  let p2 = 0;

  for (const game of games) {
    if (game.recordings.length === 0) continue;

    const winner = getGameWinner(game);
    if (winner === 1) p1++;
    else if (winner === 2) p2++;
  }

  return [p1, p2];
}

interface ValidationMessages {
  profileMismatch: string;
  invalidRecordings: string;
}

interface ValidationOptions {
  /**
   * Skip the check against the match's profile ids. Used when the uploader has
   * manually mapped the recorded players to the match players.
   */
  allowProfileMismatch?: boolean;
}

/**
 * Work out whether a recording lists its players in the same order as the match or reversed.
 */
export function resolveRecordingAlignment(
  rec: ParsedRecording,
  p1ProfileId: number | null,
  p2ProfileId: number | null,
): PlayerAlignment {
  const recP1 = rec.player1Data.profileId;
  const recP2 = rec.player2Data.profileId;

  const hasP1 =
    p1ProfileId != null && (recP1 === p1ProfileId || recP2 === p1ProfileId);
  const hasP2 =
    p2ProfileId != null && (recP1 === p2ProfileId || recP2 === p2ProfileId);

  // We need at least one known id present in the recording. When both ids are
  // known, both must be present or the recording is for a different match-up.
  if (!hasP1 && !hasP2) return "unknown";

  if (p1ProfileId != null && p2ProfileId != null && (!hasP1 || !hasP2)) {
    return "unknown";
  }

  if (hasP1) return recP1 === p1ProfileId ? "same" : "swap";

  return recP2 === p2ProfileId ? "same" : "swap";
}

/** Whether two parsed player records refer to the same player. */
export function sameRecordedPlayer(
  a: RecordedPlayer,
  b: RecordedPlayer,
): boolean {
  if (a.profileId > 0 && b.profileId > 0) return a.profileId === b.profileId;

  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/**
 * Which way a recording must be swapped so `mappedPlayer1` is match player 1.
 * Returns `null` when the recording does not contain the mapped player.
 */
export function getSwapForMappedPlayer(
  recording: ParsedRecording,
  mappedPlayer1: RecordedPlayer,
): boolean | null {
  if (sameRecordedPlayer(mappedPlayer1, recording.player1Data)) return false;
  if (sameRecordedPlayer(mappedPlayer1, recording.player2Data)) return true;

  return null;
}

export interface DifferentPlayersInfo {
  gameNumber: number;
  player1: string;
  player2: string;
  otherPlayer1: string;
  otherPlayer2: string;
}

function sameGamePlayers(a: ParsedRecording, b: ParsedRecording): boolean {
  return (
    (sameRecordedPlayer(a.player1Data, b.player1Data) &&
      sameRecordedPlayer(a.player2Data, b.player2Data)) ||
    (sameRecordedPlayer(a.player1Data, b.player2Data) &&
      sameRecordedPlayer(a.player2Data, b.player1Data))
  );
}

/** Finds the first game whose players differ from the first game's players. */
export function findDifferentPlayers(
  games: ParsedGame[],
): DifferentPlayersInfo | null {
  const first = games[0]?.recordings.at(-1);
  if (!first) return null;

  for (let i = 1; i < games.length; i++) {
    const recording = games[i]?.recordings.at(-1);
    if (!recording) continue;

    if (!sameGamePlayers(first, recording)) {
      return {
        gameNumber: i + 1,
        player1: first.player1Data.name,
        player2: first.player2Data.name,
        otherPlayer1: recording.player1Data.name,
        otherPlayer2: recording.player2Data.name,
      };
    }
  }

  return null;
}

/**
 * Validates recording data across multiple files for a single game.
 */
export function validateGameRecFileData(
  recordings: ParsedRecording[],
  p1ProfileId: number | null,
  p2ProfileId: number | null,
  messages: ValidationMessages,
  options: ValidationOptions = {},
): string | null {
  if (
    !options.allowProfileMismatch &&
    p1ProfileId == null &&
    p2ProfileId == null
  ) {
    return messages.profileMismatch;
  }

  const checks: boolean[] = [];

  // Every recording must be matchable to this match-up: at least one known player id present.
  // A manual player mapping makes that unnecessary.
  const profileIdCheck =
    options.allowProfileMismatch === true ||
    recordings.every(
      (rec) =>
        resolveRecordingAlignment(rec, p1ProfileId, p2ProfileId) !== "unknown",
    );

  checks.push(profileIdCheck);

  // If there is only one recording, we don't need to do any further checks.
  if (recordings.length === 0) {
    return checks.every((v) => v) ? null : messages.profileMismatch;
  }

  const [firstRec, ...rest] = recordings;

  // Check if all recordings have different file name (all entries, including firstRec).
  const fileNames = recordings.map((e) => e.fileName);
  const fileNameCheck = new Set(fileNames).size === recordings.length;

  checks.push(fileNameCheck);

  // Same civ check
  checks.push(
    rest.every((e) => e.player1Data.civ === firstRec!.player1Data.civ),
  );
  checks.push(
    rest.every((e) => e.player2Data.civ === firstRec!.player2Data.civ),
  );

  // Check if all recordings have the same player
  checks.push(
    rest.every(
      (e) => e.player1Data.profileId === firstRec!.player1Data.profileId,
    ),
  );
  checks.push(
    rest.every(
      (e) => e.player2Data.profileId === firstRec!.player2Data.profileId,
    ),
  );

  // Check if all recordings have the same map
  checks.push(rest.every((e) => e.map === firstRec!.map));

  // First recording should have worldTime=0, and all others should have worldTime >= previous recording's worldTime
  checks.push(firstRec?.worldTime === 0);
  checks.push(
    recordings.every(
      (v, i) => i === 0 || v.worldTime >= recordings[i - 1]!.worldTime,
    ),
  );

  // If all checks pass, return null (no error).
  if (checks.every((v) => v)) return null;

  return messages.invalidRecordings;
}

/** Extract the extension from a file name, falling back to `aoe2record`. */
function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(dot + 1) : "aoe2record";
}

/**
 * Build a proper file name for a recording.
 */
export function buildRecordingFileName(
  file: File,
  recording: ParsedRecording | undefined,
  gameNumber: number,
  usedNames: Set<string>,
  swap = false,
): string {
  const extension = getFileExtension(file.name);
  // The map is intentionally omitted so downloads are named consistently as
  // "<player1>_<player2>_game_<n>"
  const label = recording
    ? swap
      ? `${recording.player2Data.name}_${recording.player1Data.name}`
      : `${recording.player1Data.name}_${recording.player2Data.name}`
    : file.name.replace(/\.[^.]+$/, "");

  const base = sanitizeFileName(`${label}_game_${gameNumber}`);
  const name = sanitizeFileName(`${base}.${extension}`);

  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  let counter = 2;

  const suffixed = (n: number) => sanitizeFileName(`${base}_${n}.${extension}`);

  while (usedNames.has(suffixed(counter))) {
    counter++;
  }
  const uniqueName = suffixed(counter);

  usedNames.add(uniqueName);

  return uniqueName;
}

/** A game ready to be persisted for a match. */
export interface RecordingGamePayload {
  gameNumber: number;
  mapName: string;
  recordingKeys: string[];
  participants: {
    matchParticipantId: string;
    civName?: string;
    isWinner: boolean;
  }[];
}

interface BuildGamePayloadArgs {
  game: ParsedGame;
  gameNumber: number;
  recordingKeys: string[];
  player1: { matchParticipantId: string; profileId: number | null };
  player2: { matchParticipantId: string; profileId: number | null };
}

/**
 * Build payload for the database.
 */
export function buildGamePayload({
  game,
  gameNumber,
  recordingKeys,
  player1,
  player2,
}: BuildGamePayloadArgs): RecordingGamePayload {
  const first = game.recordings[0];
  const last = game.recordings.at(-1);
  const winner = getGameWinner(game);
  const swap = getGameSwap(game);

  const player1Civ = swap ? last?.player2Data.civ : last?.player1Data.civ;
  const player2Civ = swap ? last?.player1Data.civ : last?.player2Data.civ;

  return {
    gameNumber,
    mapName: first?.map ?? "",
    recordingKeys,
    participants: [
      {
        matchParticipantId: player1.matchParticipantId,
        civName: player1Civ,
        isWinner: winner === 1,
      },
      {
        matchParticipantId: player2.matchParticipantId,
        civName: player2Civ,
        isWinner: winner === 2,
      },
    ],
  };
}
