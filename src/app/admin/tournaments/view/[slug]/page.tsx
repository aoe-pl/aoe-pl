import { api } from "@/trpc/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TournamentStatusBadge } from "@/lib/admin-panel/tournaments/tournament-status-badge";
import { TournamentInfo } from "@/lib/admin-panel/tournaments/tournament-info";
import { TournamentStages } from "@/lib/admin-panel/tournaments/tournament-stages";
import { TournamentTabs } from "./tabs";
import { TournamentParticipants } from "@/lib/admin-panel/tournaments/tournament-participants";
import { TournamentGroupList } from "@/lib/admin-panel/tournaments/tournament-group-list";

export default async function AdminTournamentsViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await api.tournaments.get({
    id: slug,
    includeParticipants: true,
  });

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

      <TournamentTabs
        tabKeys={["info", "stages", "groups", "bracket", "participants"]}
      >
        <TabsList className="mb-2">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="py-4">
            <Link href={`/admin/tournaments/edit/${tournament.id}`}>
              <Button size="sm">Edit</Button>
            </Link>
          </div>
          <TournamentInfo
            tournament={tournament}
            participants={tournament.TournamentParticipant?.length ?? 0}
          />
        </TabsContent>

        <TabsContent value="stages">
          <TournamentStages tournamentId={tournament.id} />
        </TabsContent>

        <TabsContent value="groups">
          <TournamentGroupList
            defaultIsTeamBased={tournament.isTeamBased}
            defaultMatchModeId={tournament.matchModeId}
            tournamentId={tournament.id}
          />
        </TabsContent>

        <TabsContent value="bracket">
          {/* Bracket content goes here */}
        </TabsContent>

        <TabsContent value="participants">
          <TournamentParticipants tournamentId={tournament.id} />
        </TabsContent>
      </TournamentTabs>
    </div>
  );
}
