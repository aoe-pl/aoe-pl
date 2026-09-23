import type { ParsedRecording } from "@/lib/recording-parser/types";
import { sanitizeFileName } from "@/lib/storage/paths";
import type { GameStep, MatchMode } from "./types";

export function buildInitialSteps(gameCount: number): GameStep[] {
  return Array.from({ length: gameCount }, () => ({
    files: [],
    recordings: [],
    skipped: false,
    validationError: null,
    winnerOverride: null,
    autoPlayerSwap: false,
    playerSwapOverride: null,
  }));
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

/**
 * Whether the recording's parsed player 1 is the match's player 2. An admin
 * override wins over the value detected from the aoe2companion profile ids.
 */
export function getStepSwap(step: GameStep): boolean {
  return step.playerSwapOverride ?? step.autoPlayerSwap;
}

/**
 * Returns the effective winner for a step in match terms (1 = match player 1).
 * The manual override takes priority, then the last recording's winner, which
 * is flipped when the recording's player order is swapped.
 */
export function getStepWinner(step: GameStep): 1 | 2 | null {
  if (step.recordings.length === 0) return null;

  if (step.winnerOverride !== null) return step.winnerOverride;

  const winner = step.recordings.at(-1)!.winner;
  if (winner === null) return null;

  return getStepSwap(step) ? (winner === 1 ? 2 : 1) : winner;
}

/** Returns [player1Wins, player2Wins] across all non-skipped steps with a result. */
export function computeScores(steps: GameStep[]): [number, number] {
  let p1 = 0;
  let p2 = 0;

  for (const step of steps) {
    if (step.skipped || step.recordings.length === 0) continue;

    const winner = getStepWinner(step);
    if (winner === 1) p1++;
    else if (winner === 2) p2++;
  }

  return [p1, p2];
}

interface ValidationMessages {
  profileMismatch: string;
  invalidRecordings: string;
}

/** How a recording's player order relates to the match's player order. */
type RecordingAlignment = "same" | "swap" | "unknown";

/**
 * Work out whether a recording lists its players in the same order as the match or reversed.
 */
export function resolveRecordingAlignment(
  rec: ParsedRecording,
  p1ProfileId: number | null,
  p2ProfileId: number | null,
): RecordingAlignment {
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

/**
 * Validates recording data across multiple files for a single game.
 */
export function validateGameRecFileData(
  recordings: ParsedRecording[],
  p1ProfileId: number | null,
  p2ProfileId: number | null,
  messages: ValidationMessages,
): string | null {
  if (p1ProfileId == null && p2ProfileId == null) {
    return messages.profileMismatch;
  }

  const checks: boolean[] = [];

  // Every recording must be matchable to this match-up: at least one known player id present.
  const profileIdCheck = recordings.every(
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
  step: GameStep;
  gameNumber: number;
  recordingKeys: string[];
  player1: { matchParticipantId: string; profileId: number | null };
  player2: { matchParticipantId: string; profileId: number | null };
}

/**
 * Build payload for the database.
 */
export function buildGamePayload({
  step,
  gameNumber,
  recordingKeys,
  player1,
  player2,
}: BuildGamePayloadArgs): RecordingGamePayload {
  const first = step.recordings[0];
  const last = step.recordings.at(-1);
  const winner = getStepWinner(step);
  const swap = getStepSwap(step);

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
