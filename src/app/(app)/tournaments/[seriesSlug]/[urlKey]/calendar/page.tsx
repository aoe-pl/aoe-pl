import {
  TournamentCalendar,
  type TournamentMatchRow,
} from "@/components/tournaments/calendar/tournament-calendar";
import { isTournamentReadOnly } from "@/lib/helpers/tournament-lock";
import { getTournament } from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { usersRepository } from "@/lib/repositories/usersRepository";
import { auth } from "@/server/auth";
import { getTranslations } from "next-intl/server";

export default async function TournamentCalendarPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const [tournament, session, t] = await Promise.all([
    getTournament(seriesSlug, urlKey),
    auth(),
    getTranslations("tournament"),
  ]);

  const isAdmin = session?.user?.id
    ? await usersRepository.isUserAdmin(session.user.id)
    : false;

  // Finished or archived tournaments are read-only: matches can no longer be
  // scheduled, rescheduled or cancelled from the calendar.
  const isReadOnly = isTournamentReadOnly(tournament);

  const matches = (await tournamentMatchRepository.getCalendarMatches(
    tournament.id,
  )) as TournamentMatchRow[];

  const base = `/tournaments/${seriesSlug}/${urlKey}`;

  return (
    <div>
      {isReadOnly && (
        <p className="border-medieval-wood-border text-medieval-gold-muted mb-4 rounded-lg border bg-black/20 px-4 py-2 text-sm">
          {t("read_only_notice")}
        </p>
      )}

      <TournamentCalendar
        matches={matches}
        matchUrlBase={`${base}/matches`}
        userId={session?.user?.id ?? null}
        isAdmin={isAdmin}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
