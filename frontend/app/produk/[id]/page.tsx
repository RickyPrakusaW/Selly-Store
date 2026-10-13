import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { API_URL, resolveImageUrl } from '@/lib/api';
import type { ApiEnvelope, Product } from '@/lib/types';
import { ProductDetailInteractive } from '@/components/product-detail-interactive';

type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return ((await response.json()) as ApiEnvelope<Product>).data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Produk tidak ditemukan' };
  const image = resolveImageUrl(product.images[0]?.imageUrl);
  return {
    title: `${product.name} | Seli Florist`,
    description: product.description.slice(0, 155),
    alternates: { canonical: `/produk/${id}` },
    openGraph: {
      type: 'website',
      url: `/produk/${id}`,
      title: product.name,
      description: product.description,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const price = Number(product.basePrice);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((item) => resolveImageUrl(item.imageUrl)),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Seli Florist' },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/produk/${id}`,
      priceCurrency: 'IDR',
      price,
      availability:
        product.availableQty > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <main className="product-page shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Kembali ke Koleksi
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-muted">{product.category.name}</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-active">{product.name}</span>
      </nav>

      <ProductDetailInteractive product={product} />
    </main>
  );
}
