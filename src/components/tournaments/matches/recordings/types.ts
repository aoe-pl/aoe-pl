import type { ParsedRecording } from "@/lib/recording-parser/types";

/**
 * How the games of a match are decided.
 */
export type MatchMode = "BEST_OF" | "PLAY_ALL";

/** How a recording's player order relates to the match's player order. */
export type PlayerAlignment = "same" | "swap" | "unknown";

/** A recording file paired with the data parsed from it. */
export interface ParsedRecordingFile {
  file: File;
  recording: ParsedRecording;
}

/** Minimal player identity used for cross-game checks and manual mapping. */
export interface RecordedPlayer {
  profileId: number;
  name: string;
}

/**
 * A single game. Normally this holds one recording, but a game that was
 * restored has one recording per segment.
 */
export interface ParsedGame {
  /** Stable identifier for the group, used as a React key and override key. */
  key: string;
  files: File[];
  recordings: ParsedRecording[];
  validationError: string | null;
  /** Alignment detected from the players' aoe2companion profile ids. */
  autoAlignment: PlayerAlignment;
  winnerOverride: 1 | 2 | null; // for admins
  playerSwapOverride: boolean | null; // manual mapping
}
