-- A null reading means the sensor was not detected or is defective.
ALTER TABLE "sensor_values" ALTER COLUMN "moisture_level" DROP NOT NULL,
ALTER COLUMN "humidity" DROP NOT NULL,
ALTER COLUMN "temperature" DROP NOT NULL,
ALTER COLUMN "light_intensity" DROP NOT NULL;
