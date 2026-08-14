# Workplace Smart Cafeteria & Services Platform

Order food before you leave your desk, skip cafeteria queues, and reserve your
EV charging slot in advance. It is a services platform built specifically for
office campuses, not a public food-delivery app.

## Product

A single internal platform combining smart cafeteria ordering, live menu
management, food polls, dish requests, and EV charging slot reservations.
It is based on common office-campus routines, where people may spend time
checking food availability or waiting for an EV charging slot.

## Problem

Employees can't see what's available before leaving their desk, often find
food sold out on arrival, and lose 20–30 minutes of their break standing in
queues. EV charging stations show live status but offer no way to book a
slot ahead of time. Cafeteria staff repeatedly field the same availability
questions instead of running the counter.

## Features

**Employee**
- Register / login / logout, forgot & reset password, change password, edit profile
- Browse live menus across cafeterias, search & filter, see prep time and availability
- Cart, pickup time selection, order placement, live order tracking (PLACED → ACCEPTED → PREPARING → READY → COMPLETED, or CANCELLED)
- In-app notifications with unread count, mark read / mark all read
- Submit dish requests and track their status
- Vote in food polls and see live results
- Browse EV chargers, reserve a slot with a simulated advance payment, view/cancel reservations

**Cafeteria Owner**
- Live dashboard: today's revenue, order funnel, popular items, unavailable items
- Full menu CRUD with instant availability toggling
- Order queue with guided status transitions and cancellation
- Poll creation with results visualization, close/reopen
- Dish request review and status updates
- Analytics: revenue trend, order status mix, best sellers

**EV Charging Operator**
- Dashboard: stations, chargers, today's reservations, today's revenue
- Station CRUD, charger CRUD (connector type, power, price, operating hours, status)
- Reservation table across all stations
- Analytics: revenue trend, charger utilization

**Platform Admin**
- Platform-wide stats: users, cafeterias, stations, orders, reservations, revenue
- User management: search, filter by role, activate/deactivate
- Cafeteria & charging station oversight (activate/deactivate)
- Full order & reservation visibility
- Audit activity log
- Settings overview

**Cross-cutting**
- Server-side authorization on every API route (never trusts the frontend)
- Server-side validation: item availability, pickup time window, cafeteria open/closed,
  charger offline, and **overlap-safe EV reservations** enforced both in application logic
  and via a database `UNIQUE`/query check
- Duplicate poll votes blocked by a database unique constraint
- Loading, empty, and error states on every major screen
- Fully responsive: bottom quick-nav on mobile for employees, sidebar on desktop

## Architecture

```
Browser
  │
  ▼
Next.js App Router
  ├─ Server Components  → read data directly via lib/repo/*.ts (fast, no API round-trip)
  ├─ Client Components  → interactive forms/actions call app/api/**/route.ts
  └─ middleware.ts      → role-based route protection (redirects, not the only guard)
       │
       ▼
  app/api/**/route.ts   → re-checks session + role + resource ownership server-side
       │
       ▼
  lib/repo/*.ts          → typed query functions (better-sqlite3, synchronous)
       │
       ▼
  db/schema.sql → dev.db (SQLite file, created & migrated automatically on first run)
```

## Tech Stack

- **Next.js 16.3** (App Router) + **TypeScript** + **React 19.2**
- **Tailwind CSS**: custom design system (ink / paper / amber / teal), no default template look
- **better-sqlite3**: direct, synchronous SQLite driver (see note below on why not Prisma)
- **jose**: edge-compatible JWT sessions in an httpOnly cookie
- **bcryptjs**: password hashing
- **zod**: request validation
- **recharts**: analytics charts
- **lucide-react**: icons
- **vitest**: unit and integration tests

### Why better-sqlite3 instead of Prisma?

Prisma's CLI needs to download platform-specific engine binaries from
`binaries.prisma.sh` on `generate`/`migrate`. In network-restricted build
environments (locked-down CI runners, offline machines, corporate proxies)
that host is often unreachable and the install silently breaks. Since
**reliability and easy local setup** are the top priorities for this MVP, the
data layer uses `better-sqlite3` directly with a hand-written, fully
version-controlled schema (`db/schema.sql`) and a small typed repository
layer (`lib/repo/*.ts`). It's zero-download, works entirely offline after
`npm install`, and is just as type-safe. The full relational schema is also
documented in `docs/database.md`.

## Folder Structure

```
app/                    Routes (pages + API), grouped by role
  (marketing)/           Public landing page
  login/ register/ forgot-password/ reset-password/ unauthorized/
  employee/               Employee dashboard, cafeteria, cart, orders, charging,
                           reservations, requests, polls, notifications, profile
  cafeteria-owner/        Dashboard, orders, menu, polls, requests, analytics, profile
  charging-owner/         Dashboard, stations, chargers, reservations, analytics, profile
  admin/                  Dashboard, users, cafeterias, charging, orders,
                           reservations, activity, settings
  api/                    All REST endpoints (see docs/api.md)
components/             UI kit (components/ui), layout shell, role-specific widgets
lib/
  repo/                  Typed database query functions (one file per entity)
  business/               Pure, unit-tested business rules (totals, transitions, overlap)
  auth.ts, db.ts, validation.ts, api-response.ts, notifications.ts, utils.ts
db/
  schema.sql              Full SQL schema (source of truth)
  seed.ts                 Realistic demo data
tests/                  Vitest unit & integration tests
docs/                   architecture / database / api / deployment / demo notes
```

## Installation

```bash
npm install
cp .env.example .env
npm run db:seed     # creates dev.db, applies the schema, and loads demo data
npm run dev
```

Open http://localhost:3000.

## Environment Variables

See `.env.example`:

- `DATABASE_URL`: SQLite file path, e.g. `file:./dev.db`. No server or credentials needed.
- `JWT_SECRET`: secret used to sign session cookies. Generate one with `openssl rand -base64 32` for anything beyond local demo use.
- `NEXT_PUBLIC_APP_URL`: base URL, used for building a couple of internal links.

## Database

No separate database server is needed. SQLite runs as a local file. The schema is
applied automatically and idempotently the first time the app (or the seed
script) opens the database connection, so there is no separate "migrate"
step to remember.

```bash
npm run db:seed     # wipes and reloads realistic demo data (safe to re-run anytime)
```

## Demo Accounts

Every account uses the same password: **`Demo@1234`**

| Role | Email |
| --- | --- |
| Employee | `employee@demo.com` |
| Cafeteria Owner (Cyber Café) | `cafeteria@demo.com` |
| Cafeteria Owner (Tech Bites) | `techbites@demo.com` |
| Charging Operator | `charging@demo.com` |
| Platform Admin | `admin@demo.com` |

The login page has one-click buttons to fill in any of these emails.

## Running Locally

```bash
npm run dev          # start the dev server on :3000
```

## Testing

```bash
npm run test         # 40 tests: business logic, auth, authorization, repo/DB integration
```

Covers: registration/login/invalid-login, order creation & total calculation,
order status transitions, unavailable-item rejection, poll creation & voting
& duplicate-vote rejection, EV reservation creation & overlap rejection &
offline-charger rejection, and role/ownership authorization rules (employee
blocked from admin routes, owners blocked from managing each other's
cafeterias/stations).

## Production Build

```bash
npm run build
npm run start
```

## Deployment

See `docs/deployment.md` for a practical walkthrough (Vercel, a VPS, or Docker).
In short: set `DATABASE_URL` to a writable path and `JWT_SECRET` to a strong
secret, run `npm run build`, then `npm run start`. For anything beyond a demo,
swap SQLite for a hosted Postgres/MySQL by rewriting `lib/repo/*.ts`. The
rest of the app is unaware of the storage engine.

## Screenshots

Run the app locally and visit `/` (landing page), `/login` (use the quick-fill
demo buttons), then each role's `/…/dashboard`; that's the fastest way to see
the real product. (No static screenshots are checked in; capture your own with
your OS's screenshot tool if you need them for a slide deck.)

## Known Limitations

- Single demo workplace/campus (multi-tenant workplace switching is out of scope for this MVP)
- No outbound email: password reset shows the reset link directly on-screen instead of emailing it, clearly labeled as demo behavior
- EV charging payment is fully simulated; no real payment gateway is integrated by design
- SQLite is intentionally used for zero-config local development; swap the repo layer for a hosted database before any real multi-user production deployment
- No file/image upload for menu photos. The schema has an `image` field ready for it, but the UI does not expose an uploader in this MVP
- Real-time updates use polling (8–20s intervals), not WebSockets. This keeps the MVP reliable and simple
