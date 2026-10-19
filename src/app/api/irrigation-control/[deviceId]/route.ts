import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectUnauthorizedDevice } from '@/lib/device-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const denied = rejectUnauthorizedDevice(request);
  if (denied) return denied;

  const { deviceId } = await params;
  if (!z.uuid().safeParse(deviceId).success) {
    return NextResponse.json({ message: 'Device not found' }, { status: 404 });
  }

  const device = await prisma.deviceIdentifier.findUnique({
    where: { id: deviceId },
    select: {
      plant: { select: { moistureLevelMin: true } },
      sensorValues: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: { moistureLevel: true }
      }
    }
  });
  if (!device) {
    return NextResponse.json({ message: 'Device not found' }, { status: 404 });
  }

  // The firmware compares the body to the literal string "true". Unlike the
  // Laravel version, a device with no plant or no readings yet gets `false`
  // instead of a 500.
  const plant = device.plant;
  const latest = device.sensorValues[0];
  // A null moisture means the sensor is missing or defective: never run the pump blind.
  const needsWater =
    !!plant && latest?.moistureLevel != null && plant.moistureLevelMin >= latest.moistureLevel;

  return NextResponse.json(needsWater);
}
