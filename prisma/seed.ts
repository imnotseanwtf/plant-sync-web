/**
 * Idempotent seeder: a login user plus demo devices, plants and sensor readings.
 *   bun run db:seed
 * Login comes from SEED_USER_NAME / SEED_USER_EMAIL / SEED_USER_PASSWORD (see .env.example).
 */
import 'dotenv/config';
import { hashPassword } from '../src/lib/auth/password';
import { prisma } from '../src/lib/prisma';

const demo = [
  { device: 'esp32-basil-01', name: 'Basil', min: 30, max: 60, humidity: 55, temperature: 24, light: 600, moisture: 52 },
  { device: 'esp32-mint-02', name: 'Mint', min: 40, max: 70, humidity: 60, temperature: 22, light: 450, moisture: 28 }
];

async function main() {
  const name = process.env.SEED_USER_NAME || 'Admin';
  const email = (process.env.SEED_USER_EMAIL || 'admin@example.com').trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD || 'password';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: await hashPassword(password) }
  });
  console.log(`User ${email} ready`);

  for (const d of demo) {
    const device = await prisma.deviceIdentifier.upsert({
      where: { name: d.device },
      update: {},
      create: { name: d.device }
    });
    await prisma.plant.upsert({
      where: { deviceIdentifierId: device.id },
      update: {},
      create: {
        deviceIdentifierId: device.id,
        name: d.name,
        moistureLevelMin: d.min,
        moistureLevelMax: d.max,
        humidity: d.humidity,
        temperature: d.temperature,
        lightIntensity: d.light
      }
    });
    if ((await prisma.sensorValue.count({ where: { deviceIdentifierId: device.id } })) === 0) {
      const now = Date.now();
      await prisma.sensorValue.createMany({
        data: Array.from({ length: 24 }, (_, i) => {
          const wave = Math.sin(i / 3);
          const moisture = Math.max(5, Math.min(95, d.moisture + wave * 12));
          return {
            deviceIdentifierId: device.id,
            moistureLevel: Math.round(moisture * 10) / 10,
            humidity: Math.round((d.humidity + wave * 4) * 10) / 10,
            temperature: Math.round((d.temperature + wave * 2) * 10) / 10,
            lightIntensity: Math.round(d.light + wave * 80),
            isIrrigating: moisture <= d.min,
            createdAt: new Date(now - (23 - i) * 60 * 60 * 1000)
          };
        })
      });
    }
    console.log(`Plant ${d.name} (${d.device}) ready`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
