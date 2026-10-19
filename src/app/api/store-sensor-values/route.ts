import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectUnauthorizedDevice } from '@/lib/device-auth';
import { prisma } from '@/lib/prisma';

const numeric = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
  z.number()
);

const storeSensorValueSchema = z.object({
  device_identifier_id: z.uuid(),
  // null (or omitted) means the sensor was not detected or is defective.
  moisture_level: numeric.nullish(),
  humidity: numeric.nullish(),
  temperature: numeric.nullish(),
  light_intensity: numeric.nullish(),
  is_irrigating: z.boolean().nullish()
});

export async function POST(request: Request) {
  const denied = rejectUnauthorizedDevice(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = storeSensorValueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'The given data was invalid.', errors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 }
    );
  }

  const {
    device_identifier_id,
    moisture_level,
    humidity,
    temperature,
    light_intensity,
    is_irrigating
  } = parsed.data;

  const device = await prisma.deviceIdentifier.findUnique({
    where: { id: device_identifier_id },
    select: { id: true }
  });
  if (!device) {
    return NextResponse.json({ message: 'Device not found' }, { status: 404 });
  }

  const sensorValue = await prisma.sensorValue.create({
    data: {
      deviceIdentifierId: device_identifier_id,
      moistureLevel: moisture_level ?? null,
      humidity: humidity ?? null,
      temperature: temperature ?? null,
      lightIntensity: light_intensity ?? null,
      isIrrigating: is_irrigating ?? false
    },
    select: { id: true }
  });

  // The id is a BigInt, which JSON cannot serialize; the firmware only logs it.
  return NextResponse.json(Number(sensorValue.id), { status: 201 });
}
