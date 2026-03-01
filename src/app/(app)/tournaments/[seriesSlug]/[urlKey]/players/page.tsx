import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";

export default async function TournamentPlayersPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const { section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    "players",
  );

  return (
    <div className="space-y-4">
      {section?.content && (
        <TournamentSectionContent content={section.content} />
      )}
    </div>
  );
}
