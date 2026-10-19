-- CreateEnum
CREATE TYPE "user_type_enum" AS ENUM ('farmer', 'admin', 'maintenance');

-- AlterTable: existing accounts were all administrators, so they keep the admin type
ALTER TABLE "users" ADD COLUMN "user_type" "user_type_enum" NOT NULL DEFAULT 'admin';

-- New users default to farmer
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'farmer';
