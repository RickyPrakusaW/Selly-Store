export type Category = { id: string; slug: string; name: string };

export type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: string | number;
  stockType: 'READY_STOCK' | 'PRE_ORDER' | 'ready_stock' | 'pre_order';
  availableQty: number;
  category: Category;
  images: Array<{ id: string; imageUrl: string; isPrimary: boolean }>;
  variants: Array<{ id: string; variantName: string; priceDelta: string | number }>;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  isVerified: boolean;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
};
