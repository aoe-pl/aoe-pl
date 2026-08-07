export const predefinedTournamentSections = [
  { slug: "information", displayOrder: 0 },
  { slug: "registration", displayOrder: 1 },
  { slug: "first-steps", displayOrder: 2 },
  { slug: "awards", displayOrder: 3 },
  { slug: "calendar", displayOrder: 4 },
  { slug: "groups", displayOrder: 5 },
  { slug: "bracket", displayOrder: 6 },
  { slug: "rules", displayOrder: 7 },
  { slug: "essentials", displayOrder: 8 },
  { slug: "matches", displayOrder: 9 },
  { slug: "players", displayOrder: 10 },
] as const;

export const specialTournamentSectionSlugs = new Set([
  "registration",
  "calendar",
  "groups",
  "bracket",
  "matches",
  "players",
]);
