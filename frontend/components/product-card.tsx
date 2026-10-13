'use client';

import { ArrowRight, Heart, Package, Plus, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { Product } from '@/lib/types';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function ProductCard({
  product,
  priority = false,
}: Readonly<{ product: Product; priority?: boolean }>) {
  const router = useRouter();
  const addToCart = useSeliStore((state) => state.addToCart);
  const showToast = useSeliStore((state) => state.showToast);
  const user = useSeliStore((state) => state.user);
  const wishlist = useSeliStore((state) => state.wishlist);
  const toggleWishlist = useSeliStore((state) => state.toggleWishlist);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isAdding, setIsAdding] = useState(false);

  const isLiked = mounted && Boolean(user) && wishlist.some((p) => p.id === product.id);

  const rawImage =
    product.images?.find((item) => item.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl;
  const image = resolveImageUrl(rawImage);
  const isPo = product.stockType?.toString().toLowerCase().includes('pre');
  const isBoard =
    product.category?.slug === 'papan_ucapan' ||
    product.stockType?.toString().toLowerCase().includes('rental');
  const hasVariants = Boolean(product.variants && product.variants.length > 0);

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBoard || hasVariants) {
      router.push(`/produk/${product.id}`);
    } else {
      setIsAdding(true);
      await addToCart(product);
      showToast(`${product.name} berhasil ditambahkan ke keranjang`, 'success');
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
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
          <div className="product-placeholder" aria-hidden="true">
            <Package size={32} />
            <span>Seli</span>
          </div>
        )}

        {/* Stock / Type Badge */}
        <span
          className={`stock-badge ${isBoard ? 'rental' : isPo ? 'po' : 'ready'}`}
        >
          {isBoard
            ? 'Sewa Papan'
            : isPo
            ? `Pre-Order (${product.poDays ?? 3}H)`
            : 'Ready Stock'}
        </span>

        {/* Interactive Wishlist Heart Button */}
        <button
          type="button"
          className={`card-wishlist-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleHeartClick}
          aria-label={
            isLiked
              ? `Hapus ${product.name} dari favorit`
              : `Simpan ${product.name} ke favorit`
          }
        >
          <Heart
            size={16}
            fill={isLiked ? '#e11d48' : 'none'}
            color={isLiked ? '#e11d48' : '#776a70'}
          />
        </button>
      </Link>

      <div className="product-copy">
        <div className="product-topline">
          <span className="product-category-tag">
            {product.category?.name ?? 'Koleksi'}
          </span>
          <span className="product-rating-hint">
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
            <strong>4.9</strong>
          </span>
        </div>

        <Link href={`/produk/${product.id}`} className="product-title-link">
          <h3 title={product.name}>{product.name}</h3>
        </Link>

        <div className="product-price">
          <div className="price-column">
            <small className="price-prefix">Mulai dari</small>
            <strong className="price-amount">
              {rupiah.format(Number(product.basePrice))}
            </strong>
          </div>

          <button
            type="button"
            className={`card-action-btn ${
              isBoard || hasVariants ? 'has-options' : ''
            } ${isAdding ? 'adding' : ''}`}
            onClick={handleAddClick}
            aria-label={
              isBoard || hasVariants
                ? `Pilih opsi ${product.name}`
                : `Tambah ${product.name} ke keranjang`
            }
            title={
              isBoard
                ? 'Pilih jadwal sewa'
                : hasVariants
                ? 'Pilih varian'
                : 'Tambah ke keranjang'
            }
          >
            {isBoard || hasVariants ? (
              <span className="action-pill-text">
                Pilih <ArrowRight size={13} />
              </span>
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
