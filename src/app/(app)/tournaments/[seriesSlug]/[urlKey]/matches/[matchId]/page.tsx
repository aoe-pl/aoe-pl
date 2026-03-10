import { getDateFnsLocale } from "@/components/tournaments/calendar/locale-utils";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { format } from "date-fns";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function TournamentMatchPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string; matchId: string }>;
}) {
  const { seriesSlug, urlKey, matchId } = await params;

  const [, match, locale] = await Promise.all([
    getTournamentOrNotFound(seriesSlug, urlKey),
    tournamentMatchRepository.getTournamentMatchById(matchId),
    getLocale(),
  ]);

  if (!match) notFound();

  const dateFnsLocale = getDateFnsLocale(locale);

  const participants = match.TournamentMatchParticipant;

  const getSlotName = (slot: (typeof participants)[number]): string => {
    if (slot.participant)
      return slot.participant.nickname ?? slot.participant.user?.name ?? "?";

    if (slot.team) return slot.team.name;

    return "?";
  };

  const p1 = participants[0];
  const p2 = participants[1];

  const player1 = p1 ? getSlotName(p1) : "TBD";
  const player2 = p2 ? getSlotName(p2) : "TBD";

  const dateLabel = match.matchDate
    ? format(new Date(match.matchDate), "PPP p", { locale: dateFnsLocale })
    : "Date TBD";

  const groupName = match.group?.name ?? "—";

  return (
    <div className="panel space-y-4">
      <h1 className="text-2xl font-bold">
        {player1} <span className="text-muted-foreground">vs</span> {player2}
      </h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{dateLabel}</dd>
        <dt className="text-muted-foreground">Group</dt>
        <dd>{groupName}</dd>
      </dl>
    </div>
  );
}
