import type { Locale as DateFnsLocale } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";

/** Returns the date-fns locale object for a given locale code, falling back to enGB. */
export function getDateFnsLocale(locale: string): DateFnsLocale {
  const found = (dateFnsLocales as Record<string, DateFnsLocale>)[locale];
  return found ?? dateFnsLocales.enGB;
}
