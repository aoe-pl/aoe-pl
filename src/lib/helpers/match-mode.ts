import { TournamentMatchModeType } from "@prisma/client";

// Match mode formatting functions
export const formatMatchModeName = (
  mode: TournamentMatchModeType,
  gameCount: number,
  t: (key: string, params?: Record<string, string | number>) => string
) => {
  if (mode === TournamentMatchModeType.BEST_OF) {
    return t("tournaments.match_mode.best_of_format", { count: gameCount });
  } else {
    return t("tournaments.match_mode.play_all_format", { count: gameCount });
  }
};

export const formatMatchModeDescription = (
  mode: TournamentMatchModeType,
  gameCount: number,
  t: (key: string, params?: Record<string, string | number>) => string
) => {
  if (mode === TournamentMatchModeType.BEST_OF) {
    const toWin = Math.ceil(gameCount / 2);
    return t("tournaments.match_mode.best_of_description", { count: toWin });
  } else {
    return t("tournaments.match_mode.play_all_description", { count: gameCount });
  }
};