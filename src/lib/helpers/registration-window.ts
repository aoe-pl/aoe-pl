export type RegistrationWindowStatus = "NOT_OPENED" | "OPEN" | "CLOSED";

/**
 * Derives whether registration is currently open from the optional window
 * dates configured on the tournament and the manual admin override.
 *
 * - `registrationClosed` is a manual switch admins can flip to close (or
 *   reopen) registration regardless of the configured dates.
 * - `registrationStartDate` / `registrationEndDate` are optional bounds; when
 *   set, registration won't open before the start and closes after the end.
 */
export function getRegistrationWindowStatus(
  tournament: {
    registrationStartDate: Date | null;
    registrationEndDate: Date | null;
    registrationClosed: boolean;
  },
  now: Date = new Date(),
): RegistrationWindowStatus {
  if (tournament.registrationClosed) return "CLOSED";

  if (
    tournament.registrationStartDate &&
    now < tournament.registrationStartDate
  ) {
    return "NOT_OPENED";
  }

  if (tournament.registrationEndDate && now > tournament.registrationEndDate) {
    return "CLOSED";
  }

  return "OPEN";
}

export function isRegistrationOpen(tournament: {
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
  registrationClosed: boolean;
}): boolean {
  return getRegistrationWindowStatus(tournament) === "OPEN";
}
