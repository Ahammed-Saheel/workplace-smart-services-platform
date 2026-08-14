export type Role = 'EMPLOYEE' | 'CAFETERIA_OWNER' | 'CHARGING_OWNER' | 'ADMIN';
export type CafeteriaStatus = 'OPEN' | 'CLOSED';
export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';
export type FoodRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PLANNED'
  | 'ADDED_TO_MENU'
  | 'REJECTED';
export type StationStatus = 'ACTIVE' | 'INACTIVE';
export type ChargerStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OFFLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type ReservationStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type NotificationType = 'ORDER' | 'CHARGING' | 'REQUEST' | 'POLL' | 'SYSTEM';

export interface WorkplaceRow {
  id: string;
  name: string;
  location: string;
  description: string | null;
  active: number;
  createdAt: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  workplaceId: string | null;
  active: number;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<UserRow, 'passwordHash' | 'resetToken' | 'resetTokenExpiry'>;

export interface CafeteriaRow {
  id: string;
  workplaceId: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: CafeteriaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemRow {
  id: string;
  cafeteriaId: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  preparationTime: number;
  available: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRow {
  id: string;
  customerId: string;
  cafeteriaId: string;
  pickupTime: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRow {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface FoodRequestRow {
  id: string;
  customerId: string;
  cafeteriaId: string;
  name: string;
  description: string | null;
  status: FoodRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PollRow {
  id: string;
  cafeteriaId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  active: number;
  createdAt: string;
}

export interface PollOptionRow {
  id: string;
  pollId: string;
  option: string;
}

export interface PollVoteRow {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface ChargingStationRow {
  id: string;
  workplaceId: string;
  ownerId: string;
  name: string;
  location: string;
  status: StationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChargerRow {
  id: string;
  stationId: string;
  name: string;
  connectorType: string;
  power: number;
  price: number;
  status: ChargerStatus;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChargingReservationRow {
  id: string;
  chargerId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentStatus: PaymentStatus;
  status: ReservationStatus;
  createdAt: string;
}

export interface NotificationRow {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: number;
  link: string | null;
  createdAt: string;
}

export interface AuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  timestamp: string;
}
