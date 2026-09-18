import { TopPlayersFilterDialog } from "@/components/home/top-players-filter-dialog";
import { TopPlayersList } from "@/components/home/top-players-list";
import { getIsAdmin } from "@/lib/session";
import { api } from "@/trpc/server";
import { Loader2, Medal } from "lucide-react";
import { useTranslations } from "next-intl";

export function TopPlayersLoading() {
  const t = useTranslations("home.top_players");

  return (
    <div className="panel">
      <div className="panel-header text-center">{t("title")}</div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-accent h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-3">{t("loading")}</span>
      </div>
    </div>
  );
}

/**
 * Component to display the top Polish players on the home page.
 */
export async function TopPlayers() {
  const t = useTranslations("home.top_players");
  const isAdmin = await getIsAdmin();

  try {
    const players = await api.leaderboard.getTopPolishPlayers({ count: 50 });

    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <span
            className="w-6"
            aria-hidden
          />{" "}
          {/* spacer matching button width */}
          <span className="flex-1 text-center">{t("title")}</span>
          {isAdmin && <TopPlayersFilterDialog />}
        </div>

        <TopPlayersList players={players} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch top players:", error);
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <Medal className="h-5 w-5" />
          {t("title")}
        </div>
        <div className="text-muted-foreground py-12 text-center">
          {t("error")}
        </div>
      </div>
    );
  }
}
