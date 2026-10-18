#!/bin/sh
# Container entrypoint: create/upgrade the tables, seed (idempotent; SEED_DATABASE=false skips), then start the app.
set -e
npx prisma migrate deploy
if [ "$SEED_DATABASE" != "false" ]; then
  bun prisma/seed.ts
fi
exec node server.js
