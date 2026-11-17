"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { matchStatuses } from "../tournament";
import type { ExtendedTournamentMatch } from "./match";
import { AddMatchButton } from "./add-match-button";
import { MatchManagement } from "./match-management";
import { RoundRobinMatchCreator } from "./round-robin-match-creator";

interface Participant {
  id: string;
  name: string;
}

export function MatchesContainer({
  matches,
  participants = [],
  groupId,
  matchUrlBase,
  isTeamBased = false,
  isMixed = false,
}: {
  matches: ExtendedTournamentMatch[];
  participants?: { id: string }[];
  groupId: string;
  matchUrlBase?: string;
  isTeamBased?: boolean;
  isMixed?: boolean;
}) {
  const t = useTranslations("admin.tournaments.groups.matches");
  const tStatus = useTranslations("tournament.matches.status");
  const [selectedParticipant, setSelectedParticipant] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Alphabetical player order used to group a player's matches together.
  const participantOrder = useMemo(
    () =>
      new Map(
        allParticipants.map((participant, index) => [participant.id, index]),
      ),
    [allParticipants],
  );

  // Filter matches by selected participant and by the player search query.
  const filteredMatches = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const getParticipantRanks = (match: ExtendedTournamentMatch) =>
      match.TournamentMatchParticipant.map((matchParticipant) =>
        isTeamBased && matchParticipant.team
          ? matchParticipant.team.id
          : matchParticipant.participant?.id,
      )
        .filter((id): id is string => Boolean(id))
        .map((id) => participantOrder.get(id) ?? Number.MAX_SAFE_INTEGER)
        .sort((a, b) => a - b);

    const filtered = matches.filter((match) => {
      if (selectedStatus !== "all" && match.status !== selectedStatus) {
        return false;
      }

      const matchesSelectedParticipant =
        selectedParticipant === "all" ||
        match.TournamentMatchParticipant.some((matchParticipant) => {
          if (isTeamBased && matchParticipant.team) {
            return matchParticipant.team.id === selectedParticipant;
          }

          return matchParticipant.participant?.id === selectedParticipant;
        });

      if (!matchesSelectedParticipant) return false;
      if (!normalizedQuery) return true;

      return match.TournamentMatchParticipant.some((matchParticipant) => {
        const name =
          (isTeamBased && matchParticipant.team
            ? matchParticipant.team.name
            : matchParticipant.participant?.nickname) ?? "";

        return name.toLowerCase().includes(normalizedQuery);
      });
    });

    // Group matches by the earliest player in the roster: all of the first
    // player's matches come first, then the next player's remaining matches.
    return filtered.sort((a, b) => {
      const aRanks = getParticipantRanks(a);
      const bRanks = getParticipantRanks(b);
      const length = Math.max(aRanks.length, bRanks.length);

      for (let index = 0; index < length; index++) {
        const difference =
          (aRanks[index] ?? Number.MAX_SAFE_INTEGER) -
          (bRanks[index] ?? Number.MAX_SAFE_INTEGER);
        if (difference !== 0) return difference;
      }

      return 0;
    });
  }, [
    matches,
    selectedParticipant,
    selectedStatus,
    searchQuery,
    isTeamBased,
    participantOrder,
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <CardTitle>{t("title")}</CardTitle>
          <div className="flex flex-col items-start gap-2">
            {!isTeamBased && (
              <RoundRobinMatchCreator
                groupId={groupId}
                matches={matches}
                participants={participants}
              />
            )}
            <AddMatchButton groupId={groupId} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("search_placeholder")}
                aria-label={t("search_aria")}
                className="pl-8"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-muted-foreground text-sm font-medium">
                {t("status_label")}
              </label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("status_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_statuses")}</SelectItem>
                  {matchStatuses.map(({ value }) => (
                    <SelectItem
                      key={value}
                      value={value}
                    >
                      {tStatus(value.toLowerCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {allParticipants.length > 0 && (
              <div className="flex flex-col space-y-1">
                <label className="text-muted-foreground text-sm font-medium">
                  {t("filter_by_player")}
                </label>
                <Select
                  value={selectedParticipant}
                  onValueChange={setSelectedParticipant}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("participant_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_participants")}</SelectItem>
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
        </div>
      </CardHeader>
      <CardContent>
        <MatchManagement
          groupId={groupId}
          matches={filteredMatches}
          matchUrlBase={matchUrlBase}
          isTeamBased={isTeamBased}
          isMixed={isMixed}
        />
      </CardContent>
    </Card>
  );
}
