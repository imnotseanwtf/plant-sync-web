-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "device_identifiers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" BIGSERIAL NOT NULL,
    "device_identifier_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "moisture_level_min" DOUBLE PRECISION NOT NULL,
    "moisture_level_max" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "light_intensity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_values" (
    "id" BIGSERIAL NOT NULL,
    "device_identifier_id" UUID NOT NULL,
    "moisture_level" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "light_intensity" DOUBLE PRECISION NOT NULL,
    "is_irrigating" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(0),
    "password" VARCHAR(255) NOT NULL,
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_identifiers_name_key" ON "device_identifiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plants_device_identifier_id_key" ON "plants"("device_identifier_id");

-- CreateIndex
CREATE INDEX "sensor_values_device_identifier_id_created_at_idx" ON "sensor_values"("device_identifier_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_device_identifier_id_fkey" FOREIGN KEY ("device_identifier_id") REFERENCES "device_identifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_values" ADD CONSTRAINT "sensor_values_device_identifier_id_fkey" FOREIGN KEY ("device_identifier_id") REFERENCES "device_identifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

