import { db, newId, nowISO } from '../lib/db';
import { hashPassword } from '../lib/auth';
import { createUser, findUserByEmail } from '../lib/repo/users';
import { createMenuItem } from '../lib/repo/menu-items';
import { createOrder, updateOrderStatus } from '../lib/repo/orders';
import { createFoodRequest, updateFoodRequestStatus } from '../lib/repo/food-requests';
import { createPoll, castVote } from '../lib/repo/polls';
import {
  createStation,
  createCharger,
  createReservation,
  updateCharger,
} from '../lib/repo/charging';
import { createNotification } from '../lib/repo/notifications';
import { logActivity } from '../lib/repo/audit-log';

const DEMO_PASSWORD = 'Demo@1234';

function daysFromNowAt(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding Workplace Smart Cafeteria & Services Platform demo data...\n');

  // Wipe existing data so `npm run db:seed` is always safe to re-run.
  const tables = [
    'AuditLog',
    'Notification',
    'ChargingReservation',
    'Charger',
    'ChargingStation',
    'PollVote',
    'PollOption',
    'Poll',
    'FoodRequest',
    'OrderItem',
    '"Order"',
    'MenuItem',
    'Cafeteria',
    'User',
    'Workplace',
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t}`);

  // --- Workplace -------------------------------------------------------------
  const workplaceId = newId('workplace');
  db.prepare(
    `INSERT INTO Workplace (id, name, location, description, active, createdAt) VALUES (?, ?, ?, ?, 1, ?)`
  ).run(
    workplaceId,
    'Prototype Office Campus',
    'Innovation District, Tech City',
    'A technology park campus with two cafeterias and an EV charging zone, home to software and IT service companies.',
    nowISO()
  );

  // --- Users -------------------------------------------------------------
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = createUser({
    name: 'Lewis Sr',
    email: 'admin@demo.com',
    passwordHash,
    role: 'ADMIN',
    workplaceId,
  });

  const cafeteriaOwner = createUser({
    name: 'Robert Jr',
    email: 'cafeteria@demo.com',
    passwordHash,
    role: 'CAFETERIA_OWNER',
    workplaceId,
  });

  const cafeteriaOwner2 = createUser({
    name: 'Tommy Jr',
    email: 'techbites@demo.com',
    passwordHash,
    role: 'CAFETERIA_OWNER',
    workplaceId,
  });

  const chargingOwner = createUser({
    name: 'Anne Jr',
    email: 'charging@demo.com',
    passwordHash,
    role: 'CHARGING_OWNER',
    workplaceId,
  });

  const employee = createUser({
    name: 'John Jr',
    email: 'employee@demo.com',
    passwordHash,
    role: 'EMPLOYEE',
    workplaceId,
  });

  const employee2 = createUser({
    name: 'Holland Jr',
    email: 'holland@demo.com',
    passwordHash,
    role: 'EMPLOYEE',
    workplaceId,
  });

  const employee3 = createUser({
    name: 'Emma Jr',
    email: 'emma@demo.com',
    passwordHash,
    role: 'EMPLOYEE',
    workplaceId,
  });

  console.log('✓ Users created (admin, 2 cafeteria owners, charging owner, 3 employees)');

  // --- Cafeterias -------------------------------------------------------------
  const now = nowISO();
  const cyberCafeId = newId('cafeteria');
  db.prepare(
    `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
  ).run(
    cyberCafeId,
    workplaceId,
    cafeteriaOwner.id,
    'Cyber Café',
    'The main campus cafeteria, known for its Chicken Biryani and filter coffee.',
    now,
    now
  );

  const techBitesId = newId('cafeteria');
  db.prepare(
    `INSERT INTO Cafeteria (id, workplaceId, ownerId, name, description, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?)`
  ).run(
    techBitesId,
    workplaceId,
    cafeteriaOwner2.id,
    'Tech Bites',
    'Quick bites and continental favorites for the second-floor crowd.',
    now,
    now
  );

  console.log('✓ Cafeterias created (Cyber Café, Tech Bites)');

  // --- Menu items -------------------------------------------------------------
  const cyberCafeItems = [
    { name: 'Chicken Biryani', category: 'Lunch', price: 150, prep: 20, desc: 'Fragrant basmati rice with tender chicken and aromatic spices.' },
    { name: 'Veg Meals', category: 'Lunch', price: 90, prep: 15, desc: 'Rice, sambar, rasam, two curries, and papadam.' },
    { name: 'Chicken Fried Rice', category: 'Lunch', price: 130, prep: 15, desc: 'Wok-tossed rice with chicken, egg, and spring onion.' },
    { name: 'Masala Dosa', category: 'Breakfast', price: 60, prep: 12, desc: 'Crisp rice crepe with spiced potato filling and chutney.' },
    { name: 'Samosa', category: 'Snacks', price: 20, prep: 5, desc: 'Crispy pastry with spiced potato and pea filling.' },
    { name: 'Tea', category: 'Beverages', price: 15, prep: 3, desc: 'Classic spiced milk tea.' },
    { name: 'Filter Coffee', category: 'Beverages', price: 20, prep: 3, desc: 'South Indian filter coffee, strong and frothy.' },
    { name: 'Fresh Lime Juice', category: 'Beverages', price: 40, prep: 4, desc: 'Refreshing lime juice, sweet or salted.' },
    { name: 'Gulab Jamun', category: 'Desserts', price: 35, prep: 2, desc: 'Warm milk-solid dumplings in sugar syrup.' },
  ];

  const techBitesItems = [
    { name: 'Shawarma', category: 'Specials', price: 110, prep: 12, desc: 'Grilled chicken shawarma wrap with garlic sauce.' },
    { name: 'Pasta Arrabbiata', category: 'Lunch', price: 120, prep: 15, desc: 'Penne pasta in a spicy tomato sauce.' },
    { name: 'Veg Sandwich', category: 'Snacks', price: 50, prep: 8, desc: 'Grilled sandwich with fresh vegetables and mint chutney.' },
    { name: 'Chicken Roll', category: 'Snacks', price: 80, prep: 10, desc: 'Spiced chicken wrapped in a soft paratha.' },
    { name: 'Cold Coffee', category: 'Beverages', price: 50, prep: 5, desc: 'Blended cold coffee topped with ice cream.' },
    { name: 'Chocolate Brownie', category: 'Desserts', price: 45, prep: 3, desc: 'Fudgy brownie served warm.' },
  ];

  const cyberMenuIds: Record<string, string> = {};
  for (const item of cyberCafeItems) {
    const created = createMenuItem({
      cafeteriaId: cyberCafeId,
      name: item.name,
      description: item.desc,
      price: item.price,
      category: item.category,
      preparationTime: item.prep,
      available: true,
    });
    cyberMenuIds[item.name] = created.id;
  }
  // One sold-out item to demonstrate availability toggling.
  const soldOutItem = createMenuItem({
    cafeteriaId: cyberCafeId,
    name: 'Chicken 65',
    description: "Spicy deep-fried chicken bites. Today's batch sold out fast.",
    price: 100,
    category: 'Snacks',
    preparationTime: 15,
    available: false,
  });

  const techMenuIds: Record<string, string> = {};
  for (const item of techBitesItems) {
    const created = createMenuItem({
      cafeteriaId: techBitesId,
      name: item.name,
      description: item.desc,
      price: item.price,
      category: item.category,
      preparationTime: item.prep,
      available: true,
    });
    techMenuIds[item.name] = created.id;
  }

  console.log('✓ Menu items created (15 items across 2 cafeterias, 1 marked sold out)');

  // --- Orders -------------------------------------------------------------
  const order1 = createOrder({
    customerId: employee.id,
    cafeteriaId: cyberCafeId,
    pickupTime: daysFromNowAt(0, 13, 15).toISOString(),
    total: 150 + 20,
    lines: [
      { menuItemId: cyberMenuIds['Chicken Biryani'], name: 'Chicken Biryani', quantity: 1, price: 150 },
      { menuItemId: cyberMenuIds['Filter Coffee'], name: 'Filter Coffee', quantity: 1, price: 20 },
    ],
  });
  updateOrderStatus(order1.id, 'PREPARING');

  const order2 = createOrder({
    customerId: employee.id,
    cafeteriaId: cyberCafeId,
    pickupTime: daysFromNowAt(-1, 13, 0).toISOString(),
    total: 90,
    lines: [{ menuItemId: cyberMenuIds['Veg Meals'], name: 'Veg Meals', quantity: 1, price: 90 }],
  });
  updateOrderStatus(order2.id, 'COMPLETED');

  const order3 = createOrder({
    customerId: employee2.id,
    cafeteriaId: cyberCafeId,
    pickupTime: daysFromNowAt(0, 13, 30).toISOString(),
    total: 130 * 2,
    lines: [{ menuItemId: cyberMenuIds['Chicken Fried Rice'], name: 'Chicken Fried Rice', quantity: 2, price: 130 }],
  });
  // leave as PLACED so the owner dashboard has something to accept in the demo

  const order4 = createOrder({
    customerId: employee3.id,
    cafeteriaId: techBitesId,
    pickupTime: daysFromNowAt(0, 13, 10).toISOString(),
    total: 110,
    lines: [{ menuItemId: techMenuIds['Shawarma'], name: 'Shawarma', quantity: 1, price: 110 }],
  });
  updateOrderStatus(order4.id, 'READY');

  const order5 = createOrder({
    customerId: employee.id,
    cafeteriaId: techBitesId,
    pickupTime: daysFromNowAt(-2, 12, 45).toISOString(),
    total: 50,
    lines: [{ menuItemId: techMenuIds['Cold Coffee'], name: 'Cold Coffee', quantity: 1, price: 50 }],
  });
  updateOrderStatus(order5.id, 'CANCELLED');

  console.log('✓ Orders created across PLACED, PREPARING, READY, COMPLETED, CANCELLED');

  // --- Food requests -------------------------------------------------------------
  const req1 = createFoodRequest({
    customerId: employee.id,
    cafeteriaId: cyberCafeId,
    name: 'Artisan Paratha with Steak Curry',
    description: 'Would love to see this on the weekend specials menu.',
  });
  updateFoodRequestStatus(req1.id, 'PLANNED');

  createFoodRequest({
    customerId: employee2.id,
    cafeteriaId: cyberCafeId,
    name: 'Idiyappam with Egg Curry',
    description: 'A lighter breakfast option would be great.',
  });

  const req3 = createFoodRequest({
    customerId: employee3.id,
    cafeteriaId: techBitesId,
    name: 'Falafel Wrap',
    description: null,
  });
  updateFoodRequestStatus(req3.id, 'ADDED_TO_MENU');

  console.log('✓ Food requests created (submitted, planned, added to menu)');

  // --- Polls -------------------------------------------------------------
  const poll = createPoll({
    cafeteriaId: cyberCafeId,
    title: "What should tomorrow's special be?",
    description: 'Vote for the dish you want to see on tomorrow\'s Cyber Café specials board.',
    startDate: daysFromNowAt(0, 0).toISOString(),
    endDate: daysFromNowAt(2, 23, 59).toISOString(),
    options: ['Chicken Biryani', 'Fried Rice', 'Shawarma', 'Pasta'],
  });
  const optionRows = db
    .prepare('SELECT id, option FROM PollOption WHERE pollId = ?')
    .all(poll.id) as { id: string; option: string }[];
  const biryaniOption = optionRows.find((o) => o.option === 'Chicken Biryani')!;
  const friedRiceOption = optionRows.find((o) => o.option === 'Fried Rice')!;
  castVote(poll.id, biryaniOption.id, employee2.id);
  castVote(poll.id, friedRiceOption.id, employee3.id);
  // employee@demo.com deliberately left un-voted so the demo can show casting a vote live.

  const closedPoll = createPoll({
    cafeteriaId: cyberCafeId,
    title: 'Best breakfast item this month?',
    description: 'Help us decide what to keep on the permanent breakfast menu.',
    startDate: daysFromNowAt(-10, 0).toISOString(),
    endDate: daysFromNowAt(-3, 23, 59).toISOString(),
    options: ['Masala Dosa', 'Idli Sambar', 'Poha'],
  });
  db.prepare('UPDATE Poll SET active = 0 WHERE id = ?').run(closedPoll.id);
  const closedOptions = db
    .prepare('SELECT id, option FROM PollOption WHERE pollId = ?')
    .all(closedPoll.id) as { id: string; option: string }[];
  castVote(closedPoll.id, closedOptions[0].id, employee.id);
  castVote(closedPoll.id, closedOptions[0].id, employee2.id);
  castVote(closedPoll.id, closedOptions[1].id, employee3.id);

  console.log('✓ Polls created (1 active with votes, 1 closed with results)');

  // --- EV charging -------------------------------------------------------------
  const station = createStation({
    workplaceId,
    ownerId: chargingOwner.id,
    name: 'Main EV Charging Zone',
    location: 'Basement parking, Block C',
  });

  const chargerA1 = createCharger({
    stationId: station.id,
    name: 'Charger A1',
    connectorType: 'Type 2',
    power: 22,
    price: 50,
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
  });
  const chargerA2 = createCharger({
    stationId: station.id,
    name: 'Charger A2',
    connectorType: 'CCS2',
    power: 50,
    price: 80,
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
  });
  const chargerB1 = createCharger({
    stationId: station.id,
    name: 'Charger B1',
    connectorType: 'Type 2',
    power: 22,
    price: 50,
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
  });
  updateCharger(chargerB1.id, { status: 'OFFLINE' });

  console.log('✓ Charging station created with 3 chargers (1 offline)');

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = daysFromNowAt(1, 0).toISOString().slice(0, 10);

  createReservation({
    chargerId: chargerA1.id,
    userId: employee2.id,
    date: todayStr,
    startTime: '10:00',
    endTime: '11:00',
    amount: 50,
  });
  createReservation({
    chargerId: chargerA2.id,
    userId: employee.id,
    date: tomorrowStr,
    startTime: '14:00',
    endTime: '15:00',
    amount: 80,
  });
  const pastReservation = createReservation({
    chargerId: chargerA1.id,
    userId: employee3.id,
    date: daysFromNowAt(-3, 0).toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    amount: 50,
  });
  db.prepare('UPDATE ChargingReservation SET status = ? WHERE id = ?').run(
    'COMPLETED',
    pastReservation.id
  );

  console.log('✓ Charging reservations created (upcoming + completed)');

  // --- Notifications -------------------------------------------------------------
  createNotification(
    employee.id,
    'Welcome to the platform',
    `You're all set, ${employee.name}. Browse today's menu or reserve an EV charging slot to get started.`,
    'SYSTEM'
  );
  createNotification(
    employee.id,
    'Order #' + order1.id.slice(-6).toUpperCase() + ' update',
    'Your food is being prepared.',
    'ORDER',
    '/employee/orders'
  );
  createNotification(
    employee.id,
    'New food poll',
    `Vote now: "${poll.title}"`,
    'POLL',
    '/employee/polls'
  );
  createNotification(
    cafeteriaOwner.id,
    'New order received',
    `${employee.name} placed an order worth ₹260 for pickup at 1:30 PM.`,
    'ORDER',
    '/cafeteria-owner/orders'
  );
  createNotification(
    chargingOwner.id,
    'New charging reservation',
    `${employee2.name} booked Charger A1 on ${todayStr} from 10:00 to 11:00.`,
    'CHARGING',
    '/charging-owner/reservations'
  );

  console.log('✓ Notifications seeded');

  // --- Audit log -------------------------------------------------------------
  logActivity(admin.id, 'Platform seeded with demo data', 'System');
  logActivity(employee.id, 'User registered', 'User', employee.id);
  logActivity(cafeteriaOwner.id, 'Menu item created', 'MenuItem', cyberMenuIds['Chicken Biryani']);
  logActivity(employee2.id, 'Order placed', 'Order', order3.id);
  logActivity(chargingOwner.id, 'Charging station created', 'ChargingStation', station.id);

  console.log('✓ Audit log seeded\n');

  console.log('Demo accounts (password for all: ' + DEMO_PASSWORD + '):');
  console.log('  Employee:         employee@demo.com');
  console.log('  Cafeteria owner:  cafeteria@demo.com   (Cyber Café)');
  console.log('  Cafeteria owner:  techbites@demo.com   (Tech Bites)');
  console.log('  Charging owner:   charging@demo.com');
  console.log('  Admin:            admin@demo.com');
  console.log('\nSeed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });
