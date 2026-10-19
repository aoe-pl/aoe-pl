import { TrophyIcon } from "@/components/icons/trophy";
import { TournamentListClient } from "@/components/tournaments/tournament-list-client";
import { api } from "@/trpc/server";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function TournamentsPage() {
  const t = await getTranslations("tournaments");
  const tHallOfFame = await getTranslations("hall_of_fame");

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
    <>
      <Link
        href="/tournaments/hall-of-fame"
        className="wood-tile group mb-6 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="border-medieval-gold/30 bg-medieval-gold/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border">
            <TrophyIcon className="text-medieval-gold h-6 w-6" />
          </div>
          <div>
            <p className="text-medieval-gold font-bold">
              {tHallOfFame("banner_title")}
            </p>
            <p className="text-medieval-gold-muted text-sm">
              {tHallOfFame("banner_description")}
            </p>
          </div>
        </div>
        <span className="text-medieval-gold flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-0.5">
          {tHallOfFame("banner_cta")}
          <ChevronRight className="h-4 w-4" />
        </span>
      </Link>

      <TournamentListClient
        tournaments={tournaments}
        series={series}
        labels={{
          seriesLabel: t("series_label"),
          allSeries: t("all_series"),
          noTournaments: t("no_tournaments"),
        }}
      />
    </>
  );
}
