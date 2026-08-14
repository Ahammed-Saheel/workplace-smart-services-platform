import { db, newId, nowISO } from '@/lib/db';
import type { OrderRow, OrderItemRow, OrderStatus } from '@/types/db';

export interface OrderWithItems extends OrderRow {
  items: OrderItemRow[];
  customerName?: string;
  customerEmail?: string;
  cafeteriaName?: string;
}

function attachItems(order: OrderRow): OrderWithItems {
  const items = db
    .prepare('SELECT * FROM OrderItem WHERE orderId = ?')
    .all(order.id) as OrderItemRow[];
  return { ...order, items };
}

export function listOrders(filters: {
  customerId?: string;
  cafeteriaId?: string;
  status?: string;
}): OrderWithItems[] {
  let sql = `
    SELECT o.*, u.name as customerName, u.email as customerEmail, c.name as cafeteriaName
    FROM "Order" o
    JOIN User u ON u.id = o.customerId
    JOIN Cafeteria c ON c.id = o.cafeteriaId
    WHERE 1=1`;
  const params: Record<string, unknown> = {};

  if (filters.customerId) {
    sql += ' AND o.customerId = @customerId';
    params.customerId = filters.customerId;
  }
  if (filters.cafeteriaId) {
    sql += ' AND o.cafeteriaId = @cafeteriaId';
    params.cafeteriaId = filters.cafeteriaId;
  }
  if (filters.status) {
    sql += ' AND o.status = @status';
    params.status = filters.status;
  }
  sql += ' ORDER BY o.createdAt DESC LIMIT 100';

  const orders = db.prepare(sql).all(params) as OrderRow[];
  return orders.map(attachItems);
}

export function findOrderById(id: string): OrderWithItems | undefined {
  const order = db.prepare('SELECT * FROM "Order" WHERE id = ?').get(id) as OrderRow | undefined;
  if (!order) return undefined;
  return attachItems(order);
}

export function createOrder(input: {
  customerId: string;
  cafeteriaId: string;
  pickupTime: string;
  total: number;
  lines: { menuItemId: string; name: string; quantity: number; price: number }[];
}): OrderWithItems {
  const id = newId('order');
  const now = nowISO();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO "Order" (id, customerId, cafeteriaId, pickupTime, status, total, createdAt, updatedAt)
       VALUES (@id, @customerId, @cafeteriaId, @pickupTime, 'PLACED', @total, @now, @now)`
    ).run({
      id,
      customerId: input.customerId,
      cafeteriaId: input.cafeteriaId,
      pickupTime: input.pickupTime,
      total: input.total,
      now,
    });

    const insertItem = db.prepare(
      `INSERT INTO OrderItem (id, orderId, menuItemId, name, quantity, price)
       VALUES (@id, @orderId, @menuItemId, @name, @quantity, @price)`
    );
    for (const line of input.lines) {
      insertItem.run({ id: newId('oi'), orderId: id, ...line });
    }
  });
  tx();

  return findOrderById(id)!;
}

export function updateOrderStatus(id: string, status: OrderStatus): OrderWithItems {
  db.prepare('UPDATE "Order" SET status = ?, updatedAt = ? WHERE id = ?').run(
    status,
    nowISO(),
    id
  );
  return findOrderById(id)!;
}

export function countOrders(): number {
  return (db.prepare('SELECT COUNT(*) as c FROM "Order"').get() as { c: number }).c;
}

export function sumOrderRevenue(): number {
  const row = db
    .prepare(`SELECT COALESCE(SUM(total), 0) as s FROM "Order" WHERE status != 'CANCELLED'`)
    .get() as { s: number };
  return row.s;
}

export function ordersForCafeteriaToday(cafeteriaId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = db
    .prepare(
      `SELECT * FROM "Order" WHERE cafeteriaId = ? AND createdAt >= ? ORDER BY createdAt DESC`
    )
    .all(cafeteriaId, startOfDay.toISOString()) as OrderRow[];
  return rows.map(attachItems);
}

export function popularMenuItems(cafeteriaId: string, limit = 5) {
  return db
    .prepare(
      `SELECT oi.menuItemId, oi.name, SUM(oi.quantity) as totalQty, COUNT(DISTINCT oi.orderId) as orderCount
       FROM OrderItem oi
       JOIN "Order" o ON o.id = oi.orderId
       WHERE o.cafeteriaId = ? AND o.status != 'CANCELLED'
       GROUP BY oi.menuItemId, oi.name
       ORDER BY totalQty DESC
       LIMIT ?`
    )
    .all(cafeteriaId, limit) as { menuItemId: string; name: string; totalQty: number; orderCount: number }[];
}

export function orderStatusDistribution(cafeteriaId: string) {
  return db
    .prepare(
      `SELECT status, COUNT(*) as count FROM "Order" WHERE cafeteriaId = ? GROUP BY status`
    )
    .all(cafeteriaId) as { status: string; count: number }[];
}

export function revenueByDay(cafeteriaId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = db
    .prepare(
      `SELECT substr(createdAt, 1, 10) as day, SUM(total) as revenue, COUNT(*) as orders
       FROM "Order"
       WHERE cafeteriaId = ? AND status != 'CANCELLED' AND createdAt >= ?
       GROUP BY day
       ORDER BY day ASC`
    )
    .all(cafeteriaId, since.toISOString()) as { day: string; revenue: number; orders: number }[];

  // Fill in missing days with zero so the chart has a consistent x-axis.
  const map = new Map(rows.map((r) => [r.day, r]));
  const result: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(map.get(key) ?? { day: key, revenue: 0, orders: 0 });
  }
  return result;
}
