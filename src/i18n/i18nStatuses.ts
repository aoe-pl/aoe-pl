import { TournamentStatus } from "@/lib/admin-panel/tournaments/tournament";

// return message string for tournament status
export const translateTournamentStatus = (status: TournamentStatus) => {
  switch (status) {
    case TournamentStatus.PENDING:
      return "status.pending";
    case TournamentStatus.ACTIVE:
      return "status.active";
    case TournamentStatus.FINISHED:
      return "status.finished";
    case TournamentStatus.CANCELLED:
      return "status.cancelled";
  }
};
