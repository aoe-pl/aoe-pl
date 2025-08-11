"use client";

import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type TournamentStage } from "../tournament";
import { Calendar, Gamepad, MapPin, Users } from "lucide-react";

export type GroupHeaderProps = {
  name: string;
  isTeamBased: boolean;
  participantsCount: number;
  matchesCount: number;
  matchMode: { mode: string; gameCount: number };
  onEdit: () => void;
  isMixed: boolean;
  stage: TournamentStage;
};

export function GroupHeader({
  isTeamBased,
  participantsCount,
  matchesCount,
  matchMode,
  onEdit,
  isMixed,
  stage,
}: GroupHeaderProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {isTeamBased ? "Team Based" : "1v1"}
                </Badge>
                {isMixed && <Badge variant="default">Mixed</Badge>}
              </div>
            </div>
            <Button onClick={onEdit}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {participantsCount} Participants
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {matchesCount} Matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {matchMode.mode} {matchMode.gameCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {stage.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
