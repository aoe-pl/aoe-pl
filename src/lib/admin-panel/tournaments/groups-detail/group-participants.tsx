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

export function GroupParticipantsTable({
  participants,
}: {
  participants: { tournamentParticipant: TournamentParticipant }[];
}) {
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
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
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
                    {new Date(
                      participant.tournamentParticipant.registrationDate,
                    ).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
