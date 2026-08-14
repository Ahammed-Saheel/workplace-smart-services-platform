import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api-response';
import { findNotificationById, markNotificationRead } from '@/lib/repo/notifications';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const notification = findNotificationById(id);
    if (!notification) return notFound('Notification not found.');
    if (notification.userId !== session.sub) return forbidden();

    const updated = markNotificationRead(id);
    return ok({ notification: updated });
  } catch (err) {
    return serverError(err);
  }
}
