-- DropForeignKey
ALTER TABLE "plants" DROP CONSTRAINT "plants_device_identifier_id_fkey";

-- DropForeignKey
ALTER TABLE "sensor_values" DROP CONSTRAINT "sensor_values_device_identifier_id_fkey";

-- AlterTable
ALTER TABLE "device_identifiers" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "plants" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sensor_values" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sensor_values_device_identifier_id_created_at_idx" ON "sensor_values"("device_identifier_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_device_identifier_id_fkey" FOREIGN KEY ("device_identifier_id") REFERENCES "device_identifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_values" ADD CONSTRAINT "sensor_values_device_identifier_id_fkey" FOREIGN KEY ("device_identifier_id") REFERENCES "device_identifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

