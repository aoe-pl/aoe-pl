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

export function GroupLeaderboardTable({ group, matches }: Props) {
  const playerMap = new Map<string, PlayerStats>();

  group.TournamentGroupParticipant.forEach((p) => {
    playerMap.set(p.tournamentParticipantId, {
      playerId: p.tournamentParticipantId,
      playerName: "", // initially empty as group doesn't have this data.
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      totalScore: 0,
    });
  });

  for (const match of matches) {
    for (const participant of match.TournamentMatchParticipant) {
      const player = playerMap.get(participant.participantId!);

      if (!player) continue;

      if (participant.participant?.nickname) {
        player.playerName = participant.participant.nickname;
      }

      // Only update stats for approved matches
      if (match.status !== "ADMIN_APPROVED") continue;

      player.matchesPlayed++;
      if (participant.isWinner) {
        player.matchesWon++;
      } else {
        player.matchesLost++;
      }
      player.totalScore += participant.wonScore;
    }
  }

  const players = Array.from(playerMap.values()).sort(
    (a, b) => b.totalScore - a.totalScore,
  );

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
