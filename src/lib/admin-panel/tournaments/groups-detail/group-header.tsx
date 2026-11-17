"use client";

import { PlayerLink } from "@/components/player-link";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatMatchModeName } from "@/lib/helpers/match-mode";
import { Calendar, Gamepad, Trophy, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TournamentMatchModeType } from "../tournament";

export type GroupHeaderProps = {
  name: string;
  isTeamBased: boolean;
  participants: {
    id: string;
    nickname: string;
    playerNumber: number | undefined;
  }[];
  matchesCount: number;
  matchMode: { mode: TournamentMatchModeType; gameCount: number };
  onEdit: () => void;
  isMixed: boolean;
  tournamentName: string;
};

export function GroupHeader({
  isTeamBased,
  participants,
  matchesCount,
  matchMode,
  onEdit,
  isMixed,
  tournamentName,
}: GroupHeaderProps) {
  const t = useTranslations("admin.tournaments.groups.detail");
  const tGlobal = useTranslations();
  const matchModeLabel = formatMatchModeName(
    matchMode.mode,
    matchMode.gameCount,
    (key, params) => tGlobal(key, params),
  );

  const details = [
    { icon: Users, label: t("participants"), value: participants.length },
    { icon: Calendar, label: t("matches"), value: matchesCount },
    { icon: Gamepad, label: t("format"), value: matchModeLabel },
    { icon: Trophy, label: t("tournament"), value: tournamentName },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {isTeamBased ? t("team_based") : t("one_on_one")}
              </Badge>
              {isMixed && <Badge variant="default">{t("mixed")}</Badge>}
            </div>
          </div>
          <Button onClick={onEdit}>{t("edit")}</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <dl className="flex flex-col">
            {details.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b py-2 first:pt-0 last:border-b-0 last:pb-0"
              >
                <dt className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {label}
                </dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3">
            {participants.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("no_participants")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {participants.map((participant) => (
                  <li key={participant.id}>
                    <PlayerLink
                      playerNumber={participant.playerNumber}
                      name={participant.nickname}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
