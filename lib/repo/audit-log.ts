import { db, newId, nowISO } from '@/lib/db';
import type { AuditLogRow } from '@/types/db';

export function logActivity(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string
) {
  db.prepare(
    'INSERT INTO AuditLog (id, userId, action, entity, entityId, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(newId('log'), userId, action, entity, entityId ?? null, nowISO());
}

export interface AuditLogWithUser extends AuditLogRow {
  userName: string | null;
  userRole: string | null;
}

export function listActivity(limit = 50): AuditLogWithUser[] {
  return db
    .prepare(
      `SELECT a.*, u.name as userName, u.role as userRole
       FROM AuditLog a LEFT JOIN User u ON u.id = a.userId
       ORDER BY a.timestamp DESC LIMIT ?`
    )
    .all(limit) as AuditLogWithUser[];
}
