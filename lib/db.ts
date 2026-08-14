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
