import { TournamentStatus } from "@prisma/client";

// Tournament status formatting function
export const formatTournamentStatusLabel = (
  status: TournamentStatus,
  t: (key: string) => string,
) => {
  switch (status) {
    case TournamentStatus.PENDING:
      return t("tournaments.status.pending");
    case TournamentStatus.ACTIVE:
      return t("tournaments.status.active");
    case TournamentStatus.FINISHED:
      return t("tournaments.status.finished");
    case TournamentStatus.CANCELLED:
      return t("tournaments.status.cancelled");
  }
};

// Tournament status translation key helper (for use with useTranslations)
export const getTournamentStatusTranslationKey = (status: TournamentStatus) => {
  switch (status) {
    case TournamentStatus.PENDING:
      return "tournaments.status.pending";
    case TournamentStatus.ACTIVE:
      return "tournaments.status.active";
    case TournamentStatus.FINISHED:
      return "tournaments.status.finished";
    case TournamentStatus.CANCELLED:
      return "tournaments.status.cancelled";
  }
};
