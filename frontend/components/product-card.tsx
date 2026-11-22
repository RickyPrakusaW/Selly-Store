"use client";

import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Heart,
  Package,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useMounted } from "@/lib/use-mounted";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function ProductCard({
  product,
  priority = false,
  badge,
}: Readonly<{ product: Product; priority?: boolean; badge?: string }>) {
  const router = useRouter();
  const addToCart = useSeliStore((state) => state.addToCart);
  const showToast = useSeliStore((state) => state.showToast);
  const user = useSeliStore((state) => state.user);
  const wishlist = useSeliStore((state) => state.wishlist);
  const toggleWishlist = useSeliStore((state) => state.toggleWishlist);

  const mounted = useMounted();

  const [isAdding, setIsAdding] = useState(false);

  const isLiked =
    mounted && Boolean(user) && wishlist.some((p) => p.id === product.id);

  const rawImage =
    product.images?.find((item) => item.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl;
  const image = resolveImageUrl(rawImage);
  const isPo = product.stockType?.toString().toLowerCase().includes("pre");
  const isBoard =
    product.category?.slug === "papan_ucapan" ||
    product.stockType?.toString().toLowerCase().includes("rental");
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const basePrice = Number(product.basePrice);
  const availableQty = product.availableQty ?? product.stockQty ?? 0;
  const isSoldOut = !isPo && !isBoard && availableQty <= 0;

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    if (isBoard || hasVariants) {
      router.push(`/produk/${product.id}`);
    } else {
      setIsAdding(true);
      await addToCart(product);
      showToast(`${product.name} berhasil ditambahkan ke keranjang`, "success");
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article className={`product-card ${isSoldOut ? "is-sold-out" : ""}`} id={product.category?.slug}>
      <Link href={`/produk/${product.id}`} className="product-image-wrap">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={`${product.name} dari LICHARY Florist`}
            className="product-image"
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="product-placeholder" aria-hidden="true">
            <Package size={32} />
            <span>Lichary</span>
          </div>
        )}

        <span
          className={`stock-badge ${badge ? "bestseller" : isBoard ? "rental" : isPo ? "po" : "ready"}`}
        >
          {badge ??
            (isBoard
              ? "Sewa Papan"
              : isPo
                ? `Pre-Order (${product.poDays ?? 3}H)`
                : "Ready Stock")}
        </span>

        <button
          type="button"
          className={`card-wishlist-btn ${isLiked ? "liked" : ""}`}
          onClick={handleHeartClick}
          aria-label={
            isLiked
              ? `Hapus ${product.name} dari favorit`
              : `Simpan ${product.name} ke favorit`
          }
        >
          <Heart
            size={16}
            fill={isLiked ? "#e11d48" : "none"}
            color={isLiked ? "#e11d48" : "#776a70"}
          />
        </button>
        <span className="product-image-shade" aria-hidden="true" />
      </Link>

      <div className="product-copy">
        <div className="product-topline">
          <span className="product-category-tag">
            {product.category?.name ?? "Koleksi"}
          </span>
        </div>

        <Link href={`/produk/${product.id}`} className="product-title-link">
          <h3 title={product.name}>{product.name}</h3>
        </Link>

        <div className="product-card-meta">
          {isBoard ? (
            <span><CalendarCheck size={13} /> Pilih tanggal</span>
          ) : isPo ? (
            <span><CheckCircle2 size={13} /> {product.poDays ?? 3} hari pengerjaan</span>
          ) : isSoldOut ? (
            <span className="sold-out-label">Stok sedang habis</span>
          ) : (
            <span><CheckCircle2 size={13} /> Tersedia {availableQty} item</span>
          )}
        </div>

        <div className="product-price">
          <div className="price-column">
            <div className="price-topline">
              <small className="price-prefix">Mulai dari</small>
              <span className="product-dp">
                DP 50% <b>{rupiah.format(basePrice / 2)}</b>
              </span>
            </div>
            <strong className="price-amount">
              {rupiah.format(basePrice)}{isBoard ? " / hari" : ""}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className={`card-action-btn ${
            isBoard || hasVariants ? "has-options" : ""
          } ${isAdding ? "adding" : ""}`}
          onClick={handleAddClick}
          disabled={isSoldOut || isAdding}
          aria-label={
            isBoard || hasVariants
              ? `Pilih opsi ${product.name}`
              : `Tambah ${product.name} ke keranjang`
          }
          title={
            isBoard
              ? "Pilih jadwal sewa"
              : hasVariants
                ? "Pilih varian"
                : "Tambah ke keranjang"
          }
        >
          {isSoldOut ? (
            <span className="action-pill-text">Stok Habis</span>
          ) : isBoard ? (
            <span className="action-pill-text">
              Jadwal &amp; Sewa <ArrowRight size={13} />
            </span>
          ) : hasVariants ? (
            <span className="action-pill-text">
              Pilih Varian <ArrowRight size={13} />
            </span>
          ) : (
            <span className="action-pill-text">
              <ShoppingBag size={13} /> + Keranjang
            </span>
          )}
        </button>
      </div>
    </article>
  );
}
