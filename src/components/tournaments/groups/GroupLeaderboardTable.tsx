import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import type { GroupPageData } from "./types/types";

interface LeaderboardPlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalScore: number;
}

export function GroupLeaderboardTable({
  groupData,
}: {
  groupData: GroupPageData;
}) {
  const t = useTranslations("tournament.groups");

  const playerMap = new Map<string, LeaderboardPlayerStats>();

  for (const player of groupData.players) {
    playerMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      totalScore: 0,
    });
  }

  for (const match of groupData.matches) {
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
        <CardTitle>{groupData.groupName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="[&>th]:text-center">
              <TableHead>{t("rank")}</TableHead>
              <TableHead>{t("player")}</TableHead>
              <TableHead>{t("played")}</TableHead>
              <TableHead>{t("won")}</TableHead>
              <TableHead>{t("lost")}</TableHead>
              <TableHead>{t("total_score")}</TableHead>
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
