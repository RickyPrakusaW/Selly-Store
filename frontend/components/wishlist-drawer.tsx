"use client";

import {
  ArrowRight,
  Heart,
  Package,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveImageUrl } from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function WishlistDrawer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wishlistOpen = useSeliStore((state) => state.wishlistOpen);
  const setWishlistOpen = useSeliStore((state) => state.setWishlistOpen);
  const wishlist = useSeliStore((state) => state.wishlist);
  const removeFromWishlist = useSeliStore((state) => state.removeFromWishlist);
  const clearWishlist = useSeliStore((state) => state.clearWishlist);
  const addToCart = useSeliStore((state) => state.addToCart);
  const showToast = useSeliStore((state) => state.showToast);

  const [addingId, setAddingId] = useState<string | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!wishlistOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWishlistOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [wishlistOpen, setWishlistOpen]);

  if (!mounted || !wishlistOpen) {
    return null;
  }

  const handleAddToCart = async (product: Product) => {
    const isBoard =
      product.category?.slug === "papan_ucapan" ||
      product.stockType?.toString().toLowerCase().includes("rental");
    const hasVariants = Boolean(product.variants && product.variants.length > 0);

    if (isBoard || hasVariants) {
      setWishlistOpen(false);
      window.location.href = `/produk/${product.id}`;
      return;
    }

    setAddingId(product.id);
    await addToCart(product);
    showToast(`${product.name} berhasil ditambahkan ke keranjang`, "success");
    setTimeout(() => setAddingId(null), 500);
  };

  return (
    <div
      className="wishlist-drawer-backdrop"
      onClick={() => setWishlistOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist dan Produk Favorit"
    >
      <div
        className="wishlist-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="wishlist-drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-heart-icon">
              <Heart size={20} fill="#e11d48" color="#e11d48" />
            </div>
            <div>
              <h3>Wishlist &amp; Favorit</h3>
              <small>{wishlist.length} produk tersimpan</small>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setWishlistOpen(false)}
            aria-label="Tutup Wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {wishlist.length === 0 ? (
          <div className="wishlist-empty-state">
            <div className="empty-heart-circle">
              <Heart size={44} color="#f43f5e" strokeWidth={1.5} />
            </div>
            <h4>Belum Ada Produk Favorit</h4>
            <p>
              Tandai bunga, buket, hampers, atau papan ucapan yang Anda sukai
              dengan menekan tombol hati pada produk.
            </p>
            <button
              type="button"
              className="drawer-explore-btn"
              onClick={() => {
                setWishlistOpen(false);
                const catalogEl = document.getElementById("katalog");
                if (catalogEl) {
                  catalogEl.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <span>Jelajahi Koleksi Bunga</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-items-scroll">
              {wishlist.map((item) => {
                const rawImg =
                  item.images?.find((img) => img.isPrimary)?.imageUrl ??
                  item.images?.[0]?.imageUrl;
                const imgUrl = resolveImageUrl(rawImg);
                const isBoard =
                  item.category?.slug === "papan_ucapan" ||
                  item.stockType?.toString().toLowerCase().includes("rental");
                const hasVariants = Boolean(
                  item.variants && item.variants.length > 0,
                );

                return (
                  <div key={item.id} className="wishlist-card-item">
                    <Link
                      href={`/produk/${item.id}`}
                      className="wishlist-item-thumb-link"
                      onClick={() => setWishlistOpen(false)}
                    >
                      {imgUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="wishlist-item-img"
                        />
                      ) : (
                        <div className="wishlist-item-placeholder">
                          <Package size={24} />
                        </div>
                      )}
                    </Link>

                    <div className="wishlist-item-details">
                      <div className="wishlist-item-topline">
                        <span className="wishlist-item-cat">
                          {item.category?.name ?? "Koleksi"}
                        </span>
                        <button
                          type="button"
                          className="wishlist-remove-btn"
                          onClick={() => removeFromWishlist(item.id)}
                          aria-label={`Hapus ${item.name} dari favorit`}
                          title="Hapus dari favorit"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <Link
                        href={`/produk/${item.id}`}
                        className="wishlist-item-name"
                        onClick={() => setWishlistOpen(false)}
                      >
                        {item.name}
                      </Link>

                      <div className="wishlist-item-price-row">
                        <strong className="wishlist-item-price">
                          {rupiah.format(Number(item.basePrice))}
                        </strong>

                        <button
                          type="button"
                          className={`wishlist-add-cart-btn ${
                            addingId === item.id ? "adding" : ""
                          }`}
                          onClick={() => void handleAddToCart(item)}
                          aria-label={`Tambah ${item.name} ke keranjang`}
                        >
                          {isBoard || hasVariants ? (
                            <span>Pilih →</span>
                          ) : (
                            <>
                              <ShoppingBag size={14} />
                              <span>+ Keranjang</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Clear All */}
            <div className="wishlist-drawer-footer">
              <button
                type="button"
                className="wishlist-clear-all-btn"
                onClick={clearWishlist}
              >
                <span>Kosongkan Semua</span>
              </button>
              <button
                type="button"
                className="wishlist-continue-btn"
                onClick={() => setWishlistOpen(false)}
              >
                <span>Lanjut Belanja</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
