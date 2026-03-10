import {
  TournamentCalendar,
  type TournamentMatchRow,
} from "@/components/tournaments/calendar/tournament-calendar";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";

export default async function TournamentCalendarPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const tournament = await getTournamentOrNotFound(seriesSlug, urlKey);

  const matches = (await tournamentMatchRepository.getCalendarMatches(
    tournament.id,
  )) as TournamentMatchRow[];

  const base = `/tournaments/${seriesSlug}/${urlKey}`;

  return (
    <div className="panel">
      <TournamentCalendar
        matches={matches}
        matchUrlBase={`${base}/matches`}
      />
    </div>
  );
}
