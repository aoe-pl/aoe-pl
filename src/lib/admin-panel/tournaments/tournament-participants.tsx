import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import Link from "next/link";
import type {
  TournamentParticipant,
  TournamentGroupParticipant,
  TournamentGroup,
  TournamentStage,
} from "@prisma/client";

type TournamentParticipantsProps = {
  tournamentId: string;
};

type ParticipantWithGroups = TournamentParticipant & {
  TournamentGroupParticipant: (TournamentGroupParticipant & {
    tournamentGroup: TournamentGroup & {
      stage: TournamentStage;
    };
  })[];
};

export async function TournamentParticipants({
  tournamentId,
}: TournamentParticipantsProps) {
  const participants = (await api.tournaments.participants.list({
    tournamentId,
    includeUser: true,
  })) as ParticipantWithGroups[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="max-w-[200px]">Groups</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>{participant.nickname}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{participant.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[100px]">
                    <div className="flex flex-wrap gap-1 overflow-y-auto">
                      {participant.TournamentGroupParticipant.length > 0 ? (
                        participant.TournamentGroupParticipant.map(
                          (groupParticipant) => (
                            <Link
                              key={groupParticipant.id}
                              href={`/admin/tournaments/groups/${groupParticipant.tournamentGroup.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                {groupParticipant.tournamentGroup.name}
                              </Button>
                            </Link>
                          ),
                        )
                      ) : (
                        <Badge variant="secondary">No groups assigned</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(
                      participant.registrationDate,
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
