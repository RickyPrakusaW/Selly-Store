"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, checkout, estimateOngkir } from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { CheckoutPayload, DeliveryType } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Persisted cart/auth state is client-only and is revealed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const user = useSeliStore((state) => state.user);
  const cartItems = useSeliStore((state) => state.cartItems);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const clearCart = useSeliStore((state) => state.clearCart);
  const showToast = useSeliStore((state) => state.showToast);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [customerName, setCustomerName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [latitude, setLatitude] = useState("-6.9175"); // Default Bandung
  const [longitude, setLongitude] = useState("107.6191");
  const [customTextRequest, setCustomTextRequest] = useState("");

  const [ongkirFee, setOngkirFee] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill from user data
  /* eslint-disable react-hooks/set-state-in-effect -- synchronize checkout fields when the authenticated user loads */
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || "");
      setWaNumber(user.phoneNumber || "");
      setRecipientName(user.fullName || "");
      setRecipientPhone(user.phoneNumber || "");
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Calculate items subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const base = Number(item.product.basePrice);
    const delta = item.variant ? Number(item.variant.priceDelta) : 0;
    return sum + (base + delta) * item.qty;
  }, 0);

  const effectiveOngkir = deliveryType === "PICKUP" ? 0 : (ongkirFee ?? 0);
  const total = subtotal + effectiveOngkir;
  const dpAmount = Math.ceil(total * 0.5);
  const remainingAmount = total - dpAmount;

  if (!mounted) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat formulir checkout…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <AlertCircle size={50} />
          <h2>Silakan Masuk Terlebih Dahulu</h2>
          <p>
            Anda harus masuk ke akun Seli Florist untuk melanjutkan pemesanan.
          </p>
          <button className="primary-button" onClick={() => setAuthOpen(true)}>
            Masuk / Daftar Sekarang
          </button>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <h2>Keranjang Kosong</h2>
          <p>
            Silakan tambahkan produk ke keranjang terlebih dahulu sebelum
            checkout.
          </p>
          <Link href="/" className="primary-button">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    );
  }

  const handleEstimateOngkir = async () => {
    if (deliveryType === "PICKUP") return;
    if (!fullAddress.trim() || fullAddress.length < 10) {
      setError("Alamat lengkap minimal 10 karakter untuk menghitung ongkir.");
      return;
    }
    setError("");
    setEstimating(true);
    try {
      const res = await estimateOngkir({
        deliveryType: "DELIVERY",
        address: {
          fullAddress,
          latitude,
          longitude,
        },
      });
      setOngkirFee(Number(res.ongkirFee));
      showToast("Ongkos kirim berhasil dihitung!");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal menghitung ongkos kirim.",
      );
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user.isVerified) {
      setError(
        "Akun Anda belum terverifikasi. Silakan periksa inbox email Anda untuk memverifikasi akun.",
      );
      return;
    }

    setSubmitting(true);
    let currentOngkir = ongkirFee;

    if (deliveryType === "DELIVERY" && currentOngkir === null) {
      if (!fullAddress.trim() || fullAddress.length < 10) {
        setError(
          "Alamat lengkap minimal 10 karakter untuk menghitung ongkos kirim.",
        );
        setSubmitting(false);
        return;
      }
      try {
        const res = await estimateOngkir({
          deliveryType: "DELIVERY",
          address: { fullAddress, latitude, longitude },
        });
        currentOngkir = Number(res.ongkirFee);
        setOngkirFee(currentOngkir);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal menghitung ongkos kirim.",
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      const idempotencyKey = generateUUID();
      const payload: CheckoutPayload = {
        deliveryType,
        customerName,
        waNumber,
        recipientName,
        recipientPhone,
        ...(customTextRequest.trim()
          ? { customTextRequest: customTextRequest.trim() }
          : {}),
        ...(deliveryType === "DELIVERY"
          ? {
              address: {
                fullAddress,
                latitude,
                longitude,
              },
            }
          : {}),
        items: cartItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          ...(item.customNote ? { customNote: item.customNote } : {}),
          ...(item.bookingDate ? { bookingDate: item.bookingDate } : {}),
          ...(item.bookingEndDate
            ? { bookingEndDate: item.bookingEndDate }
            : {}),
        })),
      };

      const order = await checkout(payload, idempotencyKey);
      const createdOrderId =
        order.id ?? (order as unknown as { orderId?: string }).orderId;
      await clearCart();
      showToast("Pesanan berhasil dibuat!");
      if (createdOrderId) {
        router.push(`/pesanan/${createdOrderId}`);
      } else {
        router.push("/pesanan");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal membuat pesanan. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="checkout-page shell">
      <Link href="/keranjang" className="back-link">
        <ArrowLeft size={18} /> Kembali ke Keranjang
      </Link>

      <header className="section-heading">
        <div>
          <p className="eyebrow">Langkah Terakhir</p>
          <h1>Selesaikan Pesanan</h1>
        </div>
      </header>

      {error && (
        <div className="inline-error checkout-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!user.isVerified && (
        <div className="verification-warning-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Status Akun: Belum Verifikasi</strong>
            <p>
              Silakan klik tautan verifikasi di email Anda sebelum membuat
              pesanan.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmitOrder(e)}
        className="checkout-grid"
      >
        {/* Left Column: Delivery & Customer Info */}
        <div className="checkout-forms">
          {/* Receiver & Customer */}
          <section className="checkout-card">
            <h2>1. Data Pemesan &amp; Penerima</h2>
            <div className="form-row-2">
              <label>
                Nama Pemesan *
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Anda"
                />
              </label>
              <label>
                WhatsApp Pemesan *
                <input
                  required
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="6281234567890"
                />
              </label>
            </div>
            <div className="form-row-2">
              <label>
                Nama Penerima *
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama yang menerima bunga"
                />
              </label>
              <label>
                Nomor HP Penerima *
                <input
                  required
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="6281234567890"
                />
              </label>
            </div>
          </section>

          {/* Delivery Option */}
          <section className="checkout-card">
            <h2>2. Metode Pengiriman</h2>
            <div className="delivery-type-selector">
              <label
                className={`radio-card ${deliveryType === "DELIVERY" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="DELIVERY"
                  checked={deliveryType === "DELIVERY"}
                  onChange={() => {
                    setDeliveryType("DELIVERY");
                    setOngkirFee(null);
                  }}
                />
                <Truck size={22} />
                <div>
                  <strong>Dikirim Kurir</strong>
                  <span>Diantar langsung ke lokasi tujuan</span>
                </div>
              </label>

              <label
                className={`radio-card ${deliveryType === "PICKUP" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="PICKUP"
                  checked={deliveryType === "PICKUP"}
                  onChange={() => {
                    setDeliveryType("PICKUP");
                    setOngkirFee(0);
                  }}
                />
                <MapPin size={22} />
                <div>
                  <strong>Ambil Mandiri (Pickup)</strong>
                  <span>Ambil sendiri di workshop Seli Florist</span>
                </div>
              </label>
            </div>

            {deliveryType === "DELIVERY" && (
              <div className="address-section">
                <label>
                  Alamat Lengkap Pengiriman *
                  <textarea
                    required
                    rows={3}
                    minLength={10}
                    value={fullAddress}
                    onChange={(e) => {
                      setFullAddress(e.target.value);
                      setOngkirFee(null);
                    }}
                    placeholder="Jl. Melati No. 123, RT 02/05, Kel. Bandung, Kota Bandung (Patokan dekat masjid)"
                  />
                </label>

                <div className="latlng-inputs">
                  <label>
                    Latitude:
                    <input
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </label>
                  <label>
                    Longitude:
                    <input
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="primary-button compact estimate-btn"
                  disabled={estimating || !fullAddress.trim()}
                  onClick={() => void handleEstimateOngkir()}
                >
                  {estimating ? "Menghitung…" : "Hitung Ongkos Kirim"}
                </button>

                {ongkirFee !== null && (
                  <div className="ongkir-result-box">
                    <CheckCircle2 size={18} />
                    <span>
                      Ongkos Kirim: <strong>{rupiah.format(ongkirFee)}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Custom Greeting Text */}
          <section className="checkout-card">
            <h2>3. Kartu / Papan Ucapan (Opsional)</h2>
            <label>
              Tuliskan Pesan / Ucapan Tambahan:
              <textarea
                rows={3}
                value={customTextRequest}
                onChange={(e) => setCustomTextRequest(e.target.value)}
                placeholder="Pesan ucapan yang ingin dicetak pada pita / kartu ucapan / papan bunga..."
              />
            </label>
          </section>
        </div>

        {/* Right Column: Order Summary & Action */}
        <aside className="checkout-summary-card">
          <h2>Ringkasan Biaya</h2>

          <div className="checkout-items-mini">
            {cartItems.map((item) => {
              const base = Number(item.product.basePrice);
              const delta = item.variant ? Number(item.variant.priceDelta) : 0;
              const itemTotal = (base + delta) * item.qty;
              return (
                <div key={item.id} className="mini-item-row">
                  <div>
                    <strong>{item.product.name}</strong>
                    {item.variant && (
                      <small> ({item.variant.variantName})</small>
                    )}
                    <span className="mini-qty"> x{item.qty}</span>
                  </div>
                  <span>{rupiah.format(itemTotal)}</span>
                </div>
              );
            })}
          </div>

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal Produk</span>
            <span>{rupiah.format(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Ongkos Kirim</span>
            <span>
              {deliveryType === "PICKUP"
                ? "Gratis (Pickup)"
                : ongkirFee !== null
                  ? rupiah.format(ongkirFee)
                  : "Belum dihitung"}
            </span>
          </div>

          <div className="summary-divider" />

          <div className="summary-row total-row">
            <span>Total Transaksi</span>
            <strong>{rupiah.format(total)}</strong>
          </div>

          <div className="payment-scheme-box">
            <div className="scheme-row dp">
              <span>Wajib DP 50% (Saat Ini):</span>
              <strong>{rupiah.format(dpAmount)}</strong>
            </div>
            <div className="scheme-row remaining">
              <span>Sisa Pelunasan (Sebelum Kirim):</span>
              <span>{rupiah.format(remainingAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button full-width"
            disabled={submitting}
          >
            {submitting ? "Memproses Pesanan…" : "Buat Pesanan Sekarang"}{" "}
            <ArrowRight size={18} />
          </button>

          <p className="checkout-note">
            * Pesanan akan diteruskan ke tim verifikasi. Anda dapat mengunggah
            bukti DP 50% di halaman berikutnya.
          </p>
        </aside>
      </form>
    </main>
  );
}
