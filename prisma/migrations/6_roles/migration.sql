-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The three built-in roles
INSERT INTO "roles" ("name", "description", "permissions") VALUES
  ('Admin', 'Full access, including users and roles.', ARRAY['plants:write', 'devices:write', 'users:manage']),
  ('Operator', 'Runs the plants: manages plants and devices, but not users.', ARRAY['plants:write', 'devices:write']),
  ('Viewer', 'Read-only: sees the dashboard, plants and devices.', ARRAY[]::TEXT[]);

-- Carry each user's single role over to the new table
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT u."id", r."id" FROM "users" u JOIN "roles" r ON lower(r."name") = u."role"::text;

-- The enum column is replaced by user_roles
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "user_role";
