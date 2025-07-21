import { TournamentStatus } from "@/lib/admin-panel/tournaments/tournament";

// return message string for tournament status
export const translateTournamentStatus = (status: TournamentStatus) => {
  switch (status) {
    case TournamentStatus.PENDING:
      return "admin.tournaments.status.pending";
    case TournamentStatus.ACTIVE:
      return "admin.tournaments.status.active";
    case TournamentStatus.FINISHED:
      return "admin.tournaments.status.finished";
    case TournamentStatus.CANCELLED:
      return "admin.tournaments.status.cancelled";
  }
};
