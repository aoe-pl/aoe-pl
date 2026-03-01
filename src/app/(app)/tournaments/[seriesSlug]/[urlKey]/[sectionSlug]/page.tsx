import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";

export default async function TournamentSectionPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string; sectionSlug: string }>;
}) {
  const { seriesSlug, urlKey, sectionSlug } = await params;

  const { section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    sectionSlug,
  );

  return (
    <div className="space-y-4">
      <TournamentSectionContent content={section?.content} />
    </div>
  );
}
