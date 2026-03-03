import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentStatus } from "@prisma/client";
import type { TournamentWithRelations } from "@/server/api/tournament";

interface TournamentSectionsProps {
  tournaments: TournamentWithRelations[];
  labels: {
    sectionActive: string;
    sectionUpcoming: string;
    sectionFinished: string;
    noTournaments: string;
  };
}

export function TournamentSections({
  tournaments,
  labels,
}: TournamentSectionsProps) {
  const active = tournaments.filter(
    (t) => t.status === TournamentStatus.ACTIVE,
  );
  const upcoming = tournaments.filter(
    (t) => t.status === TournamentStatus.PENDING,
  );
  const finished = tournaments.filter(
    (t) =>
      t.status === TournamentStatus.FINISHED ||
      t.status === TournamentStatus.CANCELLED,
  );

  if (tournaments.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center">
        {labels.noTournaments}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {active.length > 0 && (
        <section>
          <h2 className="text-foreground mb-4 text-xl font-bold">
            {labels.sectionActive}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
              />
            ))}
          </div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-foreground mb-4 text-xl font-bold">
            {labels.sectionUpcoming}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
              />
            ))}
          </div>
        </section>
      )}
      {finished.length > 0 && (
        <section>
          <h2 className="text-foreground mb-4 text-xl font-bold">
            {labels.sectionFinished}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {finished.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
