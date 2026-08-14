import { db, newId, nowISO } from '@/lib/db';
import type {
  ChargingStationRow,
  ChargerRow,
  ChargingReservationRow,
  StationStatus,
  ChargerStatus,
  ReservationStatus,
  PaymentStatus,
} from '@/types/db';

// --- Stations ----------------------------------------------------------------

export interface StationWithChargers extends ChargingStationRow {
  chargers: ChargerRow[];
  ownerName: string;
  ownerEmail: string;
  chargerCount: number;
}

export function listStations(filters: { ownerId?: string }): StationWithChargers[] {
  let sql = `
    SELECT s.*, u.name as ownerName, u.email as ownerEmail,
           (SELECT COUNT(*) FROM Charger c WHERE c.stationId = s.id) as chargerCount
    FROM ChargingStation s
    JOIN User u ON u.id = s.ownerId
    WHERE 1=1`;
  const params: Record<string, unknown> = {};
  if (filters.ownerId) {
    sql += ' AND s.ownerId = @ownerId';
    params.ownerId = filters.ownerId;
  }
  sql += ' ORDER BY s.name ASC';

  const stations = db.prepare(sql).all(params) as (ChargingStationRow & {
    ownerName: string;
    ownerEmail: string;
    chargerCount: number;
  })[];

  return stations.map((s) => ({
    ...s,
    chargers: db.prepare('SELECT * FROM Charger WHERE stationId = ?').all(s.id) as ChargerRow[],
  }));
}

export function findStationById(id: string): ChargingStationRow | undefined {
  return db.prepare('SELECT * FROM ChargingStation WHERE id = ?').get(id) as
    | ChargingStationRow
    | undefined;
}

export function createStation(input: {
  workplaceId: string;
  ownerId: string;
  name: string;
  location: string;
}): ChargingStationRow {
  const id = newId('station');
  const now = nowISO();
  db.prepare(
    `INSERT INTO ChargingStation (id, workplaceId, ownerId, name, location, status, createdAt, updatedAt)
     VALUES (@id, @workplaceId, @ownerId, @name, @location, 'ACTIVE', @now, @now)`
  ).run({ id, now, ...input });
  return findStationById(id)!;
}

export function updateStation(
  id: string,
  data: Partial<{ name: string; location: string; status: StationStatus }>
): ChargingStationRow {
  const current = findStationById(id)!;
  db.prepare('UPDATE ChargingStation SET name=?, location=?, status=?, updatedAt=? WHERE id=?').run(
    data.name ?? current.name,
    data.location ?? current.location,
    data.status ?? current.status,
    nowISO(),
    id
  );
  return findStationById(id)!;
}

export function deleteStation(id: string) {
  db.prepare('DELETE FROM ChargingStation WHERE id = ?').run(id);
}

export function chargerCountForStation(stationId: string): number {
  return (
    db.prepare('SELECT COUNT(*) as c FROM Charger WHERE stationId = ?').get(stationId) as {
      c: number;
    }
  ).c;
}

// --- Chargers ------------------------------------------------------------

export interface ChargerWithStation extends ChargerRow {
  stationName: string;
  stationLocation: string;
  stationOwnerId: string;
}

export function listChargers(filters: { stationId?: string; ownerId?: string }): ChargerWithStation[] {
  let sql = `
    SELECT c.*, s.name as stationName, s.location as stationLocation, s.ownerId as stationOwnerId
    FROM Charger c JOIN ChargingStation s ON s.id = c.stationId WHERE 1=1`;
  const params: Record<string, unknown> = {};
  if (filters.stationId) {
    sql += ' AND c.stationId = @stationId';
    params.stationId = filters.stationId;
  }
  if (filters.ownerId) {
    sql += ' AND s.ownerId = @ownerId';
    params.ownerId = filters.ownerId;
  }
  sql += ' ORDER BY c.name ASC';
  return db.prepare(sql).all(params) as ChargerWithStation[];
}

export function findChargerById(id: string): ChargerRow | undefined {
  return db.prepare('SELECT * FROM Charger WHERE id = ?').get(id) as ChargerRow | undefined;
}

export function findChargerWithStation(id: string): ChargerWithStation | undefined {
  return db
    .prepare(
      `SELECT c.*, s.name as stationName, s.location as stationLocation, s.ownerId as stationOwnerId
       FROM Charger c JOIN ChargingStation s ON s.id = c.stationId WHERE c.id = ?`
    )
    .get(id) as ChargerWithStation | undefined;
}

export function createCharger(input: {
  stationId: string;
  name: string;
  connectorType: string;
  power: number;
  price: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
}): ChargerRow {
  const id = newId('charger');
  const now = nowISO();
  db.prepare(
    `INSERT INTO Charger (id, stationId, name, connectorType, power, price, status, operatingHoursStart, operatingHoursEnd, createdAt, updatedAt)
     VALUES (@id, @stationId, @name, @connectorType, @power, @price, 'AVAILABLE', @operatingHoursStart, @operatingHoursEnd, @now, @now)`
  ).run({ id, now, ...input });
  return findChargerById(id)!;
}

export function updateCharger(
  id: string,
  data: Partial<{
    name: string;
    connectorType: string;
    power: number;
    price: number;
    status: ChargerStatus;
    operatingHoursStart: string;
    operatingHoursEnd: string;
  }>
): ChargerRow {
  const current = findChargerById(id)!;
  const merged = { ...current, ...data };
  db.prepare(
    `UPDATE Charger SET name=@name, connectorType=@connectorType, power=@power, price=@price,
       status=@status, operatingHoursStart=@operatingHoursStart, operatingHoursEnd=@operatingHoursEnd, updatedAt=@updatedAt
     WHERE id=@id`
  ).run({ ...merged, updatedAt: nowISO() });
  return findChargerById(id)!;
}

export function deleteCharger(id: string) {
  db.prepare('DELETE FROM Charger WHERE id = ?').run(id);
}

export function activeReservationCountForCharger(chargerId: string): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM ChargingReservation WHERE chargerId = ? AND status IN ('UPCOMING','ACTIVE')`
      )
      .get(chargerId) as { c: number }
  ).c;
}

// --- Reservations ----------------------------------------------------------

export interface ReservationWithMeta extends ChargingReservationRow {
  chargerName: string;
  stationName: string;
  stationLocation: string;
  userName: string;
  userEmail: string;
}

export function listReservations(filters: {
  userId?: string;
  ownerId?: string;
}): ReservationWithMeta[] {
  let sql = `
    SELECT r.*, c.name as chargerName, s.name as stationName, s.location as stationLocation,
           u.name as userName, u.email as userEmail
    FROM ChargingReservation r
    JOIN Charger c ON c.id = r.chargerId
    JOIN ChargingStation s ON s.id = c.stationId
    JOIN User u ON u.id = r.userId
    WHERE 1=1`;
  const params: Record<string, unknown> = {};
  if (filters.userId) {
    sql += ' AND r.userId = @userId';
    params.userId = filters.userId;
  }
  if (filters.ownerId) {
    sql += ' AND s.ownerId = @ownerId';
    params.ownerId = filters.ownerId;
  }
  sql += ' ORDER BY r.date DESC, r.startTime DESC LIMIT 200';
  return db.prepare(sql).all(params) as ReservationWithMeta[];
}

export function findReservationById(id: string): ChargingReservationRow | undefined {
  return db.prepare('SELECT * FROM ChargingReservation WHERE id = ?').get(id) as
    | ChargingReservationRow
    | undefined;
}

export function findReservationWithMeta(
  id: string
): (ReservationWithMeta & { stationOwnerId: string }) | undefined {
  return db
    .prepare(
      `SELECT r.*, c.name as chargerName, s.name as stationName, s.location as stationLocation,
              s.ownerId as stationOwnerId, u.name as userName, u.email as userEmail
       FROM ChargingReservation r
       JOIN Charger c ON c.id = r.chargerId
       JOIN ChargingStation s ON s.id = c.stationId
       JOIN User u ON u.id = r.userId
       WHERE r.id = ?`
    )
    .get(id) as (ReservationWithMeta & { stationOwnerId: string }) | undefined;
}

export function reservationsForChargerOnDate(chargerId: string, date: string) {
  return db
    .prepare('SELECT * FROM ChargingReservation WHERE chargerId = ? AND date = ?')
    .all(chargerId, date) as ChargingReservationRow[];
}

export function createReservation(input: {
  chargerId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
}): ChargingReservationRow {
  const id = newId('reservation');
  const now = nowISO();
  db.prepare(
    `INSERT INTO ChargingReservation (id, chargerId, userId, date, startTime, endTime, amount, paymentStatus, status, createdAt)
     VALUES (@id, @chargerId, @userId, @date, @startTime, @endTime, @amount, 'PAID', 'UPCOMING', @now)`
  ).run({ id, now, ...input });
  return findReservationById(id)!;
}

export function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  paymentStatus?: PaymentStatus
) {
  if (paymentStatus) {
    db.prepare('UPDATE ChargingReservation SET status = ?, paymentStatus = ? WHERE id = ?').run(
      status,
      paymentStatus,
      id
    );
  } else {
    db.prepare('UPDATE ChargingReservation SET status = ? WHERE id = ?').run(status, id);
  }
  return findReservationById(id)!;
}

export function countStations(): number {
  return (db.prepare('SELECT COUNT(*) as c FROM ChargingStation').get() as { c: number }).c;
}

export function countReservations(): number {
  return (db.prepare('SELECT COUNT(*) as c FROM ChargingReservation').get() as { c: number }).c;
}

export function sumReservationRevenue(): number {
  return (
    db
      .prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM ChargingReservation WHERE status != 'CANCELLED'`)
      .get() as { s: number }
  ).s;
}

export function reservationRevenueByDay(ownerId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT r.date as day, SUM(r.amount) as revenue, COUNT(*) as count
       FROM ChargingReservation r
       JOIN Charger c ON c.id = r.chargerId
       JOIN ChargingStation s ON s.id = c.stationId
       WHERE s.ownerId = ? AND r.status != 'CANCELLED' AND r.date >= ?
       GROUP BY r.date ORDER BY r.date ASC`
    )
    .all(ownerId, sinceStr) as { day: string; revenue: number; count: number }[];

  const map = new Map(rows.map((r) => [r.day, r]));
  const result: { day: string; revenue: number; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(map.get(key) ?? { day: key, revenue: 0, count: 0 });
  }
  return result;
}

export function chargerUtilization(ownerId: string) {
  return db
    .prepare(
      `SELECT c.name, COUNT(r.id) as totalQty
       FROM Charger c
       JOIN ChargingStation s ON s.id = c.stationId
       LEFT JOIN ChargingReservation r ON r.chargerId = c.id AND r.status != 'CANCELLED'
       WHERE s.ownerId = ?
       GROUP BY c.id, c.name
       ORDER BY totalQty DESC`
    )
    .all(ownerId) as { name: string; totalQty: number }[];
}
