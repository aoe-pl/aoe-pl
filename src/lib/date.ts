import { format as formatWithPattern } from "date-fns";

/**
 * Normalising the picked date to UTC midnight of the same calendar day makes the
 * stored value timezone-independent.
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

/**
 * Rebuilds a Date at local midnight from a canonical date-only value's UTC
 * year/month/day. Needed when handing the value back to components (such as the
 * calendar) that reason about calendar days in local time.
 */
export function toLocalCalendarDate(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Formats a canonical date-only value (stored as UTC midnight) with a date-fns
 * pattern, reading the UTC year/month/day so the rendered day never shifts
 * regardless of the machine's timezone.
 */
export function formatDateOnly(date: Date, pattern = "PPP"): string {
  return formatWithPattern(toLocalCalendarDate(date), pattern);
}

/**
 * Locale-aware date-only formatting for Intl-based rendering (e.g.
 * `toLocaleDateString`), pinning the timezone to UTC so the calendar day is
 * stable across server and client timezones.
 */
export function formatDateOnlyLocale(
  date: Date | string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString(locale, {
    timeZone: "UTC",
    ...options,
  });
}
