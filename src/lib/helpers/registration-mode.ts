import { RegistrationMode } from "@prisma/client";

// Registration mode formatting function
export const formatRegistrationModeLabel = (
  mode: RegistrationMode,
  t: (key: string) => string,
) => {
  switch (mode) {
    case RegistrationMode.INDIVIDUAL:
      return t("tournaments.registration_mode.individual");
    case RegistrationMode.TEAM:
      return t("tournaments.registration_mode.team");
    case RegistrationMode.ADMIN:
      return t("tournaments.registration_mode.admin");
  }
};

// Registration mode translation key helper (for use with useTranslations)
export const getRegistrationModeTranslationKey = (mode: RegistrationMode) => {
  switch (mode) {
    case RegistrationMode.INDIVIDUAL:
      return "tournaments.registration_mode.individual";
    case RegistrationMode.TEAM:
      return "tournaments.registration_mode.team";
    case RegistrationMode.ADMIN:
      return "tournaments.registration_mode.admin";
  }
};