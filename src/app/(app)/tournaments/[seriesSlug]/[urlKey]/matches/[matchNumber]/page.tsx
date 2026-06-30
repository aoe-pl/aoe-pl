import { PlayerLink } from "@/components/player-link";
import { getDateFnsLocale } from "@/components/tournaments/calendar/locale-utils";
import { RecordingsUploadDialog } from "@/components/tournaments/matches/recordings-upload-dialog";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { format } from "date-fns";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function TournamentMatchPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string; matchNumber: string }>;
}) {
  const { seriesSlug, urlKey, matchNumber } = await params;

  const [, match, locale] = await Promise.all([
    getTournamentOrNotFound(seriesSlug, urlKey),
    tournamentMatchRepository.getTournamentMatchByNumber(Number(matchNumber)),
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

  const player1Name = p1 ? getSlotName(p1) : "TBD";
  const player2Name = p2 ? getSlotName(p2) : "TBD";
  const player1Number = p1?.participant?.user?.playerNumber;
  const player2Number = p2?.participant?.user?.playerNumber;

  const dateLabel = match.matchDate
    ? format(new Date(match.matchDate), "PPP p", { locale: dateFnsLocale })
    : "Date TBD";

  const groupName = match.group?.name ?? "—";
  const gameCount = match.TournamentMatchMode?.gameCount ?? 5;

  return (
    <div className="panel space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">
          <PlayerLink
            name={player1Name}
            playerNumber={player1Number}
          />{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          <PlayerLink
            name={player2Name}
            playerNumber={player2Number}
          />
        </h1>
        <div className="flex gap-2">
          <RecordingsUploadDialog
            player1Name={player1Name}
            player2Name={player2Name}
            gameCount={gameCount}
          />
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{dateLabel}</dd>
        <dt className="text-muted-foreground">Group</dt>
        <dd>{groupName}</dd>
      </dl>
    </div>
  );
}
