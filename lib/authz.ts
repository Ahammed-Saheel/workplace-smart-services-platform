// Small, pure authorization predicates extracted for testability. The API
// routes perform the equivalent checks inline (see app/api/**/route.ts);
// these helpers capture the same rules so they can be unit tested directly.
import type { Role } from '@/types/db';

export interface SessionLike {
  sub: string;
  role: Role;
}

export function isAdmin(session: SessionLike): boolean {
  return session.role === 'ADMIN';
}

export function canManageCafeteria(
  session: SessionLike,
  cafeteria: { ownerId: string }
): boolean {
  return isAdmin(session) || (session.role === 'CAFETERIA_OWNER' && cafeteria.ownerId === session.sub);
}

export function canManageStation(
  session: SessionLike,
  station: { ownerId: string }
): boolean {
  return isAdmin(session) || (session.role === 'CHARGING_OWNER' && station.ownerId === session.sub);
}

export function canAccessAdminArea(session: SessionLike): boolean {
  return isAdmin(session);
}

export function canPlaceOrder(session: SessionLike): boolean {
  return session.role === 'EMPLOYEE';
}
