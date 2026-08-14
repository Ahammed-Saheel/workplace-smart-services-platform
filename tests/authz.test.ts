import { describe, it, expect } from 'vitest';
import { canManageCafeteria, canManageStation, canAccessAdminArea, canPlaceOrder } from '@/lib/authz';

describe('authorization predicates', () => {
  it('an employee cannot access admin functionality', () => {
    const employee = { sub: 'u1', role: 'EMPLOYEE' as const };
    expect(canAccessAdminArea(employee)).toBe(false);
  });

  it('an admin can access admin functionality', () => {
    const admin = { sub: 'u1', role: 'ADMIN' as const };
    expect(canAccessAdminArea(admin)).toBe(true);
  });

  it('a cafeteria owner cannot modify another cafeteria', () => {
    const owner = { sub: 'owner-1', role: 'CAFETERIA_OWNER' as const };
    const someoneElsesCafeteria = { ownerId: 'owner-2' };
    expect(canManageCafeteria(owner, someoneElsesCafeteria)).toBe(false);
  });

  it('a cafeteria owner can modify their own cafeteria', () => {
    const owner = { sub: 'owner-1', role: 'CAFETERIA_OWNER' as const };
    const ownCafeteria = { ownerId: 'owner-1' };
    expect(canManageCafeteria(owner, ownCafeteria)).toBe(true);
  });

  it('a charging owner cannot modify another operator\'s station', () => {
    const owner = { sub: 'owner-1', role: 'CHARGING_OWNER' as const };
    const someoneElsesStation = { ownerId: 'owner-2' };
    expect(canManageStation(owner, someoneElsesStation)).toBe(false);
  });

  it('an admin can manage any cafeteria or station regardless of owner', () => {
    const admin = { sub: 'admin-1', role: 'ADMIN' as const };
    expect(canManageCafeteria(admin, { ownerId: 'owner-2' })).toBe(true);
    expect(canManageStation(admin, { ownerId: 'owner-2' })).toBe(true);
  });

  it('only employees can place orders', () => {
    expect(canPlaceOrder({ sub: 'u1', role: 'EMPLOYEE' })).toBe(true);
    expect(canPlaceOrder({ sub: 'u1', role: 'CAFETERIA_OWNER' })).toBe(false);
    expect(canPlaceOrder({ sub: 'u1', role: 'ADMIN' })).toBe(false);
  });
});
