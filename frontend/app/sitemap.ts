import type { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';
import type { ApiEnvelope, Product } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  let products: Product[] = [];
  try {
    const response = await fetch(`${API_URL}/products?page=1&limit=100`, { next: { revalidate: 3600 } });
    if (response.ok) products = ((await response.json()) as ApiEnvelope<Product[]>).data;
  } catch {}
  return [{ url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 }, ...products.map((product) => ({ url: `${base}/produk/${product.id}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 }))];
}
