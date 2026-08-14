export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  cafeteriaId: string;
  cafeteriaName: string;
  image?: string | null;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const FOOD_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Beverages',
  'Desserts',
  'Specials',
] as const;

export const CONNECTOR_TYPES = ['Type 2', 'CCS2', 'CHAdeMO', 'GB/T'] as const;
