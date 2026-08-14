import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { orderStatusSchema } from '@/lib/validation';
import { canTransitionOrder, ORDER_STATUS_LABEL } from '@/lib/business/orders';
import { ok, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { findOrderById, updateOrderStatus } from '@/lib/repo/orders';
import { findCafeteriaById } from '@/lib/repo/cafeterias';
import type { OrderStatus } from '@/types/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const order = findOrderById(id);
    if (!order) return notFound('Order not found.');
    const cafeteria = findCafeteriaById(order.cafeteriaId);

    const canView =
      session.role === 'ADMIN' ||
      order.customerId === session.sub ||
      cafeteria?.ownerId === session.sub;
    if (!canView) return forbidden();

    return ok({ order });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const order = findOrderById(id);
    if (!order) return notFound('Order not found.');
    const cafeteria = findCafeteriaById(order.cafeteriaId);
    if (!cafeteria) return notFound('Cafeteria not found.');

    const body = await req.json();
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const nextStatus = parsed.data.status as OrderStatus;

    const isOwner = session.role === 'CAFETERIA_OWNER' && cafeteria.ownerId === session.sub;
    const isCustomer = session.role === 'EMPLOYEE' && order.customerId === session.sub;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isCustomer && !isAdmin) return forbidden();

    if (isCustomer && !isAdmin) {
      if (nextStatus !== 'CANCELLED') {
        return forbidden('You can only cancel an order, not change its status.');
      }
      if (!['PLACED', 'ACCEPTED'].includes(order.status)) {
        return fail('This order is already being prepared and can no longer be cancelled.', 409);
      }
    }

    if (!isAdmin && !canTransitionOrder(order.status, nextStatus)) {
      return fail(
        `Order can't move from "${ORDER_STATUS_LABEL[order.status]}" to "${ORDER_STATUS_LABEL[nextStatus]}".`,
        409
      );
    }

    const updated = updateOrderStatus(id, nextStatus);
    await logActivity(session.sub, `Order marked ${nextStatus}`, 'Order', order.id);

    const notifyTarget = isCustomer ? cafeteria.ownerId : order.customerId;
    const messages: Partial<Record<OrderStatus, string>> = {
      ACCEPTED: 'Your order has been accepted and will be prepared soon.',
      PREPARING: 'Your food is being prepared.',
      READY: 'Your food is ready. Skip the queue and collect it now!',
      COMPLETED: 'Order marked as completed. Thanks for ordering!',
      CANCELLED: isCustomer ? 'The customer cancelled their order.' : 'Your order was cancelled.',
    };
    await notify(
      notifyTarget,
      `Order #${order.id.slice(-6).toUpperCase()} update`,
      messages[nextStatus] ?? `Order status changed to ${nextStatus}.`,
      'ORDER',
      isCustomer ? '/cafeteria-owner/orders' : '/employee/orders'
    );

    return ok({ order: updated });
  } catch (err) {
    return serverError(err);
  }
}
