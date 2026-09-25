import { TournamentCard } from "@/components/tournaments/tournament-card";
import type { TournamentWithRelations } from "@/server/api/tournament";

interface TournamentSectionsProps {
  tournaments: TournamentWithRelations[];
  labels: {
    noTournaments: string;
  };
}

export function TournamentSections({
  tournaments,
  labels,
}: TournamentSectionsProps) {
  if (tournaments.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center">
        {labels.noTournaments}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((t) => (
        <TournamentCard
          key={t.id}
          tournament={t}
        />
      ))}
    </div>
  );
}
