import { getTranslations } from "next-intl/server";

export default async function TournamentCalendarPage() {
  const t = await getTranslations("tournaments.detail.nav");

  return (
    <div className="space-y-4">
      <h2 className="text-foreground text-2xl font-bold">{t("calendar")}</h2>
    </div>
  );
}
