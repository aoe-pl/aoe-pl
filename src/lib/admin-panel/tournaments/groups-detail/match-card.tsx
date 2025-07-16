"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Edit,
  MapPin,
  Sword,
  Users,
  Hand,
  Trash2,
  Swords,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import type { ExtendedTournamentMatch } from "./match";
import type { MatchStatus } from "@prisma/client";
import { matchStatusesLabels } from "../tournament";
import { SpoilerText } from "./spoiler-protection";

interface MatchCardProps {
  match: ExtendedTournamentMatch;
  gamesCount?: number;
  onEdit?: (match: ExtendedTournamentMatch) => void;
  onDelete?: (match: ExtendedTournamentMatch) => void;
  onManageGames?: (match: ExtendedTournamentMatch) => void;
  onDownloadReplays?: (match: ExtendedTournamentMatch) => void;
  isTeamBased?: boolean;
  isMixed?: boolean;
}

export function MatchCard({
  match,
  gamesCount = 0,
  onEdit,
  onDelete,
  onManageGames,
  onDownloadReplays,
  isTeamBased = false,
  isMixed = false,
}: MatchCardProps) {
  const participants = match.TournamentMatchParticipant;
  const [participant1, participant2] = participants;

  const getStatusVariant = (status: MatchStatus) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "SCHEDULED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      case "ADMIN_APPROVED":
        return "default";
      default:
        return "outline";
    }
  };

  const mixedTeams = isTeamBased && isMixed;

  const getParticipantName = (participant: typeof participant1) => {
    if (participant?.participant) {
      return participant.participant.nickname;
    }
    if (participant?.team) {
      return participant.team.name;
    }
    return "TBD";
  };

  const shouldHideSpoilers = () => {
    return match.status !== "ADMIN_APPROVED";
  };

  const hasScores = () => {
    return participants.some(
      (participant) =>
        (participant?.wonScore !== null &&
          participant?.wonScore !== undefined) ||
        (participant?.lostScore !== null &&
          participant?.lostScore !== undefined),
    );
  };

  const getParticipantScore = (participant: typeof participant1) => {
    const wonScore = participant?.wonScore ?? 0;
    const lostScore = participant?.lostScore ?? 0;
    const scoreText = `${wonScore} - ${lostScore}`;
    const isSpoiler = shouldHideSpoilers() && hasScores();

    return (
      <SpoilerText
        text={scoreText}
        isSpoiler={isSpoiler}
        fallbackText="••"
        className="text-primary text-lg font-bold"
      />
    );
  };

  const isWinner = (participant: typeof participant1) => {
    const winner = participant?.isWinner ?? false;
    const isSpoiler = shouldHideSpoilers() && hasScores();

    if (!winner || !isSpoiler) {
      return winner;
    }

    return false;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return format(new Date(date), "MMM dd, yyyy 'at' HH:mm");
  };

  const getGamesCount = () => {
    const isSpoiler = shouldHideSpoilers() && gamesCount > 0;

    return (
      <SpoilerText
        text={gamesCount.toString()}
        isSpoiler={isSpoiler}
        fallbackText="••"
        className="font-medium"
      />
    );
  };

  // Render team-based match (winners vs losers)
  const renderMixedTeamBasedParticipants = () => {
    const winners = participants.filter((p) => p.isWinner);
    const losers = participants.filter((p) => !p.isWinner);
    const allParticipants = participants.filter((p) => p.participantId);

    // If no scores yet, show all participants in a simple list
    if (!hasScores() || shouldHideSpoilers()) {
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Participants ({allParticipants.length})
          </h4>
          <div className="space-y-2">
            {allParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <span className="text-sm font-medium">
                  {getParticipantName(participant)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Winners */}
        {winners.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-primary text-sm font-medium">Winners</h4>
              <Badge
                variant="default"
                className="bg-primary/10 text-primary text-xs"
              >
                {winners.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {winners.map((participant) => (
                <div
                  key={participant.id}
                  className="border-primary/20 bg-primary/5 flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-sm font-medium">
                    {getParticipantName(participant)}
                  </span>
                  <span className="text-primary text-sm font-bold">
                    {getParticipantScore(participant)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Losers */}
        {losers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-muted-foreground text-sm font-medium">
                Others
              </h4>
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {losers.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {losers.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-sm font-medium">
                    {getParticipantName(participant)}
                  </span>
                  <span className="text-sm font-bold">
                    {getParticipantScore(participant)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render 1v1 match (traditional layout)
  const render1v1Participants = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <span className="text-sm font-medium">
              {getParticipantName(participant1)}
            </span>
            <div className="text-primary text-lg font-bold">
              {getParticipantScore(participant1)}
            </div>
          </div>
          {isWinner(participant1) && (
            <Badge
              variant="default"
              className="text-xs"
            >
              Winner
            </Badge>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <span className="text-sm font-medium">
              {getParticipantName(participant2)}
            </span>
            <div className="text-primary text-lg font-bold">
              {getParticipantScore(participant2)}
            </div>
          </div>
          {isWinner(participant2) && (
            <Badge
              variant="default"
              className="text-xs"
            >
              Winner
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full min-w-[350px] transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {isTeamBased && isMixed && participants.length > 2
                  ? `Mixed Team Match (${participants.length})`
                  : "Match"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onDownloadReplays && gamesCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownloadReplays(match)}
                  className="h-8 w-8 p-0"
                  title="Download replays"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {onManageGames && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onManageGames(match)}
                  className="h-8 w-8 p-0"
                >
                  <Swords className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(match)}
                  className="h-8 w-8 p-0"
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusVariant(match.status)}>
              {matchStatusesLabels[match.status]}
            </Badge>
            {isTeamBased && isMixed && participants.length > 2 && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                Mixed Team
              </Badge>
            )}
            {match.isManualMatch && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                <Hand className="mr-1 h-3 w-3" />
                Manual
              </Badge>
            )}
          </div>
          {/* Match Date */}
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(match.matchDate)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mixedTeams
          ? renderMixedTeamBasedParticipants()
          : render1v1Participants()}

        {/* Match Details */}
        <div className="space-y-2 border-t pt-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Sword className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">Civ Draft:</span>
              <span className="font-medium">
                {match.civDraftKey || "Not set"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">Map Draft:</span>
              <span className="font-medium">
                {match.mapDraftKey || "Not set"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Users className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">Games:</span>
            {getGamesCount()}
          </div>
        </div>

        {/* Comments */}
        {(match.comment ?? match.adminComment) && (
          <div className="space-y-1 border-t pt-3">
            {match.comment && (
              <div className="text-xs">
                <span className="text-muted-foreground">Comment:</span>
                <span className="ml-1">{match.comment}</span>
              </div>
            )}
            {match.adminComment && (
              <div className="text-xs">
                <span className="text-muted-foreground italic">Admin:</span>
                <span className="ml-1 italic">{match.adminComment}</span>
              </div>
            )}
          </div>
        )}

        {/* Match Info */}
        <div className="text-muted-foreground space-y-1 border-t pt-3 text-xs">
          <div>
            Created: {format(new Date(match.createdAt), "MMM dd, yyyy HH:mm")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
