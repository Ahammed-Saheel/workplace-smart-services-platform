import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validation';
import { calculateOrderTotal, validatePickupTime } from '@/lib/business/orders';
import { created, ok, unauthorized, forbidden, fail, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { listOrders, createOrder } from '@/lib/repo/orders';
import { findCafeteriaById, findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';
import { findMenuItemsByIds } from '@/lib/repo/menu-items';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;

    let filters: { customerId?: string; cafeteriaId?: string; status?: string } = { status };

    if (session.role === 'EMPLOYEE') {
      filters.customerId = session.sub;
    } else if (session.role === 'CAFETERIA_OWNER') {
      const cafeteria = findCafeteriaByOwnerId(session.sub);
      if (!cafeteria) return ok({ orders: [] });
      filters.cafeteriaId = cafeteria.id;
    } else if (session.role !== 'ADMIN') {
      return forbidden();
    }

    const orders = listOrders(filters);
    return ok({ orders });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'EMPLOYEE') return forbidden('Only employees can place orders.');

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const { cafeteriaId, items, pickupTime } = parsed.data;

    const cafeteria = findCafeteriaById(cafeteriaId);
    if (!cafeteria) return notFound('Cafeteria not found.');
    if (cafeteria.status !== 'OPEN') {
      return fail('This cafeteria is currently closed and not accepting orders.', 409);
    }

    const pickup = new Date(pickupTime);
    const pickupCheck = validatePickupTime(pickup);
    if (!pickupCheck.valid) return fail(pickupCheck.message!, 422);

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = findMenuItemsByIds(menuItemIds);

    if (menuItems.length !== menuItemIds.length) {
      return fail('One or more items in your cart no longer exist.', 409);
    }

    const unavailable = menuItems.filter((m) => !m.available || m.cafeteriaId !== cafeteriaId);
    if (unavailable.length > 0) {
      return fail(
        `${unavailable.map((m) => m.name).join(', ')} ${
          unavailable.length === 1 ? 'is' : 'are'
        } no longer available. Please update your cart.`,
        409
      );
    }

    const lines = items.map((line) => {
      const menuItem = menuItems.find((m) => m.id === line.menuItemId)!;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: line.quantity,
      };
    });

    const total = calculateOrderTotal(lines);

    const order = createOrder({
      customerId: session.sub,
      cafeteriaId,
      pickupTime: pickup.toISOString(),
      total,
      lines,
    });

    await logActivity(session.sub, 'Order placed', 'Order', order.id);
    await notify(
      cafeteria.ownerId,
      'New order received',
      `${session.name} placed an order worth ₹${total} for pickup at ${pickup.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.`,
      'ORDER',
      '/cafeteria-owner/orders'
    );

    return created({ order });
  } catch (err) {
    return serverError(err);
  }
}
