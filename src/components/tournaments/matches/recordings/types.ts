import type { ParsedRecording } from "@/lib/recording-parser/types";

/**
 * How the games of a match are decided.
 */
export type MatchMode = "BEST_OF" | "PLAY_ALL";

export interface GameStep {
  files: File[];
  recordings: ParsedRecording[];
  skipped: boolean;
  validationError: string | null;
  autoPlayerSwap: boolean;
  winnerOverride: 1 | 2 | null; // for admins
  playerSwapOverride: boolean | null; // for admins
}
