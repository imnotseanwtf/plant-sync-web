-- AlterTable: each device's board and sensor wiring design (NULL = the default layout)
ALTER TABLE "device_identifiers" ADD COLUMN "wiring" JSONB;
