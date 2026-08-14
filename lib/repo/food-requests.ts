import { db, newId, nowISO } from '@/lib/db';
import type { FoodRequestRow, FoodRequestStatus } from '@/types/db';

export interface FoodRequestWithMeta extends FoodRequestRow {
  customerName: string;
  cafeteriaName: string;
}

export function listFoodRequests(filters: {
  customerId?: string;
  cafeteriaId?: string;
}): FoodRequestWithMeta[] {
  let sql = `
    SELECT fr.*, u.name as customerName, c.name as cafeteriaName
    FROM FoodRequest fr
    JOIN User u ON u.id = fr.customerId
    JOIN Cafeteria c ON c.id = fr.cafeteriaId
    WHERE 1=1`;
  const params: Record<string, unknown> = {};
  if (filters.customerId) {
    sql += ' AND fr.customerId = @customerId';
    params.customerId = filters.customerId;
  }
  if (filters.cafeteriaId) {
    sql += ' AND fr.cafeteriaId = @cafeteriaId';
    params.cafeteriaId = filters.cafeteriaId;
  }
  sql += ' ORDER BY fr.createdAt DESC';
  return db.prepare(sql).all(params) as FoodRequestWithMeta[];
}

export function findFoodRequestById(id: string): FoodRequestRow | undefined {
  return db.prepare('SELECT * FROM FoodRequest WHERE id = ?').get(id) as
    | FoodRequestRow
    | undefined;
}

export function createFoodRequest(input: {
  customerId: string;
  cafeteriaId: string;
  name: string;
  description?: string | null;
}): FoodRequestRow {
  const id = newId('req');
  const now = nowISO();
  db.prepare(
    `INSERT INTO FoodRequest (id, customerId, cafeteriaId, name, description, status, createdAt, updatedAt)
     VALUES (@id, @customerId, @cafeteriaId, @name, @description, 'SUBMITTED', @now, @now)`
  ).run({ id, description: input.description ?? null, now, ...input });
  return findFoodRequestById(id)!;
}

export function updateFoodRequestStatus(
  id: string,
  status: FoodRequestStatus
): FoodRequestRow {
  db.prepare('UPDATE FoodRequest SET status = ?, updatedAt = ? WHERE id = ?').run(
    status,
    nowISO(),
    id
  );
  return findFoodRequestById(id)!;
}

export function countPendingFoodRequests(): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM FoodRequest WHERE status IN ('SUBMITTED','UNDER_REVIEW')`
      )
      .get() as { c: number }
  ).c;
}
