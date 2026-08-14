# Database

SQLite, accessed via `better-sqlite3`. Full DDL lives in `db/schema.sql` and
is applied automatically and idempotently on first connection. There is no
separate migration step to run.

## Entities

- **Workplace**: the single demo office campus
- **User**: `role` is one of `EMPLOYEE | CAFETERIA_OWNER | CHARGING_OWNER | ADMIN`
- **Cafeteria**: belongs to a Workplace and an owning User
- **MenuItem**: belongs to a Cafeteria
- **Order** / **OrderItem**: Order belongs to a customer + cafeteria; OrderItem
  lines are snapshotted (name/price at order time) so later menu edits don't
  rewrite order history
- **FoodRequest**: a customer's dish suggestion for a cafeteria
- **Poll** / **PollOption** / **PollVote**: `PollVote` has a `UNIQUE(pollId, userId)`
  constraint, which is the real, race-condition-proof guard against double voting
- **ChargingStation**: belongs to a Workplace and an owning User
- **Charger**: belongs to a ChargingStation; carries its own operating hours
- **ChargingReservation**: belongs to a Charger + User; overlap safety is
  enforced in `lib/business/charging.ts` (`validateReservationSlot`) and
  checked against all non-cancelled reservations for that charger/date before insert
- **Notification**: per-user, typed (`ORDER | CHARGING | REQUEST | POLL | SYSTEM`)
- **AuditLog**: a simple platform-wide activity trail for the admin view

## Indexes

Foreign key columns and frequently-filtered columns (`role`, `status`,
`userId, read`, `timestamp`) all have explicit indexes. See the bottom of
each table definition in `db/schema.sql`.

## Swapping to a hosted database

The repo layer (`lib/repo/*.ts`) is the only place that knows SQL is SQLite.
To move to Postgres/MySQL: point a different driver at `lib/db.ts`, adjust
any SQLite-specific syntax in `db/schema.sql` (mainly `TEXT` timestamp columns
and `INTEGER` booleans), and the rest of the application is unaffected.
