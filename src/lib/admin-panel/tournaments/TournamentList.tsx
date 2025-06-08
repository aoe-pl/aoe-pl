import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TournamentWithRelations } from "@/server/api/tournament";

export async function TournamentList() {
  const tournaments = await api.tournaments.list();

  return (
    <>
      {tournaments && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament: TournamentWithRelations) => (
            <div
              key={tournament.id}
              className="flex flex-col gap-4 rounded-xl border p-6 shadow"
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">
                  {tournament.tournamentSeries?.name ?? "Series"}
                </div>
                <span className={`rounded px-2 py-1 text-xs font-semibold`}>
                  {tournament.status}
                </span>
              </div>
              <div className="text-xl font-semibold">
                {tournament.urlKey.replace(/-/g, " ")}
              </div>
              <div className="line-clamp-2 text-sm">
                {tournament.description}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm">
                  Participants: {tournament.TournamentParticipant?.length ?? 0}
                </span>
                <span className="text-sm">
                  Start: {new Date(tournament.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Link href={`/admin/tournaments/${tournament.id}`}>
                  <Button variant="outline">Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
