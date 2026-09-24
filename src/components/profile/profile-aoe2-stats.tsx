import {
  getAoe2Companion1v1,
  type Aoe2CompanionProfile,
} from "@/lib/aoe2companion";
import { Swords } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileAoe2StatsProps {
  profile: Aoe2CompanionProfile;
}

/**
 * Displays ranked statistics pulled from the player's AoE2Companion profile.
 */
export function ProfileAoe2Stats({ profile }: ProfileAoe2StatsProps) {
  const t = useTranslations("profile.aoe2companion.stats");

  const oneVsOne = getAoe2Companion1v1(profile);
  const wins = oneVsOne?.wins ?? 0;
  const losses = oneVsOne?.losses ?? 0;
  const playedGames = wins + losses;
  const winRate =
    playedGames > 0 ? `${Math.round((wins / playedGames) * 100)}%` : "-";

  return (
    <div className="space-y-4">
      <div className="panel-header flex items-center gap-2">
        <Swords className="h-5 w-5" />
        {t("title")}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("rating")}
          value={oneVsOne?.rating ?? "-"}
          highlight
        />
        <StatCard
          label={t("rank")}
          value={oneVsOne?.rank ? `#${oneVsOne.rank}` : "-"}
        />
        <StatCard
          label={t("games")}
          value={oneVsOne?.games ?? "-"}
        />
        <StatCard
          label={t("win_rate")}
          value={winRate}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className="panel-inset flex flex-col items-center gap-1 p-3 text-center">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className="text-xl font-bold"
        style={highlight ? { color: "var(--medieval-gold)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
