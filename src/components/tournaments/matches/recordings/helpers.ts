import type { ParsedRecording } from "@/lib/recording-parser/types";
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

/**
 * Validates recording data across multiple files for a single game.
 */
// prettier-ignore
export function validateGameRecFileData(
  recordings: ParsedRecording[],
  p1ProfileId: number ,
  p2ProfileId: number,
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
  
  checks.push(profileIdCheck);

  // If there is only one recording, we don't need to do any further checks.
  if (recordings.length === 0) {
    return checks.every((v) => v) ? null : `Profile ID mismatch.`;
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

  return `Recording files are invalid. Please ensure that all recordings are from the same game, with the same players, civs, and map.`;
}
