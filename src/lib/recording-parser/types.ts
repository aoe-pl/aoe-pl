/** Data parsed from a single .aoe2record file. */
export interface ParsedRecording {
  player1Data: {
    profileId: number;
    name: string;
    civId: number;
    civ: string;
  };

  player2Data: {
    profileId: number;
    name: string;
    civId: number;
    civ: string;
  };

  fileName: string;
  map: string;
  mapId: number;
  length: string;
  date: string;
  winner: 1 | 2 | null; // null if no winner or both teams marked as winners
  worldTime: number;
}

export interface UploadRecsPayload {
  gamesUrls: string[];
  restoredDataUrls: (string | null)[];
  matchId: string;
  uploader: string;
}
