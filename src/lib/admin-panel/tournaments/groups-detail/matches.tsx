"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchManagement } from "./match-management";
import type { ExtendedTournamentMatch } from "./match";
import type { MatchStatus } from "@prisma/client";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

interface Participant {
  id: string;
  name: string;
}

export function MatchesContainer({
  matches,
  groupId,
  matchMode,
  isTeamBased = false,
  isMixed = false,
}: {
  matches: ExtendedTournamentMatch[];
  groupId: string;
  matchMode: { id: string; mode: string; gameCount: number };
  isTeamBased?: boolean;
  isMixed?: boolean;
}) {
  const t = useTranslations();
  const [selectedParticipant, setSelectedParticipant] = useState<string>("all");

  // Extract all unique participants from matches
  const allParticipants = useMemo(() => {
    const participantMap = new Map<string, Participant>();

    matches.forEach((match) => {
      match.TournamentMatchParticipant.forEach((matchParticipant) => {
        if (isTeamBased && matchParticipant.team) {
          // For team-based tournaments, use team name
          participantMap.set(matchParticipant.team.id, {
            id: matchParticipant.team.id,
            name: matchParticipant.team.name,
          });
        } else if (matchParticipant.participant) {
          // For individual tournaments, use participant nickname
          participantMap.set(matchParticipant.participant.id, {
            id: matchParticipant.participant.id,
            name: matchParticipant.participant.nickname,
          });
        }
      });
    });

    return Array.from(participantMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [matches, isTeamBased]);

  // Filter matches based on selected participant
  const filteredMatches = useMemo(() => {
    if (selectedParticipant === "all") {
      return matches;
    }

    return matches.filter((match) =>
      match.TournamentMatchParticipant.some((matchParticipant) => {
        if (isTeamBased && matchParticipant.team) {
          return matchParticipant.team.id === selectedParticipant;
        } else if (matchParticipant.participant) {
          return matchParticipant.participant.id === selectedParticipant;
        }
        return false;
      }),
    );
  }, [matches, selectedParticipant, isTeamBased]);

  const matchesByStatus = filteredMatches.reduce(
    (acc, match) => {
      let arr = acc[match.status];
      if (!arr) {
        arr = [];
        acc[match.status] = arr;
      }
      arr.push(match);
      return acc;
    },
    {} as Record<MatchStatus, ExtendedTournamentMatch[]>,
  );

  const statuses = Object.keys(matchesByStatus) as MatchStatus[];

  if (statuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("admin.tournaments.groups.matches.title")}</CardTitle>
            {allParticipants.length > 0 && (
              <div className="flex flex-col space-y-1">
                <label className="text-muted-foreground text-sm font-medium">
                  {t("admin.tournaments.groups.matches.filter_by_player")}
                </label>
                <Select
                  value={selectedParticipant}
                  onValueChange={setSelectedParticipant}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by participant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("admin.tournaments.groups.matches.all_participants")}
                    </SelectItem>
                    {allParticipants.map((participant) => (
                      <SelectItem
                        key={participant.id}
                        value={participant.id}
                      >
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MatchManagement
            groupId={groupId}
            matches={[]}
            matchMode={matchMode}
            isTeamBased={isTeamBased}
            isMixed={isMixed}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("admin.tournaments.groups.matches.title")}</CardTitle>
          {allParticipants.length > 0 && (
            <div className="flex flex-col space-y-1">
              <label className="text-muted-foreground text-sm font-medium">
                {t("admin.tournaments.groups.matches.filter_by_player")}
              </label>
              <Select
                value={selectedParticipant}
                onValueChange={setSelectedParticipant}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.tournaments.groups.matches.all_participants")}
                  </SelectItem>
                  {allParticipants.map((participant) => (
                    <SelectItem
                      key={participant.id}
                      value={participant.id}
                    >
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {statuses.map((status) => (
          <div
            key={status}
            className="mb-6"
          >
            <h3 className="mb-2 text-lg font-semibold">
              {status} ({matchesByStatus[status]?.length ?? 0})
            </h3>
            <MatchManagement
              groupId={groupId}
              matches={matchesByStatus[status] ?? []}
              matchMode={matchMode}
              isTeamBased={isTeamBased}
              isMixed={isMixed}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
