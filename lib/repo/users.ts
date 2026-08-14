import { db, newId, nowISO } from '@/lib/db';
import type { UserRow, PublicUser, Role } from '@/types/db';

const PUBLIC_COLUMNS = 'id, name, email, role, workplaceId, active, createdAt, updatedAt';

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM User WHERE email = ?').get(email) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM User WHERE id = ?').get(id) as UserRow | undefined;
}

export function findPublicUserById(id: string): PublicUser | undefined {
  return db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM User WHERE id = ?`)
    .get(id) as PublicUser | undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  workplaceId?: string | null;
}): UserRow {
  const id = newId('user');
  const now = nowISO();
  db.prepare(
    `INSERT INTO User (id, name, email, passwordHash, role, workplaceId, active, createdAt, updatedAt)
     VALUES (@id, @name, @email, @passwordHash, @role, @workplaceId, 1, @now, @now)`
  ).run({ id, workplaceId: input.workplaceId ?? null, now, ...input });
  return findUserById(id)!;
}

export function updateUserPassword(id: string, passwordHash: string) {
  db.prepare('UPDATE User SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(
    passwordHash,
    nowISO(),
    id
  );
}

export function updateUserProfile(id: string, name: string) {
  db.prepare('UPDATE User SET name = ?, updatedAt = ? WHERE id = ?').run(name, nowISO(), id);
}

export function setResetToken(id: string, token: string, expiry: string) {
  db.prepare('UPDATE User SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?').run(
    token,
    expiry,
    id
  );
}

export function findUserByResetToken(token: string): UserRow | undefined {
  return db.prepare('SELECT * FROM User WHERE resetToken = ?').get(token) as UserRow | undefined;
}

export function clearResetToken(id: string) {
  db.prepare('UPDATE User SET resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?').run(id);
}

export function listUsers(filters: { role?: string; search?: string; active?: boolean }) {
  let sql = `SELECT ${PUBLIC_COLUMNS} FROM User WHERE 1=1`;
  const params: Record<string, unknown> = {};

  if (filters.role && filters.role !== 'ALL') {
    sql += ' AND role = @role';
    params.role = filters.role;
  }
  if (typeof filters.active === 'boolean') {
    sql += ' AND active = @active';
    params.active = filters.active ? 1 : 0;
  }
  if (filters.search) {
    sql += ' AND (name LIKE @search OR email LIKE @search)';
    params.search = `%${filters.search}%`;
  }
  sql += ' ORDER BY createdAt DESC';

  return db.prepare(sql).all(params) as PublicUser[];
}

export function updateUserAdmin(
  id: string,
  data: { active?: boolean; role?: Role }
): PublicUser | undefined {
  if (typeof data.active === 'boolean') {
    db.prepare('UPDATE User SET active = ?, updatedAt = ? WHERE id = ?').run(
      data.active ? 1 : 0,
      nowISO(),
      id
    );
  }
  if (data.role) {
    db.prepare('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?').run(
      data.role,
      nowISO(),
      id
    );
  }
  return findPublicUserById(id);
}

export function countUsers(where?: { role?: Role; active?: boolean }): number {
  let sql = 'SELECT COUNT(*) as c FROM User WHERE 1=1';
  const params: Record<string, unknown> = {};
  if (where?.role) {
    sql += ' AND role = @role';
    params.role = where.role;
  }
  if (typeof where?.active === 'boolean') {
    sql += ' AND active = @active';
    params.active = where.active ? 1 : 0;
  }
  const row = db.prepare(sql).get(params) as { c: number };
  return row.c;
}

export function listEmployeeIds(): string[] {
  const rows = db
    .prepare("SELECT id FROM User WHERE role = 'EMPLOYEE' AND active = 1")
    .all() as { id: string }[];
  return rows.map((r) => r.id);
}
