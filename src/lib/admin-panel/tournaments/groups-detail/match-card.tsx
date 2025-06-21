"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, MapPin, Sword, Users, Hand } from "lucide-react";
import { format } from "date-fns";
import type { ExtendedTournamentMatch } from "./match";
import type { MatchStatus } from "@prisma/client";
import { matchStatusesLabels } from "../tournament";
import { SpoilerText } from "./spoiler-protection";

interface MatchCardProps {
  match: ExtendedTournamentMatch;
  onEdit?: (match: ExtendedTournamentMatch) => void;
}

export function MatchCard({ match, onEdit }: MatchCardProps) {
  const [participant1, participant2] = match.TournamentMatchParticipant;

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
    return (
      (participant1?.score !== null && participant1?.score !== undefined) ||
      (participant2?.score !== null && participant2?.score !== undefined)
    );
  };

  const getParticipantScore = (participant: typeof participant1) => {
    const score = participant?.score?.toString() ?? "0";
    const isSpoiler = shouldHideSpoilers() && hasScores();

    return (
      <SpoilerText
        text={score}
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
    const count = match.Game?.length ?? 0;
    const isSpoiler = shouldHideSpoilers() && count > 0;

    return (
      <SpoilerText
        text={count.toString()}
        isSpoiler={isSpoiler}
        fallbackText="••"
        className="font-medium"
      />
    );
  };

  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Match</CardTitle>
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
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(match.status)}>
                {matchStatusesLabels[match.status]}
              </Badge>
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
            </div>
          </div>
          {/* Match Date */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(match.matchDate)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Participants */}
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
