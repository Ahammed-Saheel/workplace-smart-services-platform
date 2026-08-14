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

function createConnection(): Database.Database {
  const dbPath = resolveDbPath();
  const conn = new Database(dbPath);
  // Next.js may evaluate independent route modules in parallel. Let SQLite
  // wait for an initializing connection instead of failing with SQLITE_BUSY.
  conn.pragma('busy_timeout = 10000');
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');

  const schemaPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
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
