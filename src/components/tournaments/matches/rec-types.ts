// Types for the mgz library output
// Excludes gaia, objects, file, actions, inputs, and various match settings.

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
  rate_snapshot: number /** ELO rating at time of match */;
}

export interface MgzMap {
  id: number;
  name: string;
}

export interface MgzUptime {
  timestamp: string /** "0:09:05.675000" */;
  age: "FEUDAL_AGE" | "CASTLE_AGE" | "IMPERIAL_AGE";
  player: number; // player id
}

/** Parsed output from the mgz library. Excludes gaia, objects, file, actions, inputs, and various match settings. */
export interface MgzMatch {
  players: MgzPlayer[];
  teams: number[][];
  map: MgzMap;
  uptimes: MgzUptime[];
  duration: string;
  timestamp: string;
  guid: string; // game unique id
  completed: boolean;
  restored: boolean;
  restored_at: string;
  rated: boolean; // whether it's a ranked match
  type: string /** e.g. "Random Map" */;
  starting_age: "Dark" | "Feudal" | "Castle" | "Imperial";
  version: "DE";
  game_version: string;
  hidden_civs: boolean;
  lobby: string; // lobby name
}

export interface UploadRecsPayload {
  gamesUrls: string[];
  restoredDataUrls: (string | null)[];
  matchId: string;
  uploader: string;
}
