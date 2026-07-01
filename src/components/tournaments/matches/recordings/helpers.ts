import type { ParsedRecording } from "@/lib/recording-parser/types";
import type { GameStep } from "./types";

export function buildInitialSteps(gameCount: number): GameStep[] {
  return Array.from({ length: gameCount }, () => ({
    files: [],
    recordings: [],
    skipped: false,
    validationError: null,
  }));
}

export function winsNeeded(gameCount: number): number {
  return Math.ceil(gameCount / 2);
}

/** Returns [player1Wins, player2Wins] across all non-skipped steps with a result. */
export function computeScores(steps: GameStep[]): [number, number] {
  let p1 = 0;
  let p2 = 0;

  for (const step of steps) {
    if (step.skipped || step.recordings.length === 0) continue;

    const winner = step.recordings[0]!.winner;
    if (winner === 1) p1++;
    else if (winner === 2) p2++;
  }

  return [p1, p2];
}

/**
 * Validates that a step with multiple files is a legitimate restored-game scenario:
 * - No duplicate filenames
 * - Same game GUID (when both files have one)
 * - Second file flagged as restored
 * - Same map and civilisations across all files
 */
export function validateRestoredGame(
  recordings: ParsedRecording[],
): string | null {
  if (recordings.length <= 1) return null;

  const first = recordings[0]!;

  for (let i = 1; i < recordings.length; i++) {
    const rec = recordings[i]!;

    if (rec.fileName === first.fileName) {
      return "Duplicate file detected. Please clear and re-upload the correct files.";
    }

    // Fallback parser data does not include guid
    const bothHaveGuid = first.guid !== "" && rec.guid !== "";

    if (bothHaveGuid && rec.guid !== first.guid) {
      return `"${rec.fileName}" belongs to a different game. Only upload files from the same game.`;
    }

    if (!rec.restored) {
      return `"${rec.fileName}" is not flagged as a restored game recording.`;
    }

    if (rec.mapId !== first.mapId) {
      return `"${rec.fileName}" was played on a different map (${rec.map} vs ${first.map}).`;
    }

    const sameCivs =
      (rec.civId1 === first.civId1 && rec.civId2 === first.civId2) ||
      (rec.civId1 === first.civId2 && rec.civId2 === first.civId1);

    if (!sameCivs) {
      return `"${rec.fileName}" has different civilisations from the first file.`;
    }
  }

  return null;
}
