import { api } from "@/trpc/server";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRegistrationModeLabel } from "@/lib/admin-panel/tournaments/tournament";
import { TournamentStatusBadge } from "@/lib/admin-panel/tournaments/tournament-status-badge";

export default async function AdminTournamentsViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await api.tournaments.get({ id: slug });

  if (!tournament) {
    return <div className="text-destructive">Tournament not found.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 md:max-w-4xl">
      <div className="flex flex-col gap-2 pt-2 pb-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold md:text-3xl">
              {tournament.name}
            </h1>
            {tournament.tournamentSeries?.name && (
              <div className="text-muted-foreground mt-1 text-sm font-medium">
                {tournament.tournamentSeries.name}
              </div>
            )}
          </div>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        {tournament.description && (
          <div className="text-muted-foreground mt-2 text-base">
            {tournament.description}
          </div>
        )}
      </div>

      {/* Edit Button */}
      <div className="flex w-full flex-wrap gap-2">
        <Link href={`/admin/tournaments/edit/${tournament.id}`}>
          <Button size="sm">Edit</Button>
        </Link>
      </div>

      {/* Tabs for advanced content */}
      <Tabs
        defaultValue="info"
        className="w-full"
      >
        <TabsList className="mb-2">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {/* Info Card */}
          <Card className="w-full">
            <CardHeader className="pb-0" />
            <CardContent className="flex flex-col gap-4 pt-0">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">
                    Start Date
                  </span>
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </span>
                </div>
                {tournament.endDate && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground font-semibold">
                      End Date
                    </span>
                    <span>
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
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
                      {new Date(
                        tournament.registrationEndDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">
                    Registration Mode
                  </span>
                  <span>
                    {getRegistrationModeLabel(tournament.registrationMode)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold">
                    Participants
                  </span>
                  <span>{tournament.TournamentParticipant?.length ?? 0}</span>
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
        </TabsContent>
        <TabsContent value="groups">
          {/* Groups content goes here */}
        </TabsContent>
        <TabsContent value="bracket">
          {/* Bracket content goes here */}
        </TabsContent>
        <TabsContent value="participants">
          {/* Participants content goes here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
