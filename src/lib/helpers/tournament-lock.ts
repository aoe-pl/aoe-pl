import type { TournamentStatus } from "@prisma/client";

const readOnlyTournamentStatuses: TournamentStatus[] = [
  "FINISHED",
  "CANCELLED",
];

/**
 * Whether a tournament is read-only, archived or finished.
 */
export function isTournamentReadOnly(tournament: {
  status: TournamentStatus;
  archived: boolean;
}): boolean {
  return (
    tournament.archived ||
    readOnlyTournamentStatuses.includes(tournament.status)
  );
}
