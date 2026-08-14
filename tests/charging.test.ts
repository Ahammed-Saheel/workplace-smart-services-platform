import { describe, it, expect } from 'vitest';
import { rangesOverlap, validateReservationSlot, canCancelReservation, timeToMinutes } from '@/lib/business/charging';

describe('timeToMinutes', () => {
  it('converts HH:MM to minutes since midnight', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});

describe('rangesOverlap', () => {
  it('detects a direct overlap', () => {
    expect(rangesOverlap({ startTime: '10:00', endTime: '11:00' }, { startTime: '10:30', endTime: '11:30' })).toBe(true);
  });

  it('detects containment', () => {
    expect(rangesOverlap({ startTime: '09:00', endTime: '12:00' }, { startTime: '10:00', endTime: '11:00' })).toBe(true);
  });

  it('does not flag back-to-back slots as overlapping', () => {
    expect(rangesOverlap({ startTime: '10:00', endTime: '11:00' }, { startTime: '11:00', endTime: '12:00' })).toBe(false);
  });

  it('does not flag clearly separate slots', () => {
    expect(rangesOverlap({ startTime: '09:00', endTime: '10:00' }, { startTime: '14:00', endTime: '15:00' })).toBe(false);
  });
});

describe('validateReservationSlot', () => {
  const hours = { startTime: '08:00', endTime: '20:00' };

  it('accepts a valid, non-conflicting slot', () => {
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '10:00', endTime: '11:00' },
      [],
      hours
    );
    expect(result.valid).toBe(true);
  });

  it('rejects end time before start time', () => {
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '11:00', endTime: '10:00' },
      [],
      hours
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a slot outside operating hours', () => {
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '21:00', endTime: '22:00' },
      [],
      hours
    );
    expect(result.valid).toBe(false);
  });

  it('rejects an overlapping reservation on the same day, the core concurrency-safety rule', () => {
    const existing = [{ date: '2026-01-05', startTime: '10:00', endTime: '11:00', status: 'UPCOMING' }];
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '10:30', endTime: '11:30' },
      existing,
      hours
    );
    expect(result.valid).toBe(false);
  });

  it('allows a new reservation once the conflicting one is cancelled', () => {
    const existing = [{ date: '2026-01-05', startTime: '10:00', endTime: '11:00', status: 'CANCELLED' }];
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '10:30', endTime: '11:30' },
      existing,
      hours
    );
    expect(result.valid).toBe(true);
  });

  it('ignores reservations on a different date', () => {
    const existing = [{ date: '2026-01-06', startTime: '10:00', endTime: '11:00', status: 'UPCOMING' }];
    const result = validateReservationSlot(
      { date: '2026-01-05', startTime: '10:00', endTime: '11:00' },
      existing,
      hours
    );
    expect(result.valid).toBe(true);
  });
});

describe('canCancelReservation', () => {
  it('allows cancelling only upcoming reservations', () => {
    expect(canCancelReservation('UPCOMING')).toBe(true);
    expect(canCancelReservation('ACTIVE')).toBe(false);
    expect(canCancelReservation('COMPLETED')).toBe(false);
    expect(canCancelReservation('CANCELLED')).toBe(false);
  });
});
