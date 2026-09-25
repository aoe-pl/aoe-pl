import { TournamentListClient } from "@/components/tournaments/tournament-list-client";
import { api } from "@/trpc/server";
import { getTranslations } from "next-intl/server";

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
        noTournaments: t("no_tournaments"),
      }}
    />
  );
}
