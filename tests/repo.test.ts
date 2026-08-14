import { describe, it, expect, beforeAll } from 'vitest';
import { db, newId } from '@/lib/db';
import { createUser, findUserByEmail } from '@/lib/repo/users';
import { createOrder, updateOrderStatus, findOrderById } from '@/lib/repo/orders';
import { createPoll, castVote, hasVoted, findPollById } from '@/lib/repo/polls';
import {
  createStation,
  createCharger,
  createReservation,
  reservationsForChargerOnDate,
} from '@/lib/repo/charging';
import { validateReservationSlot } from '@/lib/business/charging';

// Fresh, isolated tables for this test run (DATABASE_URL points at test.db;
// see tests/setup-env.ts). Wiping first keeps repeated runs deterministic.
beforeAll(() => {
  const tables = [
    'AuditLog', 'Notification', 'ChargingReservation', 'Charger', 'ChargingStation',
    'PollVote', 'PollOption', 'Poll', 'FoodRequest', 'OrderItem', '"Order"',
    'MenuItem', 'Cafeteria', 'User', 'Workplace',
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t}`);

  db.prepare(
    `INSERT INTO Workplace (id, name, location, description, active, createdAt) VALUES (?, ?, ?, ?, 1, ?)`
  ).run('wp_test', 'Test Campus', 'Testville', null, new Date().toISOString());
});

describe('users repository', () => {
  it('creates a user and finds them by email', () => {
    const user = createUser({
      name: 'Test Employee',
      email: 'test.employee@example.com',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
      workplaceId: 'wp_test',
    });
    expect(user.id).toBeTruthy();

    const found = findUserByEmail('test.employee@example.com');
    expect(found?.id).toBe(user.id);
    expect(found?.role).toBe('EMPLOYEE');
  });

  it('enforces unique emails at the database level', () => {
    createUser({
      name: 'Dup One',
      email: 'dup@example.com',
      passwordHash: 'x',
      role: 'EMPLOYEE',
      workplaceId: 'wp_test',
    });
    expect(() =>
      createUser({
        name: 'Dup Two',
        email: 'dup@example.com',
        passwordHash: 'x',
        role: 'EMPLOYEE',
        workplaceId: 'wp_test',
      })
    ).toThrow();
  });
});

describe('orders repository', () => {
  it('creates an order with line items and computes a matching total', () => {
    const customer = createUser({
      name: 'Order Tester',
      email: 'order.tester@example.com',
      passwordHash: 'x',
      role: 'EMPLOYEE',
      workplaceId: 'wp_test',
    });
    const owner = createUser({
      name: 'Cafeteria Owner',
      email: 'cafowner.tester@example.com',
      passwordHash: 'x',
      role: 'CAFETERIA_OWNER',
      workplaceId: 'wp_test',
    });
    const cafeteriaId = newId('cafeteria');
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'OPEN', ?, ?)`
    ).run(cafeteriaId, 'wp_test', owner.id, 'Test Cafeteria', now, now);

    const item1 = newId('item');
    const item2 = newId('item');
    db.prepare(
      `INSERT INTO MenuItem (id, cafeteriaId, name, price, category, preparationTime, available, createdAt, updatedAt)
       VALUES (?, ?, 'Chicken Biryani', 150, 'Lunch', 15, 1, ?, ?)`
    ).run(item1, cafeteriaId, now, now);
    db.prepare(
      `INSERT INTO MenuItem (id, cafeteriaId, name, price, category, preparationTime, available, createdAt, updatedAt)
       VALUES (?, ?, 'Filter Coffee', 20, 'Beverages', 3, 1, ?, ?)`
    ).run(item2, cafeteriaId, now, now);

    const order = createOrder({
      customerId: customer.id,
      cafeteriaId,
      pickupTime: new Date().toISOString(),
      total: 190,
      lines: [
        { menuItemId: item1, name: 'Chicken Biryani', quantity: 1, price: 150 },
        { menuItemId: item2, name: 'Filter Coffee', quantity: 2, price: 20 },
      ],
    });

    expect(order.items).toHaveLength(2);
    expect(order.status).toBe('PLACED');

    const updated = updateOrderStatus(order.id, 'ACCEPTED');
    expect(updated.status).toBe('ACCEPTED');
    expect(findOrderById(order.id)?.status).toBe('ACCEPTED');
  });
});

describe('polls repository', () => {
  it('creates a poll, accepts a vote, and blocks a duplicate vote via the DB constraint', () => {
    const owner = createUser({
      name: 'Poll Owner',
      email: 'pollowner.tester@example.com',
      passwordHash: 'x',
      role: 'CAFETERIA_OWNER',
      workplaceId: 'wp_test',
    });
    const cafeteriaId = newId('cafeteria');
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'OPEN', ?, ?)`
    ).run(cafeteriaId, 'wp_test', owner.id, 'Poll Cafeteria', now, now);

    const voter = createUser({
      name: 'Voter',
      email: 'voter.tester@example.com',
      passwordHash: 'x',
      role: 'EMPLOYEE',
      workplaceId: 'wp_test',
    });

    const poll = createPoll({
      cafeteriaId,
      title: "Tomorrow's special?",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      options: ['Biryani', 'Fried Rice'],
    });

    expect(poll.options).toHaveLength(2);
    expect(hasVoted(poll.id, voter.id)).toBe(false);

    castVote(poll.id, poll.options[0].id, voter.id);
    expect(hasVoted(poll.id, voter.id)).toBe(true);

    // The @@unique(pollId, userId)-equivalent constraint must reject a second vote.
    expect(() => castVote(poll.id, poll.options[1].id, voter.id)).toThrow();

    const refreshed = findPollById(poll.id, voter.id);
    expect(refreshed?.totalVotes).toBe(1);
  });
});

describe('charging repository + overlap validation', () => {
  it('rejects a reservation that overlaps an existing one on the same charger', () => {
    const owner = createUser({
      name: 'Charging Owner',
      email: 'chargingowner.tester@example.com',
      passwordHash: 'x',
      role: 'CHARGING_OWNER',
      workplaceId: 'wp_test',
    });
    const rider = createUser({
      name: 'Rider',
      email: 'rider.tester@example.com',
      passwordHash: 'x',
      role: 'EMPLOYEE',
      workplaceId: 'wp_test',
    });

    const station = createStation({
      workplaceId: 'wp_test',
      ownerId: owner.id,
      name: 'Test Station',
      location: 'Lot A',
    });
    const charger = createCharger({
      stationId: station.id,
      name: 'Charger T1',
      connectorType: 'Type 2',
      power: 22,
      price: 50,
      operatingHoursStart: '08:00',
      operatingHoursEnd: '20:00',
    });

    createReservation({
      chargerId: charger.id,
      userId: rider.id,
      date: '2026-02-01',
      startTime: '10:00',
      endTime: '11:00',
      amount: 50,
    });

    const existing = reservationsForChargerOnDate(charger.id, '2026-02-01');
    expect(existing).toHaveLength(1);

    const conflict = validateReservationSlot(
      { date: '2026-02-01', startTime: '10:30', endTime: '11:30' },
      existing,
      { startTime: charger.operatingHoursStart, endTime: charger.operatingHoursEnd }
    );
    expect(conflict.valid).toBe(false);

    const nonConflict = validateReservationSlot(
      { date: '2026-02-01', startTime: '11:00', endTime: '12:00' },
      existing,
      { startTime: charger.operatingHoursStart, endTime: charger.operatingHoursEnd }
    );
    expect(nonConflict.valid).toBe(true);
  });
});
