-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'MODERATOR');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "type" "RoleType" NOT NULL DEFAULT 'MODERATOR';
