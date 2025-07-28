import { getTranslations } from "next-intl/server";
import { ArchivedTournamentList } from "@/lib/admin-panel/tournaments/ArchivedTournamentList";

export default async function ArchivedTournamentsPage() {
  const t = await getTranslations("admin.tournaments");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          {t("archived_title")}
        </h1>
      </div>
      <div className="flex-1 space-y-4 py-4">
        <ArchivedTournamentList />
      </div>
    </div>
  );
}
