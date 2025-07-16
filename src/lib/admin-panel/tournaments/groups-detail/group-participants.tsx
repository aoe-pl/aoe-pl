import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TournamentParticipant } from "../tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/server";

export async function GroupParticipantsTable({
  participants,
  groupId,
}: {
  participants: { tournamentParticipant: TournamentParticipant }[];
  groupId: string;
}) {
  // Fetch participant scores
  const scores = await api.tournaments.groups.getParticipantScores({
    groupId,
  });

  const sortedParticipants = participants.sort((a, b) => {
    const aScore = scores[a.tournamentParticipant.id];
    const bScore = scores[b.tournamentParticipant.id];
    return (bScore?.won ?? 0) - (aScore?.won ?? 0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedParticipants.map((participant) => {
                const participantScore =
                  scores[participant.tournamentParticipant.id];
                const scoreText = participantScore
                  ? `${participantScore.won}-${participantScore.lost}`
                  : "0-0";

                return (
                  <TableRow key={participant.tournamentParticipant.id}>
                    <TableCell>
                      {participant.tournamentParticipant.nickname}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {participant.tournamentParticipant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{scoreText}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(
                        participant.tournamentParticipant.registrationDate,
                      ).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
