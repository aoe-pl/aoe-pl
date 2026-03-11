"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";
import { isBrightColor } from "@/lib/utils";
import { useTranslations } from "next-intl";

type TournamentParticipants = Awaited<
  ReturnType<typeof tournamentParticipantRepository.getTournamentParticipants>
>;

interface TournamentPlayerListProps {
  tournamentParticipants: TournamentParticipants;
}

export function TournamentPlayerList({
  tournamentParticipants,
}: TournamentPlayerListProps) {
  const t = useTranslations("tournament.players");

  if (!tournamentParticipants.length) {
    return <span>{t("no_players")}</span>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">{t("nickname")}</TableHead>
          <TableHead>{t("in_groups")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tournamentParticipants.map((player) => (
          <TableRow key={player.id}>
            <TableCell className="font-medium">{player.nickname}</TableCell>
            <TableCell className="flex gap-1">
              {player.TournamentGroupParticipant.map((gp) => (
                <Badge
                  key={gp.id}
                  className="text-sm"
                  style={{
                    backgroundColor: gp.tournamentGroup.color!,
                    color: isBrightColor(gp.tournamentGroup.color!)
                      ? "#000"
                      : "#fff",
                  }}
                >
                  {gp.tournamentGroup.name}
                </Badge>
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
