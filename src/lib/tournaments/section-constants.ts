export const predefinedTournamentSections = [
  { slug: "information", displayOrder: 0 },
  { slug: "registration", displayOrder: 1 },
  { slug: "first-steps", displayOrder: 2 },
  { slug: "awards", displayOrder: 3 },
  { slug: "calendar", displayOrder: 4 },
  { slug: "groups", displayOrder: 5 },
  { slug: "rules", displayOrder: 6 },
  { slug: "essentials", displayOrder: 7 },
  { slug: "matches", displayOrder: 8 },
  { slug: "players", displayOrder: 9 },
] as const;

export const specialTournamentSectionSlugs = new Set([
  "calendar",
  "groups",
  "matches",
  "players",
]);
