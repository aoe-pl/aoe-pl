"use client";

import { GroupLabel } from "@/components/tournaments/group-label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTournamentStatusLabel } from "@/lib/helpers/tournament-status";
import { slugify } from "@/lib/utils";
import type { TournamentStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import Link from "next/link";

type TournamentParticipant = {
  id: string;
  rank: number | null;
  tournament: {
    name: string;
    urlKey: string;
    status: TournamentStatus;
    tournamentSeries: {
      name: string;
    };
  };
  TournamentGroupParticipant: {
    tournamentGroup: {
      id: string;
      name: string;
      color: string | null;
      isRotational: boolean;
    };
  }[];
};

interface ProfileTournamentHistorySectionProps {
  participants: TournamentParticipant[];
}

export function ProfileTournamentHistorySection({
  participants,
}: ProfileTournamentHistorySectionProps) {
  const t = useTranslations("profile.tournaments");
  const tGlobal = useTranslations();

  const hasGroups = participants.some(
    (p) => p.TournamentGroupParticipant.length > 0,
  );
  const hasFinished = participants.some(
    (p) => p.tournament.status === "FINISHED",
  );

  return (
    <div>
      <div className="panel-header flex items-center gap-2">{t("title")}</div>
      <div>
        {participants.length > 0 ? (
          <div className="rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tournament")}</TableHead>
                  {hasGroups && <TableHead>{t("group")}</TableHead>}
                  {hasFinished && <TableHead>{t("rank")}</TableHead>}
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => {
                  const seriesSlug = slugify(
                    p.tournament.tournamentSeries.name,
                  );
                  const href = `/tournaments/${seriesSlug}/${p.tournament.urlKey}`;
                  // Rotation groups link several groups; only the "real"
                  // (non-rotational) group belongs in the history table.
                  const group =
                    p.TournamentGroupParticipant.find(
                      (gp) => !gp.tournamentGroup.isRotational,
                    )?.tournamentGroup ??
                    p.TournamentGroupParticipant[0]?.tournamentGroup;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={href}
                          className="text-accent font-medium hover:underline"
                        >
                          {p.tournament.name}
                        </Link>
                      </TableCell>
                      {hasGroups && (
                        <TableCell className="text-sm">
                          {group ? (
                            <GroupLabel
                              name={group.name}
                              color={group.color}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}
                      {hasFinished && (
                        <TableCell className="text-sm font-semibold tabular-nums">
                          {p.rank != null ? `#${p.rank}` : "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={
                            p.tournament.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {formatTournamentStatusLabel(
                            p.tournament.status,
                            tGlobal,
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("none")}</p>
        )}
      </div>
    </div>
  );
}
