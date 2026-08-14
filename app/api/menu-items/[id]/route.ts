import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { menuItemSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import {
  findMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  setMenuItemAvailability,
  menuItemHasOrders,
} from '@/lib/repo/menu-items';
import { findCafeteriaById } from '@/lib/repo/cafeterias';

async function loadOwnedItem(id: string, userId: string) {
  const item = findMenuItemById(id);
  if (!item) return { item: null, owns: false };
  const cafeteria = findCafeteriaById(item.cafeteriaId);
  return { item, owns: cafeteria?.ownerId === userId };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER') return forbidden();

    const { item, owns } = await loadOwnedItem(id, session.sub);
    if (!item) return notFound('Menu item not found.');
    if (!owns) return forbidden("You can't edit another cafeteria's menu.");

    const body = await req.json();
    const parsed = menuItemSchema.partial().safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const updated = updateMenuItem(id, parsed.data);
    await logActivity(session.sub, 'Menu item updated', 'MenuItem', item.id);
    return ok({ item: updated });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER') return forbidden();

    const { item, owns } = await loadOwnedItem(id, session.sub);
    if (!item) return notFound('Menu item not found.');
    if (!owns) return forbidden("You can't delete another cafeteria's menu item.");

    if (menuItemHasOrders(id)) {
      // Preserve order history by hiding the item instead of deleting it.
      setMenuItemAvailability(id, false);
      await logActivity(session.sub, 'Menu item hidden (has order history)', 'MenuItem', item.id);
      return ok({ hidden: true });
    }

    deleteMenuItem(id);
    await logActivity(session.sub, 'Menu item deleted', 'MenuItem', item.id);
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
