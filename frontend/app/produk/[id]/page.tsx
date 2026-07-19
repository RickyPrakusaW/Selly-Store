import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Check, MessageCircle, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api';
import type { ApiEnvelope, Product } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return ((await response.json()) as ApiEnvelope<Product>).data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Produk tidak ditemukan' };
  const image = product.images[0]?.imageUrl;
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    alternates: { canonical: `/produk/${id}` },
    openGraph: { type: 'website', url: `/produk/${id}`, title: product.name, description: product.description, ...(image ? { images: [{ url: image, alt: product.name }] } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const image = product.images.find((item) => item.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl;
  const price = Number(product.basePrice);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: product.images.map((item) => item.imageUrl), sku: product.id, brand: { '@type': 'Brand', name: 'Seli Florist' }, offers: { '@type': 'Offer', url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/produk/${id}`, priceCurrency: 'IDR', price, availability: product.availableQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', itemCondition: 'https://schema.org/NewCondition' } };
  return <main className="product-page shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><Link href="/" className="back-link"><ArrowLeft size={18} /> Kembali ke koleksi</Link><div className="product-detail"><div className="detail-image">{image ? <Image src={image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 50vw" /> : <span>✿</span>}</div><section className="detail-copy"><p className="eyebrow">{product.category.name}</p><h1>{product.name}</h1><strong className="detail-price">{rupiah.format(price)}</strong><p>{product.description}</p><div className="detail-benefits"><span><Check /> Dirangkai segar</span><span><ShieldCheck /> Pembayaran aman</span>{product.category.slug === 'papan_ucapan' && <span><CalendarDays /> Jadwal unit terproteksi</span>}</div><a className="primary-button" href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281234567890'}?text=${encodeURIComponent(`Halo Seli Florist, saya tertarik dengan ${product.name}`)}`}><MessageCircle /> Pesan via WhatsApp</a></section></div></main>;
}
