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

type MatchData = inferProcedureOutput<
  AppRouter["tournaments"]["matches"]["list"]
>;

interface Props {
  group: Group;
  matches: MatchData;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalScore: number;
}

const playerStatMap = new Map<string, PlayerStats>();

export function GroupLeaderboardTable({ group, matches }: Props) {
  playerStatMap.clear();

  const players: PlayerStats[] = [];

  group.TournamentGroupParticipant.forEach((p) => {
    players.push({
      playerId: p.tournamentParticipantId,
      playerName: "",
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      totalScore: 0,
    });
  });

  // TODO: This can be optimized if the API returns player names in the group participants, so we don't have to loop through all matches to get them.
  matches.forEach((m) => {
    m.TournamentMatchParticipant.forEach((p) => {
      const playerObj = players.find((pl) => pl.playerId === p.participantId)!;

      playerObj.playerName = p.participant?.nickname ?? "";

      // We don't add any non approved scores.
      if (m.status !== "ADMIN_APPROVED") return;

      if (p.isWinner) {
        playerObj.matchesWon++;
      } else {
        playerObj.matchesLost++;
      }

      playerObj.matchesPlayed++;
      playerObj.totalScore += p.wonScore;
    });
  });

  // Sort players by total score
  players.sort((a, b) => b.totalScore - a.totalScore);

  return (
    <Card className="w-full text-center">
      <CardHeader>
        <CardTitle>{group.name} Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Played</TableHead>
              <TableHead>Won</TableHead>
              <TableHead>Lost</TableHead>
              <TableHead>Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, index) => {
              return (
                <TableRow key={p.playerId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{p.playerName}</TableCell>
                  <TableCell>{p.matchesPlayed} </TableCell>
                  <TableCell>{p.matchesWon}</TableCell>
                  <TableCell>{p.matchesLost}</TableCell>
                  <TableCell>{p.totalScore}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
