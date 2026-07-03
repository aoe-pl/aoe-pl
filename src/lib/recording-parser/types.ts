/** Data parsed from a single .aoe2record file. */
export interface ParsedRecording {
  fileName: string;
  player1: string;
  player2: string;
  profileId1: number;
  profileId2: number;
  civ1: string;
  civ2: string;
  civId1: number;
  civId2: number;
  map: string;
  mapId: number;
  length: string;
  date: string;
  winner: 1 | 2 | null;
  guid: string;
  restored: boolean;
}

export interface UploadRecsPayload {
  gamesUrls: string[];
  restoredDataUrls: (string | null)[];
  matchId: string;
  uploader: string;
}
