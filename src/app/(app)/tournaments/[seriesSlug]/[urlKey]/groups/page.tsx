import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { getLocale } from "next-intl/server";

export default async function TournamentGroupsPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const locale = await getLocale();

  const { section } = await getTournamentPageData(seriesSlug, urlKey, "groups");

  const content =
    section?.translations.find((tr) => tr.locale === locale)?.content ?? "";

  return (
    <div className="space-y-4">
      {content && <TournamentSectionContent content={content} />}
    </div>
  );
}
