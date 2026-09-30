import {
  getAoe2CompanionMatchOpponents,
  getAoe2CompanionMatchPlayer,
  type Aoe2CompanionMatch,
} from "@/lib/aoe2companion";
import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";

interface ProfileAoe2MatchesProps {
  profileId: number;
  matches: Aoe2CompanionMatch[];
}

/**
 * Displays the player's most recent ranked 1v1 matches pulled from
 * AoE2Companion, including the result, matchup and map.
 */
export function ProfileAoe2Matches({
  profileId,
  matches,
}: ProfileAoe2MatchesProps) {
  const t = useTranslations("profile.aoe2companion.matches");

  return (
    <div className="space-y-4">
      <div className="panel-header flex items-center gap-2">{t("title")}</div>

      {matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("none")}</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((match) => (
            <MatchRow
              key={match.matchId}
              match={match}
              profileId={profileId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface MatchRowProps {
  match: Aoe2CompanionMatch;
  profileId: number;
}

function MatchRow({ match, profileId }: MatchRowProps) {
  const t = useTranslations("profile.aoe2companion.matches");
  const fmt = useFormatter();

  const player = getAoe2CompanionMatchPlayer(match, profileId);
  const opponents = getAoe2CompanionMatchOpponents(match, profileId);

  const won = player?.won ?? null;
  const ratingDiff = player?.ratingDiff ?? null;
  const playedAt = match.finished ?? match.started;

  const opponentNames = opponents.length
    ? opponents.map((o) => o.name).join(", ")
    : t("unknown_opponent");

  return (
    <li className="panel-inset flex items-center gap-3 px-3 py-2 text-sm">
      <span
        aria-label={
          won === true ? t("win") : won === false ? t("loss") : t("unknown")
        }
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          won === true && "bg-emerald-500/15 text-emerald-400",
          won === false && "bg-red-500/15 text-red-400",
          won === null && "text-muted-foreground bg-black/20",
        )}
      >
        {won === true ? "W" : won === false ? "L" : "-"}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <CivIcon player={player} />
        <span className="text-muted-foreground shrink-0">{t("vs")}</span>
        {opponents.map((opponent) => (
          <CivIcon
            key={opponent.profileId}
            player={opponent}
          />
        ))}
        <span className="truncate font-semibold">{opponentNames}</span>
      </div>

      <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
        {match.mapName ?? t("unknown")}
      </span>

      {ratingDiff != null && (
        <span
          className={cn(
            "shrink-0 font-semibold tabular-nums",
            ratingDiff >= 0 ? "text-emerald-400" : "text-red-400",
          )}
        >
          {ratingDiff > 0 ? `+${ratingDiff}` : ratingDiff}
        </span>
      )}

      {playedAt && (
        <span className="text-muted-foreground shrink-0 text-xs">
          {fmt.relativeTime(new Date(playedAt))}
        </span>
      )}
    </li>
  );
}

interface CivIconProps {
  player?: {
    civImageUrl: string | null;
    civName: string | null;
  };
}

function CivIcon({ player }: CivIconProps) {
  if (!player?.civImageUrl) return null;

  return (
    <img
      src={player.civImageUrl}
      alt={player.civName ?? ""}
      title={player.civName ?? undefined}
      className="h-5 w-5 shrink-0 rounded object-cover"
    />
  );
}
