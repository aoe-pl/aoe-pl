import { api } from "@/trpc/server";
import { getTranslations } from "next-intl/server";
import { TournamentListClient } from "@/components/tournaments/tournament-list-client";

export default async function TournamentsPage() {
  const t = await getTranslations("tournaments");

  const [tournaments, series] = await Promise.all([
    api.tournaments.list({
      sortByStatus: true,
      includeParticipants: true,
      includeTournamentSeries: true,
      includeMatchMode: true,
      archived: false,
    }),
    api.tournaments.series.list(),
  ]);

  return (
    <TournamentListClient
      tournaments={tournaments}
      series={series}
      labels={{
        seriesLabel: t("series_label"),
        allSeries: t("all_series"),
        sectionActive: t("section_active"),
        sectionUpcoming: t("section_upcoming"),
        sectionFinished: t("section_finished"),
        noTournaments: t("no_tournaments"),
      }}
    />
  );
}
