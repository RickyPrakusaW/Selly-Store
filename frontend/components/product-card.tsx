'use client';

import { Heart, Plus, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSeliStore } from '@/lib/store';
import type { Product } from '@/lib/types';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const addToCart = useSeliStore((state) => state.addToCart);
  const image = product.images.find((item) => item.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl;
  const isPo = product.stockType.toString().toLowerCase().includes('pre');
  return <article className="product-card" id={product.category.slug}>
    <Link href={`/produk/${product.id}`} className="product-image-wrap">
      {image ? <Image src={image} alt={`${product.name} dari Seli Florist`} fill sizes="(max-width: 600px) 50vw, 25vw" className="product-image" /> : <div className="product-placeholder" aria-hidden="true"><Sparkles /><span>seli</span></div>}
      <span className={`stock-badge ${isPo ? 'po' : ''}`}>{isPo ? 'Pre-order' : 'Ready stock'}</span>
    </Link>
    <div className="product-copy">
      <div className="product-topline"><span>{product.category.name}</span><button aria-label={`Simpan ${product.name}`}><Heart size={17} /></button></div>
      <Link href={`/produk/${product.id}`}><h3>{product.name}</h3></Link>
      <div className="product-price"><strong>{rupiah.format(Number(product.basePrice))}</strong><button onClick={() => addToCart(product)} aria-label={`Tambah ${product.name} ke keranjang`}><Plus size={18} /></button></div>
    </div>
  </article>;
}
