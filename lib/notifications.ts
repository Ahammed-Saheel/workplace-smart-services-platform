import { createNotification } from '@/lib/repo/notifications';
import { logActivity } from '@/lib/repo/audit-log';
import type { NotificationType } from '@/types/db';

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'SYSTEM',
  link?: string
) {
  return createNotification(userId, title, message, type, link);
}

export { logActivity };
