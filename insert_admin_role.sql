-- Adds the "Admin" role and assigns it to the specified user.
-- Idempotent: can be run multiple times without creating duplicates.
--
-- Usage:
--   psql "$DATABASE_URL" -f insert_admin_role.sql

BEGIN;

-- 1. Create the "Admin" role (only if no ADMIN role exists yet).
INSERT INTO "Role" (id, name, comment, "selfAssignable", "modAssignable", type)
SELECT 'cmugw9wb5gf1v3ukwq31d911c', 'Admin', NULL, false, false, 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE type = 'ADMIN');

-- 2. Assign the ADMIN role to the user (skip if already assigned).
INSERT INTO "UserRole" (id, "userId", "roleId", comment)
SELECT 'cmugw9wbg6ptzgyedbjzet41z', 'cmuguoojz0000ij31z1rvoa80', r.id, NULL
FROM "Role" r
WHERE r.type = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" ur
    WHERE ur."userId" = 'cmuguoojz0000ij31z1rvoa80'
      AND ur."roleId" = r.id
  );

COMMIT;
