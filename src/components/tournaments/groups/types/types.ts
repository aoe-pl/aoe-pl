import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";

export type TournamentGroup = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>[number];

export type TournamentGroups = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>;

export type TournamentMatchData = inferProcedureOutput<
  AppRouter["tournaments"]["matches"]["list"]
>;

export interface GroupMatches {
  groupId: string;
  matches: TournamentMatchData;
}

export interface LeaderboardPlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalScore: number;
}
