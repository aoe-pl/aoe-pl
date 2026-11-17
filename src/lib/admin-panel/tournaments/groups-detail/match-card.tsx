"use client";

import { MatchStatusIcon } from "@/components/tournaments/matches/match-status-icon";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Download, Edit, ExternalLink, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { ExtendedTournamentMatch } from "./match";

interface MatchCardProps {
  match: ExtendedTournamentMatch;
  gamesCount?: number;
  onEdit?: (match: ExtendedTournamentMatch) => void;
  onDelete?: (match: ExtendedTournamentMatch) => void;
  onDownloadReplays?: (match: ExtendedTournamentMatch) => void;
  matchHref?: string;
  isTeamBased?: boolean;
  isMixed?: boolean;
}

export function MatchCard({
  match,
  gamesCount = 0,
  onEdit,
  onDelete,
  onDownloadReplays,
  matchHref,
  isTeamBased = false,
  isMixed = false,
}: MatchCardProps) {
  const t = useTranslations("admin.tournaments.groups.matches");
  const fmt = useFormatter();
  const [scoresRevealed, setScoresRevealed] = useState(false);

  const participants = match.TournamentMatchParticipant;
  const [participant1, participant2] = participants;

  const mixedTeams = isTeamBased && isMixed && participants.length > 2;

  const hasScores = participants.some(
    (participant) =>
      (participant?.wonScore !== null && participant?.wonScore !== undefined) ||
      (participant?.lostScore !== null && participant?.lostScore !== undefined),
  );

  const isSpoiler = match.status !== "ADMIN_APPROVED" && hasScores;

  const getParticipantName = (participant: typeof participant1) => {
    if (participant?.participant) {
      return participant.participant.nickname;
    }
    if (participant?.team) {
      return participant.team.name;
    }
    return t("tbd");
  };

  const renderScore = (participant: typeof participant1) => {
    const scoreText = (participant?.wonScore ?? 0).toString();

    if (!isSpoiler) {
      return (
        <span className="text-medieval-gold text-lg font-bold tabular-nums">
          {scoreText}
        </span>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setScoresRevealed((revealed) => !revealed)}
            aria-label={
              scoresRevealed ? t("card.hide_score") : t("card.reveal_score")
            }
            className="text-medieval-gold focus-visible:ring-ring cursor-pointer rounded-sm px-0.5 text-lg font-bold tabular-nums focus-visible:ring-2 focus-visible:outline-none"
          >
            {scoresRevealed ? scoreText : "?"}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {scoresRevealed ? t("card.click_hide") : t("card.click_reveal")}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderParticipants = () => {
    if (mixedTeams) {
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {participants.map((participant) => (
            <span
              key={participant.id}
              className="inline-flex items-center gap-1.5"
            >
              <span className="text-primary text-sm font-medium">
                {getParticipantName(participant)}
              </span>
              {renderScore(participant)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-primary max-w-[40%] truncate text-sm font-medium">
          {getParticipantName(participant1)}
        </span>
        {renderScore(participant1)}
        <span className="text-medieval-gold-muted text-lg font-bold">:</span>
        {renderScore(participant2)}
        <span className="text-primary max-w-[40%] truncate text-sm font-medium">
          {getParticipantName(participant2)}
        </span>
      </div>
    );
  };

  return (
    <TableRow className="border-medieval-wood-border border-b odd:bg-black/10 hover:bg-black/15">
      <TableCell className="px-3 py-3">
        {renderParticipants()}
        {(match.comment ?? match.adminComment) && (
          <div className="text-medieval-gold-muted mt-1 space-y-0.5 text-xs">
            {match.comment && (
              <div>
                <span>{t("comment")}</span>
                <span className="ml-1">{match.comment}</span>
              </div>
            )}
            {match.adminComment && (
              <div>
                <span className="italic">{t("admin")}</span>
                <span className="ml-1 italic">{match.adminComment}</span>
              </div>
            )}
          </div>
        )}
      </TableCell>

      <TableCell className="w-12 px-3 py-3 text-center">
        <div className="flex items-center justify-center">
          <MatchStatusIcon status={match.status} />
        </div>
      </TableCell>

      <TableCell className="text-medieval-gold-muted w-44 px-3 py-3 text-right text-xs tabular-nums">
        {match.matchDate && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {fmt.dateTime(new Date(match.matchDate), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        )}
      </TableCell>

      <TableCell className="w-36 px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {onDownloadReplays && gamesCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownloadReplays(match)}
              className="h-8 w-8 p-0"
              title={t("card.download_replays")}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {matchHref && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={t("card.open_match_page")}
            >
              <a
                href={matchHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(match)}
              className="h-8 w-8 p-0"
              title={t("card.edit_match")}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(match)}
              className="h-8 w-8 p-0"
              title={t("card.delete_match")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
