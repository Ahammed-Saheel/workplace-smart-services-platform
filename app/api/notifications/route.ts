import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ok, unauthorized, serverError } from '@/lib/api-response';
import { listNotifications, unreadNotificationCount, markAllNotificationsRead } from '@/lib/repo/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const notifications = listNotifications(session.sub, limit);
    const unreadCount = unreadNotificationCount(session.sub);

    return ok({ notifications, unreadCount });
  } catch (err) {
    return serverError(err);
  }
}

// Mark all as read.
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    markAllNotificationsRead(session.sub);
    return ok({ markedAll: true });
  } catch (err) {
    return serverError(err);
  }
}
