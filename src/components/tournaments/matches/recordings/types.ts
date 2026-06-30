/** Data parsed from a single .aoe2record file. */
export interface ParsedRecording {
  fileName: string;
  player1: string;
  player2: string;
  map: string;
  length: string;
  date: string;
}

export interface GameStep {
  files: File[];
  recordings: ParsedRecording[];
}

export function buildInitialSteps(gameCount: number): GameStep[] {
  return Array.from({ length: gameCount }, () => ({
    files: [],
    recordings: [],
  }));
}
