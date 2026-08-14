export interface TimeRange {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

/** Converts "HH:MM" into minutes since midnight for easy comparison. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** True if two time ranges on the same day overlap at all. */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export interface ExistingReservation extends TimeRange {
  date: string; // "YYYY-MM-DD"
  status: string;
}

export interface ReservationRequest extends TimeRange {
  date: string;
}

export interface ReservationValidation {
  valid: boolean;
  message?: string;
}

/**
 * Server-side source of truth for reservation safety: a charger can never
 * be double-booked for overlapping time windows on the same day. Cancelled
 * reservations don't block new bookings.
 */
export function validateReservationSlot(
  request: ReservationRequest,
  existing: ExistingReservation[],
  operatingHours: TimeRange
): ReservationValidation {
  if (timeToMinutes(request.startTime) >= timeToMinutes(request.endTime)) {
    return { valid: false, message: 'End time must be after start time.' };
  }

  const opStart = timeToMinutes(operatingHours.startTime);
  const opEnd = timeToMinutes(operatingHours.endTime);
  if (
    timeToMinutes(request.startTime) < opStart ||
    timeToMinutes(request.endTime) > opEnd
  ) {
    return {
      valid: false,
      message: `This charger is only available between ${operatingHours.startTime} and ${operatingHours.endTime}.`,
    };
  }

  const conflict = existing.some(
    (r) =>
      r.date === request.date &&
      r.status !== 'CANCELLED' &&
      rangesOverlap(r, request)
  );
  if (conflict) {
    return {
      valid: false,
      message: 'That slot overlaps with an existing reservation. Pick another time.',
    };
  }

  return { valid: true };
}

/** Whether a reservation is still cancellable, only before it becomes active. */
export function canCancelReservation(status: string): boolean {
  return status === 'UPCOMING';
}

/** A charger can only be booked when it isn't offline for maintenance. */
export function isChargerBookable(status: string): boolean {
  return status !== 'OFFLINE';
}
