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

    const adminId = 'usr_admin';
    const caf1Id = 'usr_caf1';
    const caf2Id = 'usr_caf2';
    const chgId = 'usr_chg';
    const emp1Id = 'usr_emp1';
    const emp2Id = 'usr_emp2';
    const emp3Id = 'usr_emp3';

    insertUser.run(adminId, workplaceId, 'ADMIN', 'Lewis Sr', 'admin@demo.com', passwordHash, now, now);
    insertUser.run(caf1Id, workplaceId, 'CAFETERIA_OWNER', 'Robert Jr', 'cafeteria@demo.com', passwordHash, now, now);
    insertUser.run(caf2Id, workplaceId, 'CAFETERIA_OWNER', 'Tommy Jr', 'techbites@demo.com', passwordHash, now, now);
    insertUser.run(chgId, workplaceId, 'CHARGING_OWNER', 'Anne Jr', 'charging@demo.com', passwordHash, now, now);
    insertUser.run(emp1Id, workplaceId, 'EMPLOYEE', 'John Jr', 'employee@demo.com', passwordHash, now, now);
    insertUser.run(emp2Id, workplaceId, 'EMPLOYEE', 'Holland Jr', 'holland@demo.com', passwordHash, now, now);
    insertUser.run(emp3Id, workplaceId, 'EMPLOYEE', 'Emma Jr', 'emma@demo.com', passwordHash, now, now);

    const cyberCafeId = 'caf_cyber_cafe';
    const techBitesId = 'caf_tech_bites';

    conn
      .prepare(
        `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
      )
      .run(cyberCafeId, workplaceId, caf1Id, 'Cyber Café', 'The main campus cafeteria, known for its Chicken Biryani and filter coffee.', now, now);

    conn
      .prepare(
        `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
      )
      .run(techBitesId, workplaceId, caf2Id, 'Tech Bites', 'Quick bites and continental favorites for the second-floor crowd.', now, now);

    const cyberCafeItems = [
      { id: 'm1', name: 'Chicken Biryani', category: 'Lunch', price: 150, prep: 20, desc: 'Fragrant basmati rice with tender chicken and aromatic spices.' },
      { id: 'm2', name: 'Veg Meals', category: 'Lunch', price: 90, prep: 15, desc: 'Rice, sambar, rasam, two curries, and papadam.' },
      { id: 'm3', name: 'Chicken Fried Rice', category: 'Lunch', price: 130, prep: 15, desc: 'Wok-tossed rice with chicken, egg, and spring onion.' },
      { id: 'm4', name: 'Masala Dosa', category: 'Breakfast', price: 60, prep: 12, desc: 'Crisp rice crepe with spiced potato filling and chutney.' },
      { id: 'm5', name: 'Samosa', category: 'Snacks', price: 20, prep: 5, desc: 'Crispy pastry with spiced potato and pea filling.' },
      { id: 'm6', name: 'Tea', category: 'Beverages', price: 15, prep: 3, desc: 'Classic spiced milk tea.' },
      { id: 'm7', name: 'Filter Coffee', category: 'Beverages', price: 20, prep: 3, desc: 'South Indian filter coffee, strong and frothy.' },
      { id: 'm8', name: 'Fresh Lime Juice', category: 'Beverages', price: 40, prep: 4, desc: 'Refreshing lime juice, sweet or salted.' },
      { id: 'm9', name: 'Gulab Jamun', category: 'Desserts', price: 35, prep: 2, desc: 'Warm milk-solid dumplings in sugar syrup.' },
      { id: 'm10', name: 'Chicken 65', category: 'Snacks', price: 100, prep: 15, desc: "Spicy deep-fried chicken bites. Today's batch sold out fast.", available: 0 },
    ];

    const techBitesItems = [
      { id: 'm11', name: 'Shawarma', category: 'Specials', price: 110, prep: 12, desc: 'Grilled chicken shawarma wrap with garlic sauce.' },
      { id: 'm12', name: 'Pasta Arrabbiata', category: 'Lunch', price: 120, prep: 15, desc: 'Penne pasta in a spicy tomato sauce.' },
      { id: 'm13', name: 'Veg Sandwich', category: 'Snacks', price: 50, prep: 8, desc: 'Grilled sandwich with fresh vegetables and mint chutney.' },
      { id: 'm14', name: 'Chicken Roll', category: 'Snacks', price: 80, prep: 10, desc: 'Spiced chicken wrapped in a soft paratha.' },
      { id: 'm15', name: 'Cold Coffee', category: 'Beverages', price: 50, prep: 5, desc: 'Blended cold coffee topped with ice cream.' },
      { id: 'm16', name: 'Chocolate Brownie', category: 'Desserts', price: 45, prep: 3, desc: 'Fudgy brownie served warm.' },
    ];

    const insertMenu = conn.prepare(
      `INSERT INTO MenuItem (id, cafeteriaId, name, description, price, category, preparationTime, available, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const item of cyberCafeItems) {
      insertMenu.run(item.id, cyberCafeId, item.name, item.desc, item.price, item.category, item.prep, item.available ?? 1, now, now);
    }
    for (const item of techBitesItems) {
      insertMenu.run(item.id, techBitesId, item.name, item.desc, item.price, item.category, item.prep, 1, now, now);
    }

    const insertOrder = conn.prepare(
      `INSERT INTO "Order" (id, customerId, cafeteriaId, status, pickupTime, total, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertLine = conn.prepare(
      `INSERT INTO OrderItem (id, orderId, menuItemId, name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)`
    );

    insertOrder.run('ord_1', emp1Id, cyberCafeId, 'PREPARING', now, 170, now, now);
    insertLine.run('li_1', 'ord_1', 'm1', 'Chicken Biryani', 1, 150);
    insertLine.run('li_2', 'ord_1', 'm7', 'Filter Coffee', 1, 20);

    insertOrder.run('ord_2', emp1Id, cyberCafeId, 'COMPLETED', now, 90, now, now);
    insertLine.run('li_3', 'ord_2', 'm2', 'Veg Meals', 1, 90);

    insertOrder.run('ord_3', emp2Id, cyberCafeId, 'PLACED', now, 260, now, now);
    insertLine.run('li_4', 'ord_3', 'm3', 'Chicken Fried Rice', 2, 130);

    insertOrder.run('ord_4', emp3Id, techBitesId, 'READY', now, 110, now, now);
    insertLine.run('li_5', 'ord_4', 'm11', 'Shawarma', 1, 110);

    const insertReq = conn.prepare(
      `INSERT INTO FoodRequest (id, customerId, cafeteriaId, name, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertReq.run('req_1', emp1Id, cyberCafeId, 'Artisan Paratha with Steak Curry', 'Would love to see this on the weekend specials menu.', 'PLANNED', now, now);
    insertReq.run('req_2', emp2Id, cyberCafeId, 'Idiyappam with Egg Curry', 'A lighter breakfast option would be great.', 'SUBMITTED', now, now);
    insertReq.run('req_3', emp3Id, techBitesId, 'Falafel Wrap', 'Great vegan option', 'ADDED_TO_MENU', now, now);

    conn.prepare(
      `INSERT INTO Poll (id, cafeteriaId, title, description, startDate, endDate, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).run('poll_1', cyberCafeId, "What should tomorrow's special be?", 'Vote for the dish you want to see on tomorrow\'s Cyber Café specials board.', now, now, now);

    const insertOpt = conn.prepare(`INSERT INTO PollOption (id, pollId, option) VALUES (?, ?, ?)`);
    insertOpt.run('opt_1', 'poll_1', 'Chicken Biryani');
    insertOpt.run('opt_2', 'poll_1', 'Fried Rice');
    insertOpt.run('opt_3', 'poll_1', 'Shawarma');
    insertOpt.run('opt_4', 'poll_1', 'Pasta');

    const insertVote = conn.prepare(`INSERT INTO PollVote (id, pollId, optionId, userId, createdAt) VALUES (?, ?, ?, ?, ?)`);
    insertVote.run('v_1', 'poll_1', 'opt_1', emp2Id, now);
    insertVote.run('v_2', 'poll_1', 'opt_2', emp3Id, now);

    const stationId = 'st_main_zone';
    conn.prepare(
      `INSERT INTO ChargingStation (id, workplaceId, ownerId, name, location, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`
    ).run(stationId, workplaceId, chgId, 'Main EV Charging Zone', 'Basement parking, Block C', now, now);

    const insertCharger = conn.prepare(
      `INSERT INTO Charger (id, stationId, name, connectorType, power, price, operatingHoursStart, operatingHoursEnd, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertCharger.run('chg_a1', stationId, 'Charger A1', 'Type 2', 22, 50, '08:00', '20:00', 'AVAILABLE', now, now);
    insertCharger.run('chg_a2', stationId, 'Charger A2', 'CCS2', 50, 80, '08:00', '20:00', 'AVAILABLE', now, now);
    insertCharger.run('chg_b1', stationId, 'Charger B1', 'Type 2', 22, 50, '08:00', '20:00', 'OFFLINE', now, now);

    conn.prepare(
      `INSERT INTO ChargingReservation (id, chargerId, userId, date, startTime, endTime, amount, paymentStatus, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', 'UPCOMING', ?)`
    ).run('res_1', 'chg_a1', emp2Id, '2026-08-15', '10:00', '11:00', 50, now);

    const insertNotif = conn.prepare(
      `INSERT INTO Notification (id, userId, title, message, type, link, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    );
    insertNotif.run('notif_1', emp1Id, 'Welcome to the platform', "You're all set, John Jr. Browse today's menu or reserve an EV charging slot to get started.", 'SYSTEM', null, now);
    insertNotif.run('notif_2', emp1Id, 'Order #ORD_1 update', 'Your food is being prepared.', 'ORDER', '/employee/orders', now);
    insertNotif.run('notif_3', caf1Id, 'New order received', 'John Jr placed an order worth ₹170 for pickup at 1:30 PM.', 'ORDER', '/cafeteria-owner/orders', now);
    insertNotif.run('notif_4', chgId, 'New charging reservation', 'Holland Jr booked Charger A1.', 'CHARGING', '/charging-owner/reservations', now);

    const insertAudit = conn.prepare(
      `INSERT INTO AuditLog (id, userId, action, entity, entityId, timestamp) VALUES (?, ?, ?, ?, ?, ?)`
    );
    insertAudit.run('aud_1', adminId, 'Platform seeded with demo data', 'System', null, now);
    insertAudit.run('aud_2', emp1Id, 'User registered', 'User', emp1Id, now);

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
