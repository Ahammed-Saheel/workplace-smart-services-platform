import type { OrderStatus } from '@/types/db';

export interface OrderLineInput {
  price: number;
  quantity: number;
}

/** Sums price * quantity across all order lines, rounded to 2 decimal places. */
export function calculateOrderTotal(items: OrderLineInput[]): number {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Math.round(total * 100) / 100;
}

export interface PickupTimeValidation {
  valid: boolean;
  message?: string;
}

/**
 * Pickup time must be in the future, and cafeterias only take orders for
 * same-day pickup up to a configurable horizon (default 6 hours) so owners
 * aren't planning around orders placed days in advance.
 */
export function validatePickupTime(
  pickupTime: Date,
  now: Date = new Date(),
  maxHorizonHours = 6
): PickupTimeValidation {
  if (Number.isNaN(pickupTime.getTime())) {
    return { valid: false, message: 'Choose a valid pickup time.' };
  }
  const minutesFromNow = (pickupTime.getTime() - now.getTime()) / 60000;
  if (minutesFromNow < 5) {
    return {
      valid: false,
      message: 'Pickup time must be at least 5 minutes from now.',
    };
  }
  if (minutesFromNow > maxHorizonHours * 60) {
    return {
      valid: false,
      message: `Pickup time can't be more than ${maxHorizonHours} hours from now.`,
    };
  }
  return { valid: true };
}

// PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED, with CANCELLED
// reachable from any non-terminal state.
const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionOrder(
  current: OrderStatus,
  next: OrderStatus
): boolean {
  return ORDER_FLOW[current]?.includes(next) ?? false;
}

export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_FLOW[current] ?? [];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
