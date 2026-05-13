import {
  TournamentCalendar,
  type TournamentMatchRow,
} from "@/components/tournaments/calendar/tournament-calendar";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { usersRepository } from "@/lib/repositories/usersRepository";
import { auth } from "@/server/auth";

export default async function TournamentCalendarPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const [tournament, session] = await Promise.all([
    getTournamentOrNotFound(seriesSlug, urlKey),
    auth(),
  ]);

  const isAdmin = session?.user?.id
    ? await usersRepository.isUserAdmin(session.user.id)
    : false;

  const matches = (await tournamentMatchRepository.getCalendarMatches(
    tournament.id,
  )) as TournamentMatchRow[];

  const base = `/tournaments/${seriesSlug}/${urlKey}`;

  return (
    <div className="panel">
      <TournamentCalendar
        matches={matches}
        matchUrlBase={`${base}/matches`}
        userId={session?.user?.id ?? null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
