import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";

type Group = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>[number];

interface Props {
  data: Group;
}

export function GroupLeaderboardTable({ data }: Props) {
  // TODO: Get player match data, calculate wins/losses/score for all matches
  // also group data has group names and player IDs, but no player names..

  return (
    <Card className="w-full text-center">
      <CardHeader>
        <CardTitle>{data.name} Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Games Played</TableHead>
              <TableHead>Games Won</TableHead>
              <TableHead>Games Lost</TableHead>
              <TableHead>Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.TournamentGroupParticipant.map((p) => {
              return (
                <TableRow key={p.id}>
                  <TableCell>1</TableCell>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>3</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
