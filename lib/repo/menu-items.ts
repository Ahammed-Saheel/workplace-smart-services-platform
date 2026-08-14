import { db, newId, nowISO } from '@/lib/db';
import type { MenuItemRow } from '@/types/db';

export function listMenuItems(filters: {
  cafeteriaId?: string;
  category?: string;
  search?: string;
}): MenuItemRow[] {
  let sql = 'SELECT * FROM MenuItem WHERE 1=1';
  const params: Record<string, unknown> = {};

  if (filters.cafeteriaId) {
    sql += ' AND cafeteriaId = @cafeteriaId';
    params.cafeteriaId = filters.cafeteriaId;
  }
  if (filters.category) {
    sql += ' AND category = @category';
    params.category = filters.category;
  }
  if (filters.search) {
    sql += ' AND name LIKE @search';
    params.search = `%${filters.search}%`;
  }
  sql += ' ORDER BY category ASC, name ASC';

  return db.prepare(sql).all(params) as MenuItemRow[];
}

export function findMenuItemById(id: string): MenuItemRow | undefined {
  return db.prepare('SELECT * FROM MenuItem WHERE id = ?').get(id) as MenuItemRow | undefined;
}

export function findMenuItemsByIds(ids: string[]): MenuItemRow[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM MenuItem WHERE id IN (${placeholders})`).all(...ids) as MenuItemRow[];
}

export function createMenuItem(input: {
  cafeteriaId: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image?: string | null;
  preparationTime: number;
  available?: boolean;
}): MenuItemRow {
  const id = newId('item');
  const now = nowISO();
  db.prepare(
    `INSERT INTO MenuItem (id, cafeteriaId, name, description, price, category, image, preparationTime, available, createdAt, updatedAt)
     VALUES (@id, @cafeteriaId, @name, @description, @price, @category, @image, @preparationTime, @available, @now, @now)`
  ).run({
    id,
    cafeteriaId: input.cafeteriaId,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    category: input.category,
    image: input.image ?? null,
    preparationTime: input.preparationTime,
    available: input.available === false ? 0 : 1,
    now,
  });
  return findMenuItemById(id)!;
}

export function updateMenuItem(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    category: string;
    image: string | null;
    preparationTime: number;
    available: boolean;
  }>
): MenuItemRow {
  const current = findMenuItemById(id)!;
  const merged = {
    name: data.name ?? current.name,
    description: data.description !== undefined ? data.description : current.description,
    price: data.price ?? current.price,
    category: data.category ?? current.category,
    image: data.image !== undefined ? data.image : current.image,
    preparationTime: data.preparationTime ?? current.preparationTime,
    available: data.available !== undefined ? (data.available ? 1 : 0) : current.available,
  };
  db.prepare(
    `UPDATE MenuItem SET name=@name, description=@description, price=@price, category=@category,
       image=@image, preparationTime=@preparationTime, available=@available, updatedAt=@updatedAt
     WHERE id=@id`
  ).run({ id, updatedAt: nowISO(), ...merged });
  return findMenuItemById(id)!;
}

export function deleteMenuItem(id: string) {
  db.prepare('DELETE FROM MenuItem WHERE id = ?').run(id);
}

export function setMenuItemAvailability(id: string, available: boolean) {
  db.prepare('UPDATE MenuItem SET available = ?, updatedAt = ? WHERE id = ?').run(
    available ? 1 : 0,
    nowISO(),
    id
  );
}

export function menuItemHasOrders(id: string): boolean {
  const row = db.prepare('SELECT 1 FROM OrderItem WHERE menuItemId = ? LIMIT 1').get(id);
  return !!row;
}
