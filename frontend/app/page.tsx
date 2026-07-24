import { Storefront } from "@/components/storefront";
import { API_URL } from "@/lib/api";
import type { ApiEnvelope, Category, Product } from "@/lib/types";

async function catalog<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return [];
    const body = (await response.json()) as ApiEnvelope<T[]>;
    return body.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    catalog<Product>("/products?page=1&limit=24"),
    catalog<Category>("/categories"),
  ]);
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "Seli Florist",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
    priceRange: "RpRp",
    areaServed: "Indonesia",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c"),
        }}
      />
      <Storefront initialProducts={products} categories={categories} />
    </>
  );
}
