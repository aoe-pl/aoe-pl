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
import {
  Breadcrumb,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumbs";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("admin.tournaments");
  const tView = await getTranslations("admin.tournaments.view");

  if (!tournament) {
    return <div className="text-destructive">{tView("tournament_not_found")}</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 md:max-w-6xl">
      <div className="py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/tournaments">
                {t("title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {tournament.name}{" "}
                <TournamentStatusBadge status={tournament.status} />
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <TournamentTabs
        tabKeys={["info", "stages", "groups", "bracket", "participants"]}
      >
        <TabsList className="mb-2">
          <TabsTrigger value="info">{tView("tabs.info")}</TabsTrigger>
          <TabsTrigger value="stages">{tView("tabs.stages")}</TabsTrigger>
          <TabsTrigger value="groups">{tView("tabs.groups")}</TabsTrigger>
          <TabsTrigger value="participants">{tView("tabs.participants")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="py-4">
            <Link href={`/admin/tournaments/edit/${tournament.id}`}>
              <Button size="sm">{tView("edit_button")}</Button>
            </Link>
          </div>
          <TournamentInfo
            tournament={tournament}
            participants={tournament.TournamentParticipant?.length ?? 0}
            tournamentSeries={tournament.tournamentSeries}
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
