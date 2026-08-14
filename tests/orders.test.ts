import { describe, it, expect } from 'vitest';
import { calculateOrderTotal, validatePickupTime, canTransitionOrder, nextOrderStatuses } from '@/lib/business/orders';

describe('calculateOrderTotal', () => {
  it('sums price * quantity across lines', () => {
    const total = calculateOrderTotal([
      { price: 150, quantity: 1 },
      { price: 20, quantity: 2 },
    ]);
    expect(total).toBe(190);
  });

  it('returns 0 for an empty cart', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const total = calculateOrderTotal([{ price: 33.333, quantity: 3 }]);
    expect(total).toBe(100);
  });
});

describe('validatePickupTime', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');

  it('accepts a time comfortably in the future', () => {
    const pickup = new Date('2026-01-01T13:00:00.000Z');
    expect(validatePickupTime(pickup, now).valid).toBe(true);
  });

  it('rejects a time in the past', () => {
    const pickup = new Date('2026-01-01T11:00:00.000Z');
    const result = validatePickupTime(pickup, now);
    expect(result.valid).toBe(false);
  });

  it('rejects a time less than 5 minutes away', () => {
    const pickup = new Date('2026-01-01T12:02:00.000Z');
    expect(validatePickupTime(pickup, now).valid).toBe(false);
  });

  it('rejects a time beyond the configured horizon', () => {
    const pickup = new Date('2026-01-01T20:00:00.000Z'); // 8 hours later
    expect(validatePickupTime(pickup, now, 6).valid).toBe(false);
  });
});

describe('order status transitions', () => {
  it('allows the full happy path PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED', () => {
    expect(canTransitionOrder('PLACED', 'ACCEPTED')).toBe(true);
    expect(canTransitionOrder('ACCEPTED', 'PREPARING')).toBe(true);
    expect(canTransitionOrder('PREPARING', 'READY')).toBe(true);
    expect(canTransitionOrder('READY', 'COMPLETED')).toBe(true);
  });

  it('allows cancellation from any non-terminal state', () => {
    expect(canTransitionOrder('PLACED', 'CANCELLED')).toBe(true);
    expect(canTransitionOrder('ACCEPTED', 'CANCELLED')).toBe(true);
    expect(canTransitionOrder('PREPARING', 'CANCELLED')).toBe(true);
  });

  it('rejects skipping steps', () => {
    expect(canTransitionOrder('PLACED', 'READY')).toBe(false);
    expect(canTransitionOrder('PLACED', 'COMPLETED')).toBe(false);
  });

  it('rejects moving out of a terminal state', () => {
    expect(canTransitionOrder('COMPLETED', 'PLACED')).toBe(false);
    expect(canTransitionOrder('CANCELLED', 'ACCEPTED')).toBe(false);
    expect(nextOrderStatuses('COMPLETED')).toEqual([]);
  });
});
