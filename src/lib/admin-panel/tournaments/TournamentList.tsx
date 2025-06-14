import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatusBadge } from "./tournament-status-badge";

export async function TournamentList() {
  const tournaments = await api.tournaments.list({
    sortByStatus: true,
  });

  return (
    <>
      {tournaments && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament: TournamentWithRelations) => (
            <div
              key={tournament.id}
              className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-7 shadow-lg transition hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-foreground text-xl leading-tight font-extrabold">
                    {tournament.name ?? "Series"}
                  </div>
                  {tournament.tournamentSeries?.name && (
                    <div className="text-muted-foreground text-xs font-medium">
                      {tournament.tournamentSeries?.name}
                    </div>
                  )}
                </div>
                <TournamentStatusBadge status={tournament.status} />
              </div>

              {tournament.description && (
                <div
                  title={tournament.description}
                  className="text-muted-foreground mb-1 line-clamp-2 text-sm"
                >
                  {tournament.description}
                </div>
              )}

              <div className="bg-muted/60 text-muted-foreground flex flex-col gap-1 rounded-lg px-4 py-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold">Participants:</span>
                  <span>{tournament.TournamentParticipant?.length ?? 0}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold">Start:</span>
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </span>
                </div>
                {tournament.endDate && (
                  <div className="flex flex-wrap gap-2">
                    <span className="font-semibold">End:</span>
                    <span>
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tournament.registrationStartDate && (
                  <div className="flex flex-wrap gap-2">
                    <span className="font-semibold">Registration Start:</span>
                    <span>
                      {new Date(
                        tournament.registrationStartDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tournament.registrationEndDate && (
                  <div className="flex flex-wrap gap-2">
                    <span className="font-semibold">Registration End:</span>
                    <span>
                      {new Date(
                        tournament.registrationEndDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex gap-3">
                <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                  <Button
                    variant="default"
                    className="rounded-lg px-5 py-2 font-semibold"
                  >
                    Edit
                  </Button>
                </Link>
                <Link href={`/admin/tournaments/view/${tournament.id}`}>
                  <Button
                    variant="outline"
                    className="rounded-lg px-5 py-2 font-semibold"
                  >
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
