import type { ParsedRecording } from "@/lib/recording-parser/types";

export interface GameStep {
  files: File[];
  recordings: ParsedRecording[];
  skipped: boolean;
  validationError: string | null;
}
