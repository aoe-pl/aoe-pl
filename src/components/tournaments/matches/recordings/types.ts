/** Data parsed from a single .aoe2record file. */
export interface ParsedRecording {
  fileName: string;
  player1: string;
  player2: string;
  civ1: string;
  civ2: string;
  map: string;
  length: string;
  date: string;
  winner: 1 | 2 | null;
  guid: string;
  restored: boolean;
}

export interface GameStep {
  files: File[];
  recordings: ParsedRecording[];
  skipped: boolean;
  validationError: string | null;
}

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
 * same game GUID, second file must be flagged as restored, no duplicate filenames.
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

    if (rec.guid !== first.guid) {
      return `"${rec.fileName}" belongs to a different game. Only upload files from the same game.`;
    }

    if (!rec.restored) {
      return `"${rec.fileName}" is not flagged as a restored game recording.`;
    }
  }

  return null;
}

/** Strips sub-second precision from a duration string like "0:09:05.675000" → "0:09:05". */
export function trimSubSeconds(duration: string): string {
  return duration.split(".")[0] ?? duration;
}
