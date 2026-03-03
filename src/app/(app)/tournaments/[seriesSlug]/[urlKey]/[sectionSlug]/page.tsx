import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { getLocale } from "next-intl/server";

export default async function TournamentSectionPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string; sectionSlug: string }>;
}) {
  const { seriesSlug, urlKey, sectionSlug } = await params;
  const locale = await getLocale();

  const { section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    sectionSlug,
  );

  const content =
    section.translations.find((tr) => tr.locale === locale)?.content ?? "";

  return (
    <div className="space-y-4">
      <TournamentSectionContent content={content} />
    </div>
  );
}
