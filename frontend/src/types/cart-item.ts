import type { Product, ProductVariant } from './product';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  customNote: string | null;
  rentalStartAt: string | null;
  rentalEndAt: string | null;
  product?: Product;
  variant?: ProductVariant | null;
}
