import type { ParsedRecording } from "@/lib/recording-parser/types";
import { sanitizeFileName } from "@/lib/storage/paths";
import type { GameStep } from "./types";

export function buildInitialSteps(gameCount: number): GameStep[] {
  return Array.from({ length: gameCount }, () => ({
    files: [],
    recordings: [],
    skipped: false,
    validationError: null,
    winnerOverride: null,
  }));
}

export function winsNeeded(gameCount: number): number {
  return Math.ceil(gameCount / 2);
}

/** Returns the effective winner for a step: override takes priority, then last recording. */
export function getStepWinner(step: GameStep): 1 | 2 | null {
  if (step.recordings.length === 0) return null;

  const winner = step.recordings.at(-1)!.winner;

  return step.winnerOverride ?? winner;
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

/**
 * Validates recording data across multiple files for a single game.
 */
// prettier-ignore
export function validateGameRecFileData(
  recordings: ParsedRecording[],
  p1ProfileId: number ,
  p2ProfileId: number,
  messages: ValidationMessages,
): string | null {
  // TODO: add playerID validation - will need to get playerID from aoe2companion link.
  const checks: boolean[] = [];


    // Check if playerId match profileIds in parsedResults.
    // If they are matching, make sure player 1 profile id matches player 1 in the recording, and player 2 id matches player 2 in the recording.
  let profileIdCheck = true;

  recordings.forEach((rec) => {
    const recProfileIds = [
        rec.player1Data.profileId,
        rec.player2Data.profileId,
      ];
    const hasP1 = recProfileIds.includes(p1ProfileId);
    const hasP2 = recProfileIds.includes(p2ProfileId);
    
    if (!hasP1 || !hasP2) {
        profileIdCheck = false;
       
        return;
      }
      
    // At this point, we know that both player IDs are present in the recording. We can now check which one is player 1 and which one is player 2.
    // If p1ProfileId is the first profileId, then player 1 is correct. If not, we need to swap them.
    if (recProfileIds[1] === p1ProfileId) {
      const temp = rec.player1Data;
      rec.player1Data = rec.player2Data;
      rec.player2Data = temp;
    }
  });
  
  // TODO: uncomment if we decide to check profile IDs
  // checks.push(profileIdCheck);

  // If there is only one recording, we don't need to do any further checks.
  if (recordings.length === 0) {
    return checks.every((v) => v) ? null : messages.profileMismatch;
  }

  const [firstRec, ...rest] = recordings;

  // Check if all recordings have different file name (all entries, including firstRec).
  const fileNames = recordings.map((e) => e.fileName);
  const fileNameCheck = new Set(fileNames).size === recordings.length

  checks.push(fileNameCheck);

  // Same civ check
  checks.push(rest.every((e) => e.player1Data.civ === firstRec!.player1Data.civ));
  checks.push(rest.every((e) => e.player2Data.civ === firstRec!.player2Data.civ));

  // Check if all recordings have the same player
  checks.push(rest.every((e) => e.player1Data.profileId === firstRec!.player1Data.profileId));
  checks.push(rest.every((e) => e.player2Data.profileId === firstRec!.player2Data.profileId));

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
): string {
  const extension = getFileExtension(file.name);
  const label = recording
    ? `${recording.player1Data.name}_${recording.player2Data.name}_${recording.map}`
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
 * Turn a single (validated) game step into the payload stored in the database.
 * Civs are matched to match participants by aoe2companion profile id, falling
 * back to the parser's player ordering when the ids are unknown.
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

  const player1IsSecond =
    player1.profileId != null &&
    last?.player2Data.profileId === player1.profileId;

  const player1Civ = player1IsSecond
    ? last?.player2Data.civ
    : last?.player1Data.civ;
  const player2Civ = player1IsSecond
    ? last?.player1Data.civ
    : last?.player2Data.civ;

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
