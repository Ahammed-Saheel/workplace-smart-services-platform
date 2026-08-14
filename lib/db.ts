import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const globalForDb = globalThis as unknown as { __db?: Database.Database };

function resolveDbPath(): string {
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const sourceDb = path.join(process.cwd(), 'dev.db');
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, tmpDbPath);
      }
    }
    return tmpDbPath;
  }
  const url = process.env.DATABASE_URL ?? 'file:./dev.db';
  const filePath = url.replace(/^file:/, '');
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
}

import bcrypt from 'bcryptjs';

function ensureSeeded(conn: Database.Database) {
  try {
    const userCount =
      (conn.prepare('SELECT COUNT(*) as count FROM User').get() as { count: number })
        ?.count ?? 0;
    if (userCount > 0) return;

    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync('Demo@1234', 10);
    const workplaceId = 'wp_demo_workplace';

    conn.exec('BEGIN IMMEDIATE');

    conn
      .prepare(
        `INSERT INTO Workplace (id, name, location, description, active, createdAt) VALUES (?, ?, ?, ?, 1, ?)`
      )
      .run(
        workplaceId,
        'Prototype Office Campus',
        'Innovation District, Tech City',
        'A technology park campus with two cafeterias and an EV charging zone.',
        now
      );

    const insertUser = conn.prepare(
      `INSERT INTO User (id, workplaceId, role, name, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    insertUser.run('usr_admin', workplaceId, 'ADMIN', 'Lewis Sr', 'admin@demo.com', passwordHash, now, now);
    insertUser.run('usr_caf1', workplaceId, 'CAFETERIA_OWNER', 'Robert Jr', 'cafeteria@demo.com', passwordHash, now, now);
    insertUser.run('usr_caf2', workplaceId, 'CAFETERIA_OWNER', 'Tommy Jr', 'techbites@demo.com', passwordHash, now, now);
    insertUser.run('usr_chg', workplaceId, 'CHARGING_OWNER', 'Anne Jr', 'charging@demo.com', passwordHash, now, now);
    insertUser.run('usr_emp1', workplaceId, 'EMPLOYEE', 'John Jr', 'employee@demo.com', passwordHash, now, now);
    insertUser.run('usr_emp2', workplaceId, 'EMPLOYEE', 'Holland Jr', 'holland@demo.com', passwordHash, now, now);
    insertUser.run('usr_emp3', workplaceId, 'EMPLOYEE', 'Emma Jr', 'emma@demo.com', passwordHash, now, now);

    const cyberCafeId = 'caf_cyber_cafe';
    const techBitesId = 'caf_tech_bites';

    conn
      .prepare(
        `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
      )
      .run(cyberCafeId, workplaceId, 'usr_caf1', 'Cyber Café', 'The main campus cafeteria.', now, now);

    conn
      .prepare(
        `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
      )
      .run(techBitesId, workplaceId, 'usr_caf2', 'Tech Bites', 'Quick bites and continental favorites.', now, now);

    const insertMenu = conn.prepare(
      `INSERT INTO MenuItem (id, cafeteriaId, name, description, price, category, preparationTime, available, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    );

    insertMenu.run('menu_biryani', cyberCafeId, 'Chicken Biryani', 'Fragrant basmati rice with tender chicken.', 150, 'Lunch', 20, now, now);
    insertMenu.run('menu_coffee', cyberCafeId, 'Filter Coffee', 'South Indian filter coffee, strong and frothy.', 20, 'Beverages', 3, now, now);
    insertMenu.run('menu_shawarma', techBitesId, 'Shawarma', 'Grilled chicken shawarma wrap.', 110, 'Specials', 12, now, now);

    const stationId = 'st_main_zone';
    conn
      .prepare(
        `INSERT INTO ChargingStation (id, workplaceId, ownerId, name, location, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(stationId, workplaceId, 'usr_chg', 'Main EV Charging Zone', 'Basement parking, Block C', now, now);

    conn
      .prepare(
        `INSERT INTO Charger (id, stationId, name, connectorType, power, price, operatingHoursStart, operatingHoursEnd, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)`
      )
      .run('chg_a1', stationId, 'Charger A1', 'Type 2', 22, 50, '08:00', '20:00', now, now);

    conn.exec('COMMIT');
  } catch (error) {
    try {
      conn.exec('ROLLBACK');
    } catch {}
    console.error('Auto-seed failed:', error);
  }
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS Workplace (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, description TEXT, active INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('EMPLOYEE','CAFETERIA_OWNER','CHARGING_OWNER','ADMIN')), workplaceId TEXT REFERENCES Workplace(id), active INTEGER NOT NULL DEFAULT 1, resetToken TEXT, resetTokenExpiry TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_workplace ON User(workplaceId);
CREATE TABLE IF NOT EXISTS Cafeteria (
  id TEXT PRIMARY KEY, workplaceId TEXT NOT NULL REFERENCES Workplace(id), ownerId TEXT NOT NULL REFERENCES User(id), name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cafeteria_workplace ON Cafeteria(workplaceId);
CREATE INDEX IF NOT EXISTS idx_cafeteria_owner ON Cafeteria(ownerId);
CREATE TABLE IF NOT EXISTS MenuItem (
  id TEXT PRIMARY KEY, cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id), name TEXT NOT NULL, description TEXT, price REAL NOT NULL, category TEXT NOT NULL, image TEXT, preparationTime INTEGER NOT NULL DEFAULT 10, available INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_menuitem_cafeteria ON MenuItem(cafeteriaId);
CREATE INDEX IF NOT EXISTS idx_menuitem_category ON MenuItem(category);
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY, customerId TEXT NOT NULL REFERENCES User(id), cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id), pickupTime TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PLACED' CHECK (status IN ('PLACED','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED')), total REAL NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_customer ON "Order"(customerId);
CREATE INDEX IF NOT EXISTS idx_order_cafeteria ON "Order"(cafeteriaId);
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
CREATE TABLE IF NOT EXISTS OrderItem (
  id TEXT PRIMARY KEY, orderId TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE, menuItemId TEXT NOT NULL REFERENCES MenuItem(id), name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON OrderItem(orderId);
CREATE TABLE IF NOT EXISTS FoodRequest (
  id TEXT PRIMARY KEY, customerId TEXT NOT NULL REFERENCES User(id), cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id), name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','ADDED_TO_MENU','REJECTED')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_foodrequest_customer ON FoodRequest(customerId);
CREATE INDEX IF NOT EXISTS idx_foodrequest_cafeteria ON FoodRequest(cafeteriaId);
CREATE TABLE IF NOT EXISTS Poll (
  id TEXT PRIMARY KEY, cafeteriaId TEXT NOT NULL REFERENCES Cafeteria(id), title TEXT NOT NULL, description TEXT, startDate TEXT NOT NULL, endDate TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_poll_cafeteria ON Poll(cafeteriaId);
CREATE TABLE IF NOT EXISTS PollOption (
  id TEXT PRIMARY KEY, pollId TEXT NOT NULL REFERENCES Poll(id) ON DELETE CASCADE, option TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_polloption_poll ON PollOption(pollId);
CREATE TABLE IF NOT EXISTS PollVote (
  id TEXT PRIMARY KEY, pollId TEXT NOT NULL REFERENCES Poll(id) ON DELETE CASCADE, optionId TEXT NOT NULL REFERENCES PollOption(id) ON DELETE CASCADE, userId TEXT NOT NULL REFERENCES User(id), createdAt TEXT NOT NULL, UNIQUE (pollId, userId)
);
CREATE INDEX IF NOT EXISTS idx_pollvote_option ON PollVote(optionId);
CREATE TABLE IF NOT EXISTS ChargingStation (
  id TEXT PRIMARY KEY, workplaceId TEXT NOT NULL REFERENCES Workplace(id), ownerId TEXT NOT NULL REFERENCES User(id), name TEXT NOT NULL, location TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_workplace ON ChargingStation(workplaceId);
CREATE INDEX IF NOT EXISTS idx_station_owner ON ChargingStation(ownerId);
CREATE TABLE IF NOT EXISTS Charger (
  id TEXT PRIMARY KEY, stationId TEXT NOT NULL REFERENCES ChargingStation(id), name TEXT NOT NULL, connectorType TEXT NOT NULL, power REAL NOT NULL, price REAL NOT NULL, status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','OCCUPIED','RESERVED','OFFLINE')), operatingHoursStart TEXT NOT NULL DEFAULT '08:00', operatingHoursEnd TEXT NOT NULL DEFAULT '20:00', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_charger_station ON Charger(stationId);
CREATE TABLE IF NOT EXISTS ChargingReservation (
  id TEXT PRIMARY KEY, chargerId TEXT NOT NULL REFERENCES Charger(id), userId TEXT NOT NULL REFERENCES User(id), date TEXT NOT NULL, startTime TEXT NOT NULL, endTime TEXT NOT NULL, amount REAL NOT NULL, paymentStatus TEXT NOT NULL DEFAULT 'PAID' CHECK (paymentStatus IN ('PENDING','PAID','REFUNDED')), status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','ACTIVE','COMPLETED','CANCELLED')), createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reservation_charger ON ChargingReservation(chargerId);
CREATE INDEX IF NOT EXISTS idx_reservation_user ON ChargingReservation(userId);
CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id), title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('ORDER','CHARGING','REQUEST','POLL','SYSTEM')), read INTEGER NOT NULL DEFAULT 0, link TEXT, createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON Notification(userId, read);
CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY, userId TEXT REFERENCES User(id), action TEXT NOT NULL, entity TEXT NOT NULL, entityId TEXT, timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auditlog_user ON AuditLog(userId);
CREATE INDEX IF NOT EXISTS idx_auditlog_timestamp ON AuditLog(timestamp);
`;

function createConnection(): Database.Database {
  const dbPath = resolveDbPath();
  const conn = new Database(dbPath);
  // Next.js may evaluate independent route modules in parallel. Let SQLite
  // wait for an initializing connection instead of failing with SQLITE_BUSY.
  conn.pragma('busy_timeout = 10000');
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');

  let schema = SCHEMA_SQL;
  try {
    const schemaPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      schema = fs.readFileSync(schemaPath, 'utf-8');
    }
  } catch {}

  conn.exec('BEGIN IMMEDIATE');
  try {
    conn.exec(schema);
    conn.exec('COMMIT');
  } catch (error) {
    conn.exec('ROLLBACK');
    throw error;
  }

  ensureSeeded(conn);

  return conn;
}

export const db = globalForDb.__db ?? createConnection();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__db = db;
}

// --- Shared helpers ---------------------------------------------------------

/** Generates a short, URL-safe unique id (a cuid-style substitute). */
export function newId(prefix = ''): string {
  const raw = randomUUID().replace(/-/g, '');
  return prefix ? `${prefix}_${raw}` : raw;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** SQLite stores booleans as 0/1; these convert at the read/write boundary. */
export function toBool(value: number | boolean | null | undefined): boolean {
  return value === 1 || value === true;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
