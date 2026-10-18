#!/bin/sh
# Vercel build: create/upgrade the database tables, optionally seed, then build the app.
# Needs DATABASE_URL (and optionally DIRECT_URL, the non-pooled URL) available at build time.
set -e
npx prisma migrate deploy
if [ "$SEED_DATABASE" = "true" ]; then
  npx bun prisma/seed.ts || bun prisma/seed.ts
fi
exec next build
