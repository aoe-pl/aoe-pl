import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRegistrationModeLabel, type Tournament } from "./tournament";
import type { TournamentSeries } from "@prisma/client";

export function TournamentInfo({
  tournament,
  participants,
  tournamentSeries,
}: {
  tournament: Tournament;
  participants: number;
  tournamentSeries: TournamentSeries;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <CardTitle>Tournament Info</CardTitle>
        <CardDescription>{tournament.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Series name
            </span>
            <span>{tournamentSeries.name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Start Date
            </span>
            <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
          </div>
          {tournament.endDate && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                End Date
              </span>
              <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {tournament.registrationStartDate && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                Registration Start
              </span>
              <span>
                {new Date(
                  tournament.registrationStartDate,
                ).toLocaleDateString()}
              </span>
            </div>
          )}
          {tournament.registrationEndDate && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                Registration End
              </span>
              <span>
                {new Date(tournament.registrationEndDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Registration Mode
            </span>
            <span>{getRegistrationModeLabel(tournament.registrationMode)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Participants
            </span>
            <span>{participants}</span>
          </div>
          {tournament.participantsLimit && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                Participants Limit
              </span>
              <span>{tournament.participantsLimit}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Visibility
            </span>
            <span>{tournament.isVisible ? "Visible" : "Hidden"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              Team Based
            </span>
            <span>{tournament.isTeamBased ? "Yes" : "No"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
