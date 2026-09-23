import type { AppRouter } from "@/server/api/root";
import type { TournamentMatchModeType } from "@prisma/client";
import type { inferProcedureOutput } from "@trpc/server";

type TournamentMatchData = inferProcedureOutput<
  AppRouter["tournaments"]["matches"]["list"]
>;

export interface GroupPageData {
  groupId: string;
  groupColor: string;
  groupName: string;
  matchMode: {
    mode: TournamentMatchModeType;
    gameCount: number;
  } | null;
  matches: TournamentMatchData;
  players: {
    id: string;
    name: string;
    playerNumber: number;
  }[];
}
