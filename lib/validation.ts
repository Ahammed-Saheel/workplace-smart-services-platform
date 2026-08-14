import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(100),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(80),
  description: z.string().trim().max(300).optional().nullable(),
  price: z.number().positive('Price must be greater than zero.'),
  category: z.string().trim().min(1, 'Choose a category.'),
  image: z.string().trim().max(300).optional().nullable(),
  preparationTime: z.number().int().min(1).max(120),
  available: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const createOrderSchema = z.object({
  cafeteriaId: z.string().min(1),
  items: z.array(cartItemSchema).min(1, 'Your cart is empty.'),
  pickupTime: z.string().min(1, 'Choose a pickup time.'),
});

export const orderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
});

export const foodRequestSchema = z.object({
  cafeteriaId: z.string().min(1),
  name: z.string().trim().min(2, 'Tell us the dish name.').max(80),
  description: z.string().trim().max(300).optional().nullable(),
});

export const foodRequestStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'PLANNED', 'ADDED_TO_MENU', 'REJECTED']),
});

export const createPollSchema = z.object({
  title: z.string().trim().min(3, 'Give the poll a title.').max(120),
  description: z.string().trim().max(300).optional().nullable(),
  options: z
    .array(z.string().trim().min(1).max(60))
    .min(2, 'Add at least 2 options.')
    .max(6, 'Add at most 6 options.'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const pollVoteSchema = z.object({
  optionId: z.string().min(1),
});

export const chargingStationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(80),
  location: z.string().trim().min(2, 'Location is required.').max(120),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const chargerSchema = z.object({
  stationId: z.string().min(1),
  name: z.string().trim().min(1, 'Charger name is required.').max(40),
  connectorType: z.string().trim().min(1, 'Choose a connector type.'),
  power: z.number().positive('Power must be greater than zero.'),
  price: z.number().min(0, 'Price cannot be negative.'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OFFLINE']).optional(),
  operatingHoursStart: z.string().min(1),
  operatingHoursEnd: z.string().min(1),
});

export const createReservationSchema = z.object({
  chargerId: z.string().min(1),
  date: z.string().min(1, 'Choose a date.'),
  startTime: z.string().min(1, 'Choose a start time.'),
  endTime: z.string().min(1, 'Choose an end time.'),
});

export const adminUserUpdateSchema = z.object({
  active: z.boolean().optional(),
  role: z
    .enum(['EMPLOYEE', 'CAFETERIA_OWNER', 'CHARGING_OWNER', 'ADMIN'])
    .optional(),
});

export const cafeteriaStatusSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  active: z.boolean().optional(),
});
