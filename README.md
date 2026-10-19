# Plant Sync

Smart plant irrigation: ESP32 boards report soil moisture, humidity, temperature and light; the server
decides when to water, and a dashboard shows everything live.

Built with Next.js 16 (App Router), React 19, shadcn/ui + Tailwind 4, TanStack Query/Table/Form,
Prisma 7 and PostgreSQL. Scaffolded from
[next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) (MIT, see `LICENSE`).

## What's in it

| Area | Where |
| --- | --- |
| Device API for the ESP32 firmware | `src/app/api/store-sensor-values`, `src/app/api/irrigation-control/[deviceId]` |
| Sign-in (session cookie, bcrypt) | `src/lib/auth/*`, `src/features/auth`, `src/proxy.ts` |
| Dashboard, plants, devices, users | `src/features/*`, `src/app/dashboard/*` |
| Database schema and migrations | `prisma/` |
| ESP32 firmware | `esp32/` (repo root) |

### Device API (unchanged contract from the Laravel version)

- `POST /api/store-sensor-values` — JSON body `device_identifier_id`, `moisture_level`, `humidity`,
  `temperature`, `light_intensity`, optional `is_irrigating`. Returns `201` with the new reading id.
  The four sensor values may be `null` (or omitted): that means the sensor was not detected or is
  defective, and the dashboard shows it as "No signal".
- `GET /api/irrigation-control/{deviceId}` — returns the bare JSON value `true` when the pump should run
  (latest moisture <= the plant's minimum), otherwise `false`. If the latest moisture is `null`
  (sensor fault) it returns `false`, so the pump never runs without a reading.

Set `DEVICE_API_KEY` to require an `X-Device-Key` header on both. Leave it empty to keep the endpoints open.

### Roles and permissions

Access is role-based and managed in the app. **Roles** (sidebar → User Management) is a normal CRUD
screen: each role gets a grid of permissions, a row per resource (Plants, Devices, Users, Roles) and a
column per action (View, Create, Edit, Delete). They are stored on the role as `<action>:<resource>`
strings such as `create:plants`; the catalog is `src/lib/auth/rbac.ts`. Create, edit and delete
include view. A user can hold several roles on the **Users** form and gets the union of their
permissions. Menu items, buttons and every server action check these; a user with no `view:` for a
resource doesn't see its menu item and is sent back to the dashboard from its page.

Migrations create Admin, Operator and Viewer and carry existing users and roles over. Nothing can
remove the last user who may edit roles. Create an admin from the command line with
`bun run user:create "Name" email password [Role,Role]`.

### Device wiring

Each plant page shows its device's wiring: the board, the parts wired to it and live health, so a
sensor that returns `null` is flagged "Needs check / repair". The wiring is designed on the device
identifier's own **Create / Edit** page (Device Identifiers → New, or Edit on a row): pick a board, add
the soil sensor, BH1750, DHT22 and relay, and assign pins. It is saved with the device in
`device_identifiers.wiring`; boards and parts are defined in `src/lib/wiring`.

Roles, Users and Device Identifiers all create and edit on their own pages
(`/new` and `/<id>/edit`); users without the matching permission see the edit page read-only.

## Local development

```bash
bun install                      # also runs `prisma generate`
cp .env.example .env              # fill in DATABASE_URL and AUTH_SECRET (openssl rand -base64 48)
bunx prisma migrate deploy       # create the tables
bun run db:seed                  # demo login (admin@example.com / password), plants and readings
# or just your own login: bun run user:create "Your Name" you@example.com 'a-strong-password'
bun run dev                      # http://localhost:3000
```

Pointing `DATABASE_URL` at the database the Laravel app used works as-is: `0_init` is a baseline that is
already satisfied by the existing tables, and `1_timestamp_defaults` adds the `created_at`/`updated_at`
defaults Prisma needs. Existing users keep their passwords (Laravel's `$2y$` bcrypt hashes verify unchanged).

> Before running `1_timestamp_defaults` on real data, make sure no row has a NULL `created_at` or
> `updated_at`; the migration makes both columns NOT NULL.

On an existing database, mark the baseline as applied first:

```bash
bunx prisma migrate resolve --applied 0_init
bunx prisma migrate deploy
```

## Vercel

The `vercel-build` script runs `prisma migrate deploy` before `next build`, so the tables are created on
every deploy. Set `DATABASE_URL` and `AUTH_SECRET` for the **Production and Preview** environments (the
build needs them too); add `DIRECT_URL` if your host gives a separate non-pooled URL. The seeder then runs on every
build (idempotent; creates `admin@example.com` / `password` if missing). Set `SEED_DATABASE=false` to skip it.

## Docker

```bash
export AUTH_SECRET="$(openssl rand -base64 48)"
docker compose up -d --build
```

The app container also runs `prisma migrate deploy` on every start (so a fresh database gets its tables), and runs the seeder (set `SEED_DATABASE=false` to skip). `plant-sync-web.migrate` applies migrations first and exits, then the app starts on `${APP_PORT:-8000}`. The
ESP32 firmware calls `http://<host>/api/...`; either publish the app on port 80 (`APP_PORT=80`) or change
`apiUrl` in `esp32/esp32.cpp`.

## Scripts

`bun run dev | build | start | lint | typecheck | format`, `bun run user:create`, `bun run db:migrate`.

## Notes

- Timestamps are stored without a timezone and treated as UTC. "Irrigated today" counts UTC days.
- Sign-in has no rate limiting; put it behind a reverse proxy that does if it is exposed to the internet.
- Every server action calls `requireUser()`; they are public HTTP endpoints, so keep doing that when adding more.
