"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slugify } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

type TournamentParticipant = {
  id: string;
  nickname: string | null;
  registrationDate: Date;
  tournament: {
    name: string;
    urlKey: string;
    status: string;
    tournamentSeries: {
      name: string;
    };
  };
};

interface ProfileTournamentHistorySectionProps {
  participants: TournamentParticipant[];
}

export function ProfileTournamentHistorySection({
  participants,
}: ProfileTournamentHistorySectionProps) {
  const t = useTranslations("profile.tournaments");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length > 0 ? (
          <div className="rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tournament")}</TableHead>
                  <TableHead>{t("nickname")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("registered")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => {
                  const seriesSlug = slugify(
                    p.tournament.tournamentSeries.name,
                  );
                  const href = `/tournaments/${seriesSlug}/${p.tournament.urlKey}`;
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
                      <TableCell className="text-sm">{p.nickname}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.tournament.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.tournament.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(p.registrationDate).toLocaleDateString()}
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
      </CardContent>
    </Card>
  );
}
