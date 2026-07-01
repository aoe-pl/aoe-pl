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

// ─── mgz library types ────────────────────────────────────────────────────────

export interface MgzPlayer {
  number: number;
  name: string;
  color: string;
  color_id: number;
  civilization: string;
  civilization_id: number;
  profile_id: number;
  prefer_random: boolean;
  team: number[];
  team_id: number[];
  winner: boolean;
  eapm: number;
  rate_snapshot: number;
}

export interface MgzMap {
  id: number;
  name: string;
}

export interface MgzUptime {
  timestamp: string /** "0:09:05.675000" */;
  age: "FEUDAL_AGE" | "CASTLE_AGE" | "IMPERIAL_AGE";
  player: number;
}

export interface MgzMatch {
  players: MgzPlayer[];
  teams: number[][];
  map: MgzMap;
  uptimes: MgzUptime[];
  duration: string;
  timestamp: string;
  guid: string;
  completed: boolean;
  restored: boolean;
  restored_at: string;
  rated: boolean;
  type: string;
  starting_age: "Dark" | "Feudal" | "Castle" | "Imperial";
  version: "DE";
  game_version: string;
  hidden_civs: boolean;
  lobby: string;
}

export interface UploadRecsPayload {
  gamesUrls: string[];
  restoredDataUrls: (string | null)[];
  matchId: string;
  uploader: string;
}
