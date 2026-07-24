"use client";

import {
  Calendar,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useSeliStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function ProductDetailInteractive({
  product,
}: Readonly<{ product: Product }>) {
  const addToCart = useSeliStore((state) => state.addToCart);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [customNote, setCustomNote] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedVariant = product.variants?.find(
    (v) => v.id === selectedVariantId,
  );
  const basePrice = Number(product.basePrice);
  const deltaPrice = selectedVariant ? Number(selectedVariant.priceDelta) : 0;
  const totalPrice = (basePrice + deltaPrice) * qty;

  const isRental =
    product.stockType?.toString().toLowerCase().includes("rental") ||
    product.category?.slug === "papan_ucapan";

  const isPo = product.stockType?.toString().toLowerCase().includes("pre");

  const showToast = useSeliStore((state) => state.showToast);

  const handleAddToCart = async () => {
    if (isRental && !bookingDate) {
      showToast("Silakan pilih Tanggal Mulai Sewa terlebih dahulu.", "error");
      return;
    }
    setLoading(true);
    await addToCart(product, selectedVariantId || undefined, qty, {
      ...(customNote.trim() ? { customNote: customNote.trim() } : {}),
      ...(bookingDate ? { bookingDate } : {}),
      ...(bookingEndDate ? { bookingEndDate } : {}),
    });
    setLoading(false);
  };

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077";
  const waText = encodeURIComponent(
    `Halo Seli Florist, saya tertarik dengan ${product.name}${
      selectedVariant ? ` (${selectedVariant.variantName})` : ""
    }. Total Rp ${totalPrice.toLocaleString("id-ID")}`,
  );
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;

  return (
    <div className="product-interactive-form">
      <div className="price-display-wrap">
        <strong className="detail-price">{rupiah.format(totalPrice)}</strong>
        {qty > 1 && (
          <small className="unit-price">
            ({rupiah.format(basePrice + deltaPrice)} / unit)
          </small>
        )}
      </div>

      {/* Stock & PO Badges */}
      <div className="badges-row">
        <span className={`stock-badge inline ${isPo ? "po" : ""}`}>
          {isPo ? `Pre-Order (${product.poDays ?? 3} Hari)` : "Ready Stock"}
        </span>
        {product.availableQty > 0 && (
          <span className="available-count">
            Stok tersedia: {product.availableQty}
          </span>
        )}
      </div>

      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="option-group">
          <label className="option-label">Pilih Varian / Ukuran:</label>
          <div className="variant-buttons">
            {product.variants.map((variant) => {
              const delta = Number(variant.priceDelta);
              return (
                <button
                  key={variant.id}
                  type="button"
                  className={`variant-chip ${selectedVariantId === variant.id ? "active" : ""}`}
                  onClick={() => setSelectedVariantId(variant.id)}
                >
                  {variant.variantName}
                  {delta !== 0 && (
                    <small>
                      {" "}
                      ({delta > 0 ? "+" : ""}
                      {rupiah.format(delta)})
                    </small>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="option-group">
        <label className="option-label">Jumlah Pasangan / Unit:</label>
        <div className="qty-picker">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
          >
            <Minus size={16} />
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty(qty + 1)}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Rental Booking Dates */}
      {isRental && (
        <div className="option-group rental-dates-box">
          <label className="option-label">
            <Calendar size={16} /> Jadwal Sewa Unit Papan Ucapan:
          </label>
          <div className="date-inputs">
            <div>
              <small>Tanggal Mulai / Acara:</small>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div>
              <small>Tanggal Selesai (Opsional):</small>
              <input
                type="date"
                min={bookingDate || new Date().toISOString().split("T")[0]}
                value={bookingEndDate}
                onChange={(e) => setBookingEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Text / Request Note */}
      <div className="option-group">
        <label className="option-label">
          Pesan / Tulisan Khusus (Papan / Kartu Ucapan):
        </label>
        <textarea
          rows={3}
          placeholder="Contoh: Selamat & Sukses atas Pernikahan Budi & Ani — dari PT Sinar Jaya"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          maxLength={1000}
        />
      </div>

      {/* Benefits */}
      <div className="detail-benefits">
        <span>
          <Check /> Dirangkai segar oleh florist berpengalaman
        </span>
        <span>
          <ShieldCheck /> Jaminan tepat waktu &amp; pengiriman aman
        </span>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-group">
        <button
          type="button"
          className="primary-button add-cart-btn"
          disabled={loading}
          onClick={() => void handleAddToCart()}
        >
          <ShoppingBag size={18} />
          {loading ? "Menambahkan…" : "Tambah ke Keranjang"}
        </button>

        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="wa-order-btn"
        >
          <MessageCircle size={18} />
          Pesan via WhatsApp
        </a>
      </div>
    </div>
  );
}
