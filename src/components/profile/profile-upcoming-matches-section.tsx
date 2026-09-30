import { GroupLabel } from "@/components/tournaments/group-label";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

interface UpcomingMatchTournament {
  name: string;
  urlKey: string;
  tournamentSeries: { name: string };
}

interface UpcomingMatchEntry {
  participantId: string | null;
  teamId: string | null;
  isWinner: boolean;
  participant: { id: string; nickname: string } | null;
  team: { id: string; name: string } | null;
}

export interface UpcomingMatch {
  id: string;
  matchNumber: number;
  matchDate: Date | null;
  status: string;
  bestOf: number | null;
  group: {
    id: string;
    name: string;
    color: string | null;
    tournament: UpcomingMatchTournament;
  } | null;
  bracketNodes: {
    bracket: { name: string; tournament: UpcomingMatchTournament };
  }[];
  TournamentMatchParticipant: UpcomingMatchEntry[];
}

interface ProfileUpcomingMatchesSectionProps {
  matches: UpcomingMatch[];
  participantIds: string[];
  teamIds: string[];
}

/**
 * Lists the upcoming (pending or scheduled) tournament matches for a player.
 */
export function ProfileUpcomingMatchesSection({
  matches,
  participantIds,
  teamIds,
}: ProfileUpcomingMatchesSectionProps) {
  const t = useTranslations("profile.upcoming_matches");
  const fmt = useFormatter();

  const myParticipantIds = new Set(participantIds);
  const myTeamIds = new Set(teamIds);

  const isMine = (entry: UpcomingMatchEntry) =>
    (entry.participantId != null &&
      myParticipantIds.has(entry.participantId)) ||
    (entry.teamId != null && myTeamIds.has(entry.teamId));

  const labelFor = (entry: UpcomingMatchEntry) =>
    entry.team?.name ?? entry.participant?.nickname ?? t("tbd");

  return (
    <div className="space-y-4">
      <div className="panel-header flex items-center gap-2">{t("title")}</div>

      {matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("none")}</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((match) => {
            const group = match.group;
            const bracket = group
              ? null
              : (match.bracketNodes[0]?.bracket ?? null);
            const tournament = group?.tournament ?? bracket?.tournament ?? null;
            const stageName = group?.name ?? bracket?.name ?? null;

            const href = tournament
              ? `/tournaments/${slugify(
                  tournament.tournamentSeries.name,
                )}/${tournament.urlKey}/matches/${match.matchNumber}`
              : null;

            const opponents = match.TournamentMatchParticipant.filter(
              (entry) => !isMine(entry),
            );
            const opponentLabel = opponents.length
              ? opponents.map(labelFor).join(", ")
              : t("tbd");

            return (
              <li
                key={match.id}
                className="panel-inset grid grid-cols-1 items-center gap-x-4 gap-y-1 px-3 py-2 text-sm sm:grid-cols-[minmax(0,3.2fr)_minmax(0,1fr)_8.5rem_6rem]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {tournament && href ? (
                    <Link
                      href={href}
                      className="text-accent truncate font-medium hover:underline"
                    >
                      {tournament.name}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{t("tbd")}</span>
                  )}
                  {stageName && (
                    <GroupLabel
                      name={stageName}
                      color={group?.color}
                      className="shrink-0"
                    />
                  )}
                </div>

                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{t("vs")}</span>{" "}
                  {opponentLabel}
                </span>

                <span className="text-muted-foreground text-right text-xs whitespace-nowrap">
                  {match.matchDate
                    ? fmt.dateTime(new Date(match.matchDate), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : null}
                </span>

                <Badge
                  variant={
                    match.status === "SCHEDULED" ? "default" : "secondary"
                  }
                  className="justify-self-end text-xs"
                >
                  {match.status === "SCHEDULED" ? t("scheduled") : t("pending")}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
