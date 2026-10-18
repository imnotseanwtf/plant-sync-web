import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts'
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection when the host provides one
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL']
  }
});
