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
export function validateGameRecFileData(
  recordings: ParsedRecording[],
): string | null {
  // TODO: add playerID validation - will need to get playerID from aoe2companion link.
  if (recordings.length <= 1) return null;

  const [firstRec, ...rest] = recordings;

  // Check if all recordings have different file name (all entries, including firstRec).
  const fileNames = recordings.map((e) => e.fileName);
  const checks = [new Set(fileNames).size === recordings.length];

  // Same civ check
  checks.push(rest.every((e) => e.civ1 === firstRec!.civ1));
  checks.push(rest.every((e) => e.civ2 === firstRec!.civ2));

  // Check if all recordings have the same player
  checks.push(rest.every((e) => e.player1 === firstRec!.player1));
  checks.push(rest.every((e) => e.player2 === firstRec!.player2));

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

  return "Recording file data does not match or there were duplicate files detected.";
}
