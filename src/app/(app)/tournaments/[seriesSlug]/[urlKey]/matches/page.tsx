import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const { section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    "matches",
  );

  return (
    <div className="space-y-4">
      {section?.content && (
        <TournamentSectionContent content={section.content} />
      )}
    </div>
  );
}
