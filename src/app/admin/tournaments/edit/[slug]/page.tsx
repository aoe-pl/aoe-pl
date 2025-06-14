import { TournamentEdit } from "@/lib/admin-panel/tournaments/tournament-edit";
import { api } from "@/trpc/server";

export default async function AdminTournamentEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await api.tournaments.get({ id: slug });

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold text-white">Edit Tournament</h1>
      <div className="rounded-xl p-8 text-white">
        <TournamentEdit tournament={tournament} />
      </div>
    </>
  );
}
