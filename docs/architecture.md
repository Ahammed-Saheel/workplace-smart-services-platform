# Architecture

## Request flow

- **Reads on page load** go straight from a Server Component to `lib/repo/*.ts`
  (no API round-trip). For example, `app/employee/dashboard/page.tsx` queries the
  repo layer directly during server render.
- **Mutations and interactive client-side fetches** (placing an order, voting,
  reserving a charger, toggling availability) go through `app/api/**/route.ts`,
  which independently re-checks the session and role before touching the
  database. The frontend is never trusted for authorization.
- **`proxy.ts`** redirects unauthenticated or wrong-role users away from
  a role's page tree (e.g. `/admin/*`). This is a UX convenience layer only.
  every API route re-verifies authorization itself, so a user can't bypass
  checks by calling the API directly.

## Auth

Sessions are a signed JWT (via `jose`, edge-compatible) stored in an httpOnly,
`SameSite=Lax` cookie. Passwords are hashed with bcrypt. There's no separate
session table. The JWT itself carries `{ sub, role, name, email }` and is
verified on every request.

## Data layer

`better-sqlite3` gives synchronous, in-process SQLite access, with no connection
pool, no async overhead, no native engine binary to download (see the README
for why this replaced Prisma). `lib/db.ts` opens a singleton connection and
applies `db/schema.sql` idempotently on first use. `lib/repo/*.ts` holds one
module per entity with typed query functions; nothing outside that folder
writes raw SQL.

## Business logic

Rules that need to be independently correct, including order totals, order status
transitions, EV reservation overlap detection, and pickup-time windows, live in
`lib/business/*.ts` as small pure functions with no I/O, so they're trivially
unit tested (see `tests/`) and are the single source of truth used by both
the API routes and (where relevant) the UI.

## Rendering strategy

Every authenticated route is dynamically rendered (`export const dynamic =
'force-dynamic'` where needed) since content is always per-user. The public
landing and auth pages are static.
