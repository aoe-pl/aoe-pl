import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatusBadge } from "./tournament-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Calendar, CalendarCheck, ClockIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TournamentArchiveButton } from "./TournamentListClient";

export async function ArchivedTournamentList() {
  const t = await getTranslations("admin.tournaments");
  const tournaments = await api.tournaments.list({
    sortByStatus: true,
    includeParticipants: true,
    archived: true,
  });

  return (
    <>
      {tournaments && tournaments.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {tournaments.map((tournament: TournamentWithRelations) => (
            <Card
              key={tournament.id}
              className="w-full min-w-[320px] transition-shadow hover:shadow-md sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {tournament.name ?? "Tournament"}
                      </CardTitle>
                    </div>
                    <div className="ite ms-center flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                        title={t("view")}
                      >
                        <Link href={`/admin/tournaments/view/${tournament.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <TournamentArchiveButton
                        tournamentId={tournament.id}
                        isArchived={true}
                        title={t("unarchive")}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="border-orange-200 bg-orange-50 text-orange-700"
                    >
                      Archived
                    </Badge>
                    <TournamentStatusBadge status={tournament.status} />
                    {tournament.matchMode?.mode && (
                      <Badge variant="outline">
                        {tournament.matchMode?.mode}
                      </Badge>
                    )}
                    {tournament.isTeamBased && (
                      <Badge variant="secondary">{t("team_based")}</Badge>
                    )}
                  </div>
                  {tournament.tournamentSeries?.name && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <span>Series: {tournament.tournamentSeries.name}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.description && (
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-sm">
                      {tournament.description}
                    </p>
                  </div>
                )}

                {/* Tournament Details */}
                <div className="space-y-2 border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="text-muted-foreground h-3 w-3" />
                      <span className="muted-foreground">
                        {t("participants")}:
                      </span>
                      <span className="font-medium">
                        {tournament.TournamentParticipant?.length ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground">
                        {t("start")}:
                      </span>
                      <span className="font-medium">
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {(tournament.endDate ??
                    tournament.registrationStartDate ??
                    tournament.registrationEndDate) && (
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {tournament.endDate && (
                        <div className="flex items-center gap-1">
                          <CalendarCheck className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground">
                            {t("end")}:
                          </span>
                          <span className="font-medium">
                            {new Date(tournament.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {tournament.registrationStartDate && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground">
                            {t("registration_start")}:
                          </span>
                          <span className="font-medium">
                            {new Date(
                              tournament.registrationStartDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {tournament.registrationEndDate && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground">
                            {t("registration_end")}:
                          </span>
                          <span className="font-medium">
                            {new Date(
                              tournament.registrationEndDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tournament Info */}
                <div className="text-muted-foreground space-y-1 border-t pt-3 text-xs">
                  <div>
                    {t("url_key")}: {tournament.urlKey}
                  </div>
                  {tournament.participantsLimit && (
                    <div>
                      {t("participants_limit")}: {tournament.participantsLimit}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-muted-foreground mb-2 text-lg font-medium">
              {t("no_archived_tournaments")}
            </h3>
            <p className="text-muted-foreground">
              {t("all_archived_tournaments")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
