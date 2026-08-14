import { db, newId, nowISO } from '@/lib/db';
import type { NotificationRow, NotificationType } from '@/types/db';

export function listNotifications(userId: string, limit = 30) {
  return db
    .prepare('SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT ?')
    .all(userId, limit) as NotificationRow[];
}

export function unreadNotificationCount(userId: string): number {
  return (
    db
      .prepare('SELECT COUNT(*) as c FROM Notification WHERE userId = ? AND read = 0')
      .get(userId) as { c: number }
  ).c;
}

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'SYSTEM',
  link?: string
): NotificationRow {
  const id = newId('notif');
  const now = nowISO();
  db.prepare(
    `INSERT INTO Notification (id, userId, title, message, type, read, link, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(id, userId, title, message, type, link ?? null, now);
  return db.prepare('SELECT * FROM Notification WHERE id = ?').get(id) as NotificationRow;
}

export function findNotificationById(id: string): NotificationRow | undefined {
  return db.prepare('SELECT * FROM Notification WHERE id = ?').get(id) as
    | NotificationRow
    | undefined;
}

export function markNotificationRead(id: string) {
  db.prepare('UPDATE Notification SET read = 1 WHERE id = ?').run(id);
  return findNotificationById(id);
}

export function markAllNotificationsRead(userId: string) {
  db.prepare('UPDATE Notification SET read = 1 WHERE userId = ? AND read = 0').run(userId);
}
