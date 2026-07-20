import type { Category } from './category';

export type ProductMode = 'sale' | 'rental';
export type StockType = 'ready_stock' | 'pre_order' | 'rental_unit';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  priceDelta: string;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  storageKey: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  productMode: ProductMode;
  stockType: StockType;
  basePrice: string;
  stockQty: number;
  reservedQty: number;
  poDays: number | null;
  isActive: boolean;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
}
