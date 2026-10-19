-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'operator', 'viewer');

-- AlterTable: existing users keep full access, so nobody is locked out by the upgrade
ALTER TABLE "users" ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'admin';

-- New users default to the least-privileged role
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'viewer';
