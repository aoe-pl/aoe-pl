import { redirect } from "next/navigation";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  redirect(`/tournaments/${seriesSlug}/${urlKey}/information`);
}
