import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";

type TournamentMatchData = inferProcedureOutput<
  AppRouter["tournaments"]["matches"]["list"]
>;

export interface GroupPageData {
  groupId: string;
  groupColor: string;
  groupName: string;
  matches: TournamentMatchData;
  players: {
    id: string;
    name: string;
  }[];
}
