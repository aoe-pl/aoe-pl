// To add a new locale, append the `list` array.
// Make sure to add a JSON translation file for that locale as well (/messages dir).

// Lang code should match the locale code used in Next.js routing (e.g. "en", "pl")
// otherwise some locale-sensitive features (like calendar labels) may fall back to the default locale.

const list = [
  { code: "pl" as const, flag: "🇵🇱", label: "Polski" },
  { code: "en" as const, flag: "🇬🇧", label: "English" },
] as const;

export type Locale = (typeof list)[number]["code"];

interface LocaleConfig {
  readonly list: readonly {
    readonly code: Locale;
    readonly flag: string;
    readonly label: string;
  }[];
  readonly supported: readonly Locale[];
  readonly default: Locale;
  readonly key: "locale";
}

export const locales: LocaleConfig = {
  list,
  supported: list.map((l) => l.code),
  default: "pl",
  key: "locale",
};
