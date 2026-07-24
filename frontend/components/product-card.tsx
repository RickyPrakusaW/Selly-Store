'use client';

import { Heart, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveImageUrl } from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { Product } from '@/lib/types';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function ProductCard({ product, priority = false }: Readonly<{ product: Product; priority?: boolean }>) {
  const router = useRouter();
  const addToCart = useSeliStore((state) => state.addToCart);
  const rawImage = product.images?.find((item) => item.isPrimary)?.imageUrl ?? product.images?.[0]?.imageUrl;
  const image = resolveImageUrl(rawImage);
  const isPo = product.stockType?.toString().toLowerCase().includes('pre');
  const isBoard = product.category?.slug === 'papan_ucapan' || product.stockType?.toString().toLowerCase().includes('rental');
  const hasVariants = product.variants && product.variants.length > 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBoard || hasVariants) {
      router.push(`/produk/${product.id}`);
    } else {
      void addToCart(product);
    }
  };

  return (
    <article className="product-card" id={product.category?.slug}>
      <Link href={`/produk/${product.id}`} className="product-image-wrap">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={`${product.name} dari Seli Florist`}
            className="product-image"
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (



          <div className="product-placeholder" aria-hidden="true"><Package /><span>seli</span></div>
        )}

        <span className={`stock-badge ${isPo ? 'po' : ''}`}>{isPo ? 'Pre-order' : 'Ready stock'}</span>
      </Link>
      <div className="product-copy">
        <div className="product-topline">
          <span>{product.category?.name ?? 'Koleksi'}</span>
          <button aria-label={`Simpan ${product.name}`}><Heart size={16} /></button>
        </div>
        <Link href={`/produk/${product.id}`}><h3>{product.name}</h3></Link>
        <div className="product-price">
          <strong>{rupiah.format(Number(product.basePrice))}</strong>
          <button
            onClick={handleAddClick}
            aria-label={`Tambah ${product.name} ke keranjang`}
            title={isBoard ? 'Pilih tanggal sewa' : 'Tambah ke keranjang'}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
