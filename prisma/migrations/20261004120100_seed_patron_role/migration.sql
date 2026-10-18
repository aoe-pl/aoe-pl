-- Seed the "Patron" role.
INSERT INTO "Role" ("id", "name", "comment", "selfAssignable", "modAssignable", "type")
SELECT
  'patron-role',
  'Patron',
  'Community patron.',
  false,
  true,
  'PATRON'
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" WHERE lower("name") = 'patron'
);
