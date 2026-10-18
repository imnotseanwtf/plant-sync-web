#!/bin/sh
# Vercel build: create/upgrade the database tables, seed (idempotent), then build the app.
# Set SEED_DATABASE=false to skip seeding.
# Needs DATABASE_URL (and optionally DIRECT_URL, the non-pooled URL) available at build time.
set -e
npx prisma migrate deploy
if [ "$SEED_DATABASE" != "false" ]; then
  bun prisma/seed.ts || npx --yes bun prisma/seed.ts
fi
exec next build
