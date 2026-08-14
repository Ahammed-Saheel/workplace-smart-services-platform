import { db, nowISO } from '@/lib/db';
import type { CafeteriaRow, CafeteriaStatus } from '@/types/db';

export interface CafeteriaWithMeta extends CafeteriaRow {
  ownerName: string;
  ownerEmail: string;
  workplaceName: string;
  menuItemCount: number;
  orderCount: number;
}

export function listCafeterias(): CafeteriaWithMeta[] {
  return db
    .prepare(
      `SELECT c.*, u.name as ownerName, u.email as ownerEmail, w.name as workplaceName,
              (SELECT COUNT(*) FROM MenuItem m WHERE m.cafeteriaId = c.id) as menuItemCount,
              (SELECT COUNT(*) FROM "Order" o WHERE o.cafeteriaId = c.id) as orderCount
       FROM Cafeteria c
       JOIN User u ON u.id = c.ownerId
       JOIN Workplace w ON w.id = c.workplaceId
       ORDER BY c.name ASC`
    )
    .all() as CafeteriaWithMeta[];
}

export function findCafeteriaById(id: string): CafeteriaRow | undefined {
  return db.prepare('SELECT * FROM Cafeteria WHERE id = ?').get(id) as CafeteriaRow | undefined;
}

export function findCafeteriaByOwnerId(ownerId: string): CafeteriaRow | undefined {
  return db.prepare('SELECT * FROM Cafeteria WHERE ownerId = ?').get(ownerId) as
    | CafeteriaRow
    | undefined;
}

export function updateCafeteriaStatus(id: string, status: CafeteriaStatus) {
  db.prepare('UPDATE Cafeteria SET status = ?, updatedAt = ? WHERE id = ?').run(
    status,
    nowISO(),
    id
  );
  return findCafeteriaById(id);
}

export function countCafeterias(): number {
  return (db.prepare('SELECT COUNT(*) as c FROM Cafeteria').get() as { c: number }).c;
}
