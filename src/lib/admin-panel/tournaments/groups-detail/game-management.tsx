"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ExtendedTournamentMatch } from "./match";
import { TournamentGameForm } from "./tournament-game-form";
import { api } from "@/trpc/react";
import type { MatchParticipantWithUser } from "./match";
import type { GameType } from "./tournament-game-form";

interface GameManagementProps {
  match: ExtendedTournamentMatch;
  isOpen: boolean;
  onClose: () => void;
  matchMode: { id: string; mode: string; gameCount: number };
}

export function GameManagement({
  match,
  isOpen,
  onClose,
  matchMode,
}: GameManagementProps) {
  const {
    data: games,
    isLoading: gamesLoading,
    refetch: refetchGames,
  } = api.tournaments.games.list.useQuery(
    {
      matchId: match.id,
    },
    {
      enabled: isOpen,
    },
  );

  console.log("games", games);

  // fetch match participants
  const { data: matchParticipants } =
    api.tournaments.matches.getParticipants.useQuery({
      id: match.id,
    });

  console.log("matchParticipants", matchParticipants);

  // Extract available users from match participants
  const availableUsers = (matchParticipants ?? []).flatMap(
    (mp: MatchParticipantWithUser) => {
      if (mp.participant) {
        return [
          {
            id: mp.id,
            matchParticipantId: mp.id,
            name:
              mp.participant.nickname +
              (mp.participant.user
                ? ` (${mp.participant.user.name ?? mp.participant.user.email ?? mp.participant.user.id})`
                : ""),
          },
        ];
      }
      if (mp.team?.TournamentParticipant) {
        return mp.team.TournamentParticipant.filter((tp) => tp.user).map(
          (tp) => ({
            id: mp.id,
            matchParticipantId: mp.id,
            name:
              tp.nickname +
              (tp.user
                ? ` (${tp.user.name ?? tp.user.email ?? tp.user.id})`
                : ""),
          }),
        );
      }
      return [];
    },
  );

  // Map games to expected GameType shape for TournamentGameForm
  const mappedGames = (games ?? []).map((g) => ({
    ...g,
    participants:
      g.participants?.map((p) => ({
        ...p,
        civId: p.civ?.id ?? undefined, // Convert null to undefined
      })) ?? [],
    map: g.map ?? undefined,
  }));

  console.log("availableUsers", availableUsers);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Games for Match</DrawerTitle>
          <DrawerDescription>
            Add, update, and review games for this match. Changes can affect
            match score and winner. You can have multiple winners per game for
            mixed team scenarios.
          </DrawerDescription>
        </DrawerHeader>
        {gamesLoading ? (
          <div className="p-4">Loading games...</div>
        ) : (
          <TournamentGameForm
            onCancel={onClose}
            matchMode={matchMode}
            games={mappedGames}
            matchId={match.id}
            availableUsers={availableUsers}
            refetchGames={refetchGames}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
