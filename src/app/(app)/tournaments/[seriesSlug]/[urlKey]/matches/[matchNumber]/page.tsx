import { getDateFnsLocale } from "@/components/tournaments/calendar/locale-utils";
import { MatchApprovalPanel } from "@/components/tournaments/matches/match-approval-panel";
import {
  MatchGamesTable,
  type MatchGameRow,
} from "@/components/tournaments/matches/match-games-table";
import { MatchRecordingsPanel } from "@/components/tournaments/matches/match-recordings-panel";
import { MatchSchedulePanel } from "@/components/tournaments/matches/match-schedule-panel";
import { MatchScoreboard } from "@/components/tournaments/matches/match-scoreboard";
import { MatchSpoilerProvider } from "@/components/tournaments/matches/match-spoiler-context";
import { MatchSpoilerToggle } from "@/components/tournaments/matches/match-spoiler-toggle";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { usersRepository } from "@/lib/repositories/usersRepository";
import { getPlayerProfileIdFromCompanionUrl } from "@/lib/utils";
import { auth } from "@/server/auth";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function TournamentMatchPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string; matchNumber: string }>;
}) {
  const { urlKey, matchNumber } = await params;

  const [match, locale, session, t] = await Promise.all([
    tournamentMatchRepository.getTournamentMatchByNumber(Number(matchNumber)),
    getLocale(),
    auth(),
    getTranslations("tournament.matches"),
  ]);

  if (!match) notFound();

  const isAdmin = session?.user?.id
    ? await usersRepository.isUserAdmin(session.user.id)
    : false;

  const dateFnsLocale = getDateFnsLocale(locale);

  const participants = match.TournamentMatchParticipant;

  const getSlotName = (slot: (typeof participants)[number]): string => {
    if (slot.participant)
      return slot.participant.nickname ?? slot.participant.user?.name ?? "?";
    if (slot.team) return slot.team.name;
    return "?";
  };

  // TODO Update/replace this to accept teams, not just 2 players. This will be needed for team tournaments.
  const p1 = participants[0];
  const p2 = participants[1];

  const player1Name = p1 ? getSlotName(p1) : "TBD";
  const player2Name = p2 ? getSlotName(p2) : "TBD";
  const player1Number = p1?.participant?.user?.playerNumber;
  const player2Number = p2?.participant?.user?.playerNumber;

  const p1CompanionUrl = p1?.participant?.user?.aoe2companionUrl;
  const p2CompanionUrl = p2?.participant?.user?.aoe2companionUrl;

  const p1ProfileId = getPlayerProfileIdFromCompanionUrl(p1CompanionUrl ?? "");
  const p2ProfileId = getPlayerProfileIdFromCompanionUrl(p2CompanionUrl ?? "");

  const dateLabel = match.matchDate
    ? format(new Date(match.matchDate), "PPP p", { locale: dateFnsLocale })
    : t("date_tbd");

  const groupName = match.group?.name ?? "—";
  const gameCount = match.TournamentMatchMode?.gameCount ?? match.bestOf ?? 5;
  const isApproved = match.status === "ADMIN_APPROVED";

  const statusLabels = {
    PENDING: t("status.pending"),
    SCHEDULED: t("status.scheduled"),
    COMPLETED: t("status.completed"),
    ADMIN_APPROVED: t("status.admin_approved"),
  } satisfies Record<typeof match.status, string>;

  // The match can only be approved once it is completed (COMPLETED) or already
  // approved (ADMIN_APPROVED, so the approval can be revoked).
  const canApprove =
    match.status === "COMPLETED" || match.status === "ADMIN_APPROVED";

  // Whether the signed-in user is one of the players in this match.
  const isParticipant = session?.user?.id
    ? participants.some(
        (slot) => slot.participant?.user?.id === session.user.id,
      )
    : false;

  // Only admins or participants may schedule, and only while the match is upcoming.
  const isUpcoming = match.status === "PENDING" || match.status === "SCHEDULED";

  const canSchedule = isUpcoming && (isAdmin || isParticipant);

  const player1Score = p1?.wonScore ?? 0;
  const player2Score = p2?.wonScore ?? 0;

  const hasRecordings = match.Game.some(
    (game) => game.recordingKeys.length > 0 || game.recUrl !== null,
  );

  // Per-game recording info (1-based game number + file count). A restored
  // game stores more than one file and every one must be offered for download.
  const gamesWithRecordings = match.Game.flatMap((game) => {
    if (game.gameNumber === null) return [];

    const fileCount =
      game.recordingKeys.length > 0
        ? game.recordingKeys.length
        : game.recUrl
          ? 1
          : 0;

    return fileCount > 0 ? [{ gameNumber: game.gameNumber, fileCount }] : [];
  });

  const hasResults =
    player1Score > 0 ||
    player2Score > 0 ||
    match.Game.some((game) =>
      game.participants.some((participant) => participant.isWinner),
    );

  const gameRows: MatchGameRow[] = Array.from(
    { length: gameCount },
    (_, index) => {
      const game = match.Game[index];
      const gamePlayer1 = game?.participants.find(
        (participant) => participant.matchParticipantId === p1?.id,
      );
      const gamePlayer2 = game?.participants.find(
        (participant) => participant.matchParticipantId === p2?.id,
      );

      return {
        player1Civ: gamePlayer1?.civ?.name ?? null,
        player2Civ: gamePlayer2?.civ?.name ?? null,
        map: game?.map?.name ?? null,
        player1Won: gamePlayer1?.isWinner ?? false,
        player2Won: gamePlayer2?.isWinner ?? false,
      };
    },
  );

  return (
    <MatchSpoilerProvider isApproved={isApproved}>
      <div className="panel">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="flex flex-col gap-6">
            <MatchScoreboard
              player1Name={player1Name}
              player2Name={player2Name}
              player1Number={player1Number}
              player2Number={player2Number}
              player1Score={player1Score}
              player2Score={player2Score}
            />

            <MatchGamesTable rows={gameRows} />
          </div>

          <aside
            className="h-fit space-y-5 rounded-xl border border-[color:var(--medieval-wood-border)] p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
          >
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[color:var(--medieval-gold-muted)]">
                  {t("status.label")}
                </div>
                <div className="font-medium">{statusLabels[match.status]}</div>
              </div>
              <div>
                <div className="text-[color:var(--medieval-gold-muted)]">
                  {t("date")}
                </div>
                <div className="font-medium">{dateLabel}</div>
              </div>
              <div>
                <div className="text-[color:var(--medieval-gold-muted)]">
                  {t("group")}
                </div>
                <div className="font-medium">{groupName}</div>
              </div>
            </div>

            <MatchSpoilerToggle hasResults={hasResults} />

            {canSchedule && (
              <div className="border-t border-[color:var(--medieval-wood-border)] pt-4">
                <MatchSchedulePanel
                  matchId={match.id}
                  matchDate={match.matchDate}
                  player1Name={player1Name}
                  player2Name={player2Name}
                  groupName={match.group?.name ?? null}
                />
              </div>
            )}

            <MatchRecordingsPanel
              player1Data={{
                profileId: p1ProfileId,
                name: player1Name,
              }}
              player2Data={{
                profileId: p2ProfileId,
                name: player2Name,
              }}
              matchNumber={match.matchNumber}
              tournamentName={urlKey}
              matchId={match.id}
              player1MatchParticipantId={p1?.id ?? ""}
              player2MatchParticipantId={p2?.id ?? ""}
              gameCount={gameCount}
              isAdmin={isAdmin}
              hasRecordings={hasRecordings}
              isApproved={isApproved}
              canManageRecordings={isAdmin || isParticipant}
              gamesWithRecordings={gamesWithRecordings}
            />

            <div className="space-y-2 border-t border-[color:var(--medieval-wood-border)] pt-4 text-sm">
              <DraftLink label="Civ Draft" />
              <DraftLink label="Map Draft" />
            </div>

            {isAdmin && canApprove && (
              <MatchApprovalPanel
                matchId={match.id}
                isApproved={isApproved}
              />
            )}
          </aside>
        </div>
      </div>
    </MatchSpoilerProvider>
  );
}

/** Placeholder link for the (not yet implemented) civ/map drafts. */
function DraftLink({ label }: { label: string }) {
  return (
    <span className="flex cursor-not-allowed items-center gap-1 text-[color:var(--medieval-gold)] underline decoration-dotted underline-offset-4">
      {label}
    </span>
  );
}
