import { RegistrationFieldType } from "@prisma/client";

/**
 * System-defined registration fields that admins can enable per tournament.
 */
export const registrationFieldPresets = {
  aoe2companion: {
    slug: "aoe2companion",
    type: RegistrationFieldType.STRING,
    required: false,
  },
} as const;

export const aoe2companionRegistrationFieldSlug =
  registrationFieldPresets.aoe2companion.slug;

export type RegistrationFieldPresetSlug = keyof typeof registrationFieldPresets;

export type RegistrationFieldPreset =
  (typeof registrationFieldPresets)[RegistrationFieldPresetSlug];

export const registrationFieldPresetList = Object.values(
  registrationFieldPresets,
);

export function getRegistrationFieldPreset(
  slug: string | null | undefined,
): RegistrationFieldPreset | null {
  if (!slug) return null;

  return registrationFieldPresets[slug as RegistrationFieldPresetSlug] ?? null;
}
