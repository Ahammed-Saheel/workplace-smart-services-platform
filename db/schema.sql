-- Workplace Smart Cafeteria & Services Platform: database schema (SQLite)
--
-- Applied directly via better-sqlite3 in lib/db.ts on startup. It is idempotent;
-- every statement uses IF NOT EXISTS). SQLite is used for zero-config local
-- MVP development; the query layer in lib/repo/*.ts is the only place that
-- would need to change to target a different SQL database in production.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Identity & workplace
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Workplace (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  description TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  createdAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS User (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  passwordHash     TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('EMPLOYEE','CAFETERIA_OWNER','CHARGING_OWNER','ADMIN')),
  workplaceId      TEXT REFERENCES Workplace(id),
  active           INTEGER NOT NULL DEFAULT 1,
  resetToken       TEXT,
  resetTokenExpiry TEXT,
  createdAt        TEXT NOT NULL,
  updatedAt        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_workplace ON User(workplaceId);

-- ---------------------------------------------------------------------------
-- Cafeteria & menu
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Cafeteria (
  id          TEXT PRIMARY KEY,
  workplaceId TEXT NOT NULL REFERENCES Workplace(id),
  ownerId     TEXT NOT NULL REFERENCES User(id),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cafeteria_workplace ON Cafeteria(workplaceId);
CREATE INDEX IF NOT EXISTS idx_cafeteria_owner ON Cafeteria(ownerId);

CREATE TABLE IF NOT EXISTS MenuItem (
  id              TEXT PRIMARY KEY,
  cafeteriaId     TEXT NOT NULL REFERENCES Cafeteria(id),
  name            TEXT NOT NULL,
  description     TEXT,
  price           REAL NOT NULL,
  category        TEXT NOT NULL,
  image           TEXT,
  preparationTime INTEGER NOT NULL DEFAULT 10,
  available       INTEGER NOT NULL DEFAULT 1,
  createdAt       TEXT NOT NULL,
  updatedAt       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_menuitem_cafeteria ON MenuItem(cafeteriaId);
CREATE INDEX IF NOT EXISTS idx_menuitem_category ON MenuItem(category);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Order" (
  id          TEXT PRIMARY KEY,
  customerId  TEXT NOT NULL REFERENCES User(id),
  cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id),
  pickupTime  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PLACED'
              CHECK (status IN ('PLACED','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED')),
  total       REAL NOT NULL,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_customer ON "Order"(customerId);
CREATE INDEX IF NOT EXISTS idx_order_cafeteria ON "Order"(cafeteriaId);
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);

CREATE TABLE IF NOT EXISTS OrderItem (
  id         TEXT PRIMARY KEY,
  orderId    TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  menuItemId TEXT NOT NULL REFERENCES MenuItem(id),
  name       TEXT NOT NULL,
  quantity   INTEGER NOT NULL,
  price      REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON OrderItem(orderId);

-- ---------------------------------------------------------------------------
-- Food requests
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS FoodRequest (
  id          TEXT PRIMARY KEY,
  customerId  TEXT NOT NULL REFERENCES User(id),
  cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'SUBMITTED'
              CHECK (status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','ADDED_TO_MENU','REJECTED')),
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_foodrequest_customer ON FoodRequest(customerId);
CREATE INDEX IF NOT EXISTS idx_foodrequest_cafeteria ON FoodRequest(cafeteriaId);

-- ---------------------------------------------------------------------------
-- Polls
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Poll (
  id          TEXT PRIMARY KEY,
  cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id),
  title       TEXT NOT NULL,
  description TEXT,
  startDate   TEXT NOT NULL,
  endDate     TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  createdAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_poll_cafeteria ON Poll(cafeteriaId);

CREATE TABLE IF NOT EXISTS PollOption (
  id     TEXT PRIMARY KEY,
  pollId TEXT NOT NULL REFERENCES Poll(id) ON DELETE CASCADE,
  option TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_polloption_poll ON PollOption(pollId);

CREATE TABLE IF NOT EXISTS PollVote (
  id        TEXT PRIMARY KEY,
  pollId    TEXT NOT NULL REFERENCES Poll(id) ON DELETE CASCADE,
  optionId  TEXT NOT NULL REFERENCES PollOption(id) ON DELETE CASCADE,
  userId    TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  UNIQUE (pollId, userId)
);
CREATE INDEX IF NOT EXISTS idx_pollvote_option ON PollVote(optionId);

-- ---------------------------------------------------------------------------
-- EV charging
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ChargingStation (
  id          TEXT PRIMARY KEY,
  workplaceId TEXT NOT NULL REFERENCES Workplace(id),
  ownerId     TEXT NOT NULL REFERENCES User(id),
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_workplace ON ChargingStation(workplaceId);
CREATE INDEX IF NOT EXISTS idx_station_owner ON ChargingStation(ownerId);

CREATE TABLE IF NOT EXISTS Charger (
  id                  TEXT PRIMARY KEY,
  stationId           TEXT NOT NULL REFERENCES ChargingStation(id),
  name                TEXT NOT NULL,
  connectorType       TEXT NOT NULL,
  power               REAL NOT NULL,
  price               REAL NOT NULL,
  status              TEXT NOT NULL DEFAULT 'AVAILABLE'
                      CHECK (status IN ('AVAILABLE','OCCUPIED','RESERVED','OFFLINE')),
  operatingHoursStart TEXT NOT NULL DEFAULT '08:00',
  operatingHoursEnd   TEXT NOT NULL DEFAULT '20:00',
  createdAt           TEXT NOT NULL,
  updatedAt           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_charger_station ON Charger(stationId);

CREATE TABLE IF NOT EXISTS ChargingReservation (
  id            TEXT PRIMARY KEY,
  chargerId     TEXT NOT NULL REFERENCES Charger(id),
  userId        TEXT NOT NULL REFERENCES User(id),
  date          TEXT NOT NULL,
  startTime     TEXT NOT NULL,
  endTime       TEXT NOT NULL,
  amount        REAL NOT NULL,
  paymentStatus TEXT NOT NULL DEFAULT 'PAID' CHECK (paymentStatus IN ('PENDING','PAID','REFUNDED')),
  status        TEXT NOT NULL DEFAULT 'UPCOMING'
                CHECK (status IN ('UPCOMING','ACTIVE','COMPLETED','CANCELLED')),
  createdAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reservation_charger ON ChargingReservation(chargerId);
CREATE INDEX IF NOT EXISTS idx_reservation_user ON ChargingReservation(userId);

-- ---------------------------------------------------------------------------
-- Notifications & audit log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Notification (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES User(id),
  title     TEXT NOT NULL,
  message   TEXT NOT NULL,
  type      TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('ORDER','CHARGING','REQUEST','POLL','SYSTEM')),
  read      INTEGER NOT NULL DEFAULT 0,
  link      TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON Notification(userId, read);

CREATE TABLE IF NOT EXISTS AuditLog (
  id        TEXT PRIMARY KEY,
  userId    TEXT REFERENCES User(id),
  action    TEXT NOT NULL,
  entity    TEXT NOT NULL,
  entityId  TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auditlog_user ON AuditLog(userId);
CREATE INDEX IF NOT EXISTS idx_auditlog_timestamp ON AuditLog(timestamp);
