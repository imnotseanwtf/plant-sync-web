#!/bin/sh
# Container entrypoint: create/upgrade the tables, optionally seed, then start the app.
set -e
npx prisma migrate deploy
if [ "$SEED_DATABASE" = "true" ]; then
  bun prisma/seed.ts
fi
exec node server.js
