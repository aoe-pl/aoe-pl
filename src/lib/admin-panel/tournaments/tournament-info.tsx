import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Tournament } from "./tournament";
import type { TournamentSeries } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { formatRegistrationModeLabel } from "@/lib/helpers/registration-mode";

export async function TournamentInfo({
  tournament,
  participants,
  tournamentSeries,
}: {
  tournament: Tournament;
  participants: number;
  tournamentSeries: TournamentSeries;
}) {
  const t = await getTranslations();

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <CardTitle>{t("admin.tournaments.view.info.title")}</CardTitle>
        <CardDescription>{tournament.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.series_name")}
            </span>
            <span>{tournamentSeries.name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.start_date")}
            </span>
            <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
          </div>
          {tournament.endDate && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                {t("admin.tournaments.view.info.end_date")}
              </span>
              <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {tournament.registrationStartDate && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                {t("admin.tournaments.view.info.registration_start")}
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
                {t("admin.tournaments.view.info.registration_end")}
              </span>
              <span>
                {new Date(tournament.registrationEndDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.registration_mode")}
            </span>
            <span>
              {formatRegistrationModeLabel(tournament.registrationMode, t)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.participants")}
            </span>
            <span>{participants}</span>
          </div>
          {tournament.participantsLimit && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-semibold">
                {t("admin.tournaments.view.info.participants_limit")}
              </span>
              <span>{tournament.participantsLimit}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.visibility")}
            </span>
            <span>
              {tournament.isVisible
                ? t("admin.tournaments.view.info.visible")
                : t("admin.tournaments.view.info.hidden")}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-semibold">
              {t("admin.tournaments.view.info.team_based")}
            </span>
            <span>
              {tournament.isTeamBased
                ? t("admin.tournaments.view.info.yes")
                : t("admin.tournaments.view.info.no")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
