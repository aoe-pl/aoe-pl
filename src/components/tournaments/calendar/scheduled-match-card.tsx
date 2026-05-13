"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";
import { MatchTile } from "./match-tile";
import type { CalendarGroup, CalendarMatch, CalendarPlayer } from "./types";

interface ScheduledMatchCardProps {
  match: CalendarMatch;
  group: CalendarGroup;
  player1: CalendarPlayer;
  player2: CalendarPlayer;
  matchUrlBase: string;
  canAct: boolean;
  onReschedule: (row: TournamentMatchRow) => void;
  onCancel: (row: TournamentMatchRow) => void;
}

export function ScheduledMatchCard({
  match,
  group,
  player1,
  player2,
  matchUrlBase,
  canAct,
  onReschedule,
  onCancel,
}: ScheduledMatchCardProps) {
  const t = useTranslations("tournament.calendar");

  return (
    <div className="relative flex flex-col">
      <MatchTile
        match={match}
        group={group}
        player1={player1}
        player2={player2}
        href={`${matchUrlBase}/${match.id}`}
      />
      {canAct && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1 h-6 w-6"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                onReschedule({
                  id: match.id,
                  matchDate: match.date,
                  status: "SCHEDULED",
                  group: { id: group.id, name: group.name, color: group.color },
                  TournamentMatchParticipant: [
                    {
                      participant: {
                        id: player1.id,
                        nickname: player1.nickname,
                        userId: null,
                      },
                      team: null,
                    },
                    {
                      participant: {
                        id: player2.id,
                        nickname: player2.nickname,
                        userId: null,
                      },
                      team: null,
                    },
                  ],
                  TournamentMatchStream: [],
                });
              }}
            >
              {t("schedule.reschedule")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <AlertDialog>
                <AlertDialogTrigger className="w-full text-left">
                  {t("schedule.cancel_match")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("schedule.cancel_match_confirm_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("schedule.cancel_match_confirm_description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("schedule.cancel_match_keep_button")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        onCancel({
                          id: match.id,
                          matchDate: match.date,
                          status: "SCHEDULED",
                          group: null,
                          TournamentMatchParticipant: [],
                          TournamentMatchStream: [],
                        });
                      }}
                    >
                      {t("schedule.cancel_match_confirm_button")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
