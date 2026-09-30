-- Seed the "Streamer" role used to gate who may mark tournament matches as
-- going to be streamed.
INSERT INTO "Role" ("id", "name", "comment", "selfAssignable", "modAssignable", "type")
SELECT
  'streamer-role',
  'Streamer',
  'Can mark tournament matches as going to be streamed.',
  false,
  true,
  'STREAMER'
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" WHERE lower("name") = 'streamer'
);
