import { getTranslations } from "next-intl/server";

export default async function TournamentGroupsPage() {
  const t = await getTranslations("tournaments.detail.nav");

  return (
    <div className="space-y-4">
      <h2 className="text-foreground text-2xl font-bold">{t("groups")}</h2>
    </div>
  );
}
