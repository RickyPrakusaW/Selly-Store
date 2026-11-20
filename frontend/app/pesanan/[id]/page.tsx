"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  RefreshCw,
  Share2,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ApiError,
  cancelOrder,
  fetchOrderDetail,
} from "@/lib/api";
import { getStatusBadge } from "@/lib/order-status";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";
import { QrisPaymentBox } from "@/components/qris-payment-box";
import { useMounted } from "@/lib/use-mounted";
import { useSeliStore } from "@/lib/store";
import { formatBookingDate, type Order } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function getConciergeInfo(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        badgeText: "Tahap 1: Menunggu DP",
        title: "Menunggu Pembayaran DP 50%",
        desc: "Selesaikan pembayaran uang muka (DP 50%) via DOKU QRIS di bawah untuk memulai perangkaian pesanan Anda.",
        type: "warning",
      };
    case "DP_VERIFIED":
      return {
        badgeText: "Tahap 2: DP Terverifikasi",
        title: "DP 50% Berhasil Diterima",
        desc: "Pesanan telah dikonfirmasi dan masuk antrean florist. Rangkaian bunga segar Anda sedang disiapkan.",
        type: "success",
      };
    case "PROCESSING":
      return {
        badgeText: "Tahap 2: Sedang Dirangkai",
        title: "Bunga Sedang Dirangkai",
        desc: "Florist atelier LICHARY sedang merangkai pesanan Anda sesuai detail dan permintaan ucapan.",
        type: "info",
      };
    case "PENDING_FINAL_PAYMENT":
      return {
        badgeText: "Tahap 3: Menunggu Pelunasan",
        title: "Rangkaian Siap, Menunggu Pelunasan",
        desc: "Rangkaian bunga siap dikirimkan. Silakan selesaikan sisa pelunasan 50% melalui QRIS di bawah.",
        type: "warning",
      };
    case "FULLY_PAID":
      return {
        badgeText: "Tahap 3: Pembayaran Lunas",
        title: "Pembayaran Telah Lunas (100%)",
        desc: "Pelunasan berhasil dikonfirmasi. Rangkaian bunga dijadwalkan untuk pengiriman kurir / pengambilan mandiri.",
        type: "success",
      };
    case "COMPLETED":
      return {
        badgeText: "Tahap 4: Pesanan Selesai",
        title: "Pesanan Selesai & Telah Diterima",
        desc: "Rangkaian bunga telah sampai di tujuan. Terima kasih telah mempercayakan momen Anda kepada LICHARY Florist.",
        type: "success",
      };
    case "CANCELLED":
      return {
        badgeText: "Pesanan Dibatalkan",
        title: "Pesanan Telah Dibatalkan",
        desc: "Pesanan ini telah dibatalkan. Jika ada pertanyaan, silakan hubungi admin WhatsApp kami.",
        type: "neutral",
      };
    case "REJECTED":
      return {
        badgeText: "Pembayaran Ditolak",
        title: "Pembayaran Belum Berhasil",
        desc: "Sistem mendeteksi transaksi tidak valid. Silakan ulangi pembayaran atau hubungi admin via WhatsApp.",
        type: "danger",
      };
    default:
      return {
        badgeText: "Status Pesanan",
        title: "Pesanan Sedang Diproses",
        desc: "Informasi status pesanan diperbarui secara berkala.",
        type: "info",
      };
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const mounted = useMounted();
  const user = useSeliStore((state) => state.user);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const showToast = useSeliStore((state) => state.showToast);

  const [cancelReasonText, setCancelReasonText] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery<Order>({
    queryKey: ["order-detail", orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId && !!user,
  });

  if (!mounted || isLoading) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat detail pesanan…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <h2>Akses Terbatas</h2>
          <p>Silakan masuk ke akun Anda untuk melihat detail pesanan.</p>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 14 }}
            onClick={() => setAuthOpen(true)}
          >
            Masuk ke Akun
          </button>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <h2>Pesanan Tidak Ditemukan</h2>
          <Link href="/pesanan" className="primary-button">
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </main>
    );
  }

  const handleCancelOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!cancelReasonText.trim()) return;
    setCancelling(true);
    setModalError("");
    try {
      await cancelOrder(orderId, cancelReasonText);
      setShowCancelModal(false);
      setCancelReasonText("");
      showToast("Pesanan berhasil dibatalkan.");
      await refetch();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Gagal membatalkan pesanan.";
      setModalError(msg);
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyCode = async () => {
    if (!order) return;
    const code = `#ORDER-${order.id.slice(0, 8).toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      showToast("Nomor pesanan berhasil disalin!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast("Gagal menyalin nomor pesanan.");
    }
  };

  const createdDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const waHelpText = encodeURIComponent(
    `Halo Admin LICHARY Florist, saya ingin konfirmasi pesanan #ORDER-${order.id.slice(0, 8).toUpperCase()}`,
  );
  const waHelpLink = `https://wa.me/${waNumber}?text=${waHelpText}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWa = () => {
    const text =
      `🌸 *STRUK RESMI LICHARY FLORIST ATELIER* 🌸\n` +
      `No. Pesanan: #ORDER-${order.id.slice(0, 8).toUpperCase()}\n` +
      `Tanggal: ${createdDate}\n` +
      `Status: ${order.status}\n` +
      `Pemesan: ${order.customerName}\n` +
      `Penerima: ${order.recipientName} (${order.recipientPhone})\n` +
      `Alamat: ${order.deliveryAddress?.fullAddress || (order.deliveryType === "PICKUP" ? "Ambil di Workshop (Pickup)" : "-")}\n` +
      `--------------------------------\n` +
      `Total Belanja: ${rupiah.format(Number(order.total))}\n` +
      `DP Wajib 50%: ${rupiah.format(Number(order.dpAmount))}\n` +
      `Sisa Pelunasan: ${rupiah.format(Number(order.remainingAmount))}\n` +
      (order.customTextRequest ? `Ucapan: "${order.customTextRequest}"\n` : "") +
      `--------------------------------\n` +
      `Lacak pesanan online: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const badge = getStatusBadge(order.status);
  const currentStepNumber =
    order.status === "COMPLETED"
      ? 4
      : ["FULLY_PAID", "PROCESSING"].includes(order.status)
        ? 3
        : order.status !== "PENDING_PAYMENT" && order.status !== "REJECTED" && order.status !== "CANCELLED"
          ? 2
          : 1;
  const conciergeInfo = getConciergeInfo(order.status);

  return (
    <main className="order-detail-page shell">
      {/* 1. Sleek Top Navigation Bar */}
      <div className="order-detail-top-bar">
        <Link href="/pesanan" className="back-to-orders-btn">
          <ArrowLeft size={16} />
          <span>Pesanan Saya</span>
        </Link>
        <div className="top-bar-order-code">
          <Package size={14} className="order-code-icon" />
          <span>#ORDER-{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* 2. Luxury Hero Order Card */}
      <header className="order-hero-card">
        <div className="hero-card-main">
          <div className="hero-identity-group">
            <span className="hero-eyebrow">Detail Transaksi Pesanan</span>
            <div className="hero-code-row">
              <h1 className="hero-code-title">
                #ORDER-{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <button
                type="button"
                className="hero-copy-code-btn"
                onClick={handleCopyCode}
                title="Salin Nomor Pesanan"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedCode ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
            <p className="hero-created-time" suppressHydrationWarning>
              <Clock size={13} /> Dibuat pada {createdDate}
            </p>
          </div>

          <div className="hero-status-pill-wrap">
            <span className={`status-badge-pill ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Cohesive Action Row */}
        <div className="hero-actions-grid">
          <button
            type="button"
            className="hero-action-button btn-outline"
            onClick={handlePrint}
            title="Cetak struk resmi atau simpan sebagai PDF"
          >
            <Printer size={15} />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            className="hero-action-button btn-outline"
            onClick={handleShareWa}
            title="Bagikan ringkasan pesanan ke WhatsApp"
          >
            <Share2 size={15} />
            <span>Bagikan</span>
          </button>
          <a
            href={waHelpLink}
            target="_blank"
            rel="noreferrer"
            className="hero-action-button btn-wa"
            title="Hubungi Admin Florist via WhatsApp"
          >
            <MessageCircle size={15} />
            <span>Bantuan WA</span>
          </a>
        </div>
      </header>

      {error && (
        <div className="inline-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Luxury Progress Tracker Card */}
      {order.status !== "CANCELLED" && (
        <section className="order-progress-card">
          <div className="progress-card-header">
            <div className="progress-title-block">
              <h3>Status Alur Pesanan</h3>
              <p className="progress-status-badge">{conciergeInfo.badgeText}</p>
            </div>
            <span className="progress-step-counter">
              Langkah <strong>{currentStepNumber}</strong> dari 4
            </span>
          </div>

          {/* Connected Progress Track */}
          <div className="progress-stepper-visual">
            <div className="stepper-track-line">
              <div
                className="stepper-track-active"
                style={{
                  width: `${((currentStepNumber - 1) / 3) * 100}%`,
                }}
              />
            </div>
            <div className="stepper-nodes-row">
              {[
                { step: 1, label: "Dibuat" },
                { step: 2, label: "Verifikasi DP" },
                { step: 3, label: "Pelunasan" },
                { step: 4, label: "Selesai" },
              ].map((s) => {
                const isCompleted = currentStepNumber > s.step;
                const isCurrent = currentStepNumber === s.step;
                const isActive = isCompleted || isCurrent;
                return (
                  <div
                    key={s.step}
                    className={`stepper-node-item ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
                  >
                    <div className="stepper-dot-circle">
                      {isCompleted ? (
                        <Check size={11} strokeWidth={3} />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>
                    <span className="stepper-node-label">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concierge Status Box */}
          <div className={`concierge-status-box ${conciergeInfo.type}`}>
            <div className="concierge-icon-wrap">
              <Sparkles size={16} />
            </div>
            <div className="concierge-copy">
              <strong>{conciergeInfo.title}</strong>
              <p>{conciergeInfo.desc}</p>
            </div>
          </div>
        </section>
      )}

      <div className="order-detail-grid">
        {/* Left Column: Items & Delivery */}
        <div className="detail-left">
          {/* Item List */}
          <section className="checkout-card">
            <div className="card-section-title-row">
              <Package size={18} className="card-title-icon" />
              <h2>Daftar Bunga &amp; Item Pesanan</h2>
            </div>
            <div className="order-items-table">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div className="item-main-details">
                    <strong className="item-name-heading">{item.productNameSnapshot}</strong>
                    {item.variantNameSnapshot && (
                      <span className="item-variant-tag">
                        {" "}
                        ({item.variantNameSnapshot})
                      </span>
                    )}
                    {item.customNoteSnapshot && (
                      <p className="item-note-text">
                        Catatan: &quot;{item.customNoteSnapshot}&quot;
                      </p>
                    )}
                    {item.bookingDate && (
                      <p className="item-booking-date">
                        <Calendar size={13} /> Sewa:{" "}
                        {formatBookingDate(item.bookingDate)}{" "}
                        {item.bookingEndDate
                          ? `s/d ${formatBookingDate(item.bookingEndDate)}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="item-qty-price">
                    <span className="item-qty-badge">{item.qty}x</span>
                    <strong className="item-price-val">
                      {rupiah.format(Number(item.priceSnapshot) * item.qty)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery & Customer Info */}
          <section className="checkout-card">
            <div className="card-section-title-row">
              <Truck size={18} className="card-title-icon" />
              <h2>Informasi Pengiriman &amp; Penerima</h2>
            </div>
            <div className="info-grid-2">
              <div className="info-box-item">
                <small><User size={12} /> Pemesan / Customer:</small>
                <p>
                  <strong>{order.customerName}</strong> ({order.waNumber})
                </p>
              </div>
              <div className="info-box-item">
                <small><User size={12} /> Penerima Bunga:</small>
                <p>
                  <strong>{order.recipientName}</strong> ({order.recipientPhone})
                </p>
              </div>
              <div className="info-box-item">
                <small><Truck size={12} /> Metode Pengiriman:</small>
                <p>
                  <span className="delivery-method-chip">
                    {order.deliveryType === "DELIVERY"
                      ? "Dikirim Kurir"
                      : "Ambil Mandiri (Pickup)"}
                  </span>
                </p>
              </div>
              {order.deliveryAddress && (
                <div className="full-span info-box-item">
                  <small><MapPin size={12} /> Alamat Lengkap Tujuan:</small>
                  <p className="address-text-row">
                    {order.deliveryAddress.fullAddress}
                  </p>
                </div>
              )}
              {order.customTextRequest && (
                <div className="full-span info-box-item">
                  <small><Sparkles size={12} /> Teks / Pesan Ucapan Tambahan:</small>
                  <p className="quote-box">
                    &quot;{order.customTextRequest}&quot;
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Financials & Upload Payment Proof */}
        <div className="detail-right">
          {/* QRIS Payment Section for DP */}
          {["PENDING_PAYMENT", "REJECTED"].includes(order.status) && (
            <QrisPaymentBox
              orderId={order.id}
              orderNumber={`#ORDER-${order.id.slice(0, 8).toUpperCase()}`}
              paymentType="DP"
              amount={Number(order.dpAmount)}
              onPaymentSuccess={() => {
                showToast("Pembayaran DP berhasil diverifikasi otomatis!");
                void refetch();
              }}
            />
          )}

          {/* QRIS Payment Section for Final Pelunasan */}
          {["PENDING_FINAL_PAYMENT"].includes(order.status) && (
            <QrisPaymentBox
              orderId={order.id}
              orderNumber={`#ORDER-${order.id.slice(0, 8).toUpperCase()}`}
              paymentType="FINAL"
              amount={Number(order.remainingAmount)}
              onPaymentSuccess={() => {
                showToast("Pelunasan final berhasil diverifikasi otomatis!");
                void refetch();
              }}
            />
          )}

          {/* Financial Summary */}
          <section className="checkout-summary-card">
            <div className="card-section-title-row">
              <CreditCard size={18} className="card-title-icon" />
              <h2>Ringkasan Pembayaran</h2>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{rupiah.format(Number(order.subtotal))}</span>
            </div>
            <div className="summary-row">
              <span>Ongkos Kirim</span>
              <span>{rupiah.format(Number(order.ongkirFee))}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row total-row">
              <span>Total Pesanan</span>
              <strong>{rupiah.format(Number(order.total))}</strong>
            </div>

            <div className="payment-scheme-box">
              <div className="scheme-row dp">
                <span>DP Wajib 50%:</span>
                <strong>{rupiah.format(Number(order.dpAmount))}</strong>
              </div>
              <div className="scheme-row remaining">
                <span>Sisa Pelunasan:</span>
                <span>{rupiah.format(Number(order.remainingAmount))}</span>
              </div>
            </div>

            {/* Cancel Button if cancellable */}
            {["PENDING_PAYMENT", "DP_VERIFIED"].includes(order.status) && (
              <button
                type="button"
                className="cancel-order-btn"
                onClick={() => setShowCancelModal(true)}
              >
                Batalkan Pesanan Ini
              </button>
            )}
          </section>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          className="cancel-modal-overlay"
          onClick={() => {
            if (!cancelling) {
              setShowCancelModal(false);
              setModalError("");
            }
          }}
        >
          <div
            className="cancel-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              className="cancel-modal-close"
              onClick={() => {
                if (!cancelling) {
                  setShowCancelModal(false);
                  setModalError("");
                }
              }}
              aria-label="Tutup dialog"
            >
              <X size={18} />
            </button>

            {/* Warning Icon Badge */}
            <div className="cancel-modal-icon-badge">
              <AlertTriangle size={24} />
            </div>

            <div className="cancel-modal-header">
              <h2 id="cancel-modal-title">Batalkan Pesanan?</h2>
              <p>
                Nomor pesanan:{" "}
                <strong className="cancel-order-code">
                  #ORDER-{order.id.slice(0, 8).toUpperCase()}
                </strong>
              </p>
            </div>

            {modalError && (
              <div className="cancel-modal-error" role="alert">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleCancelOrder(e)} className="cancel-modal-form">
              <div className="cancel-form-group">
                <label htmlFor="cancel-reason-input">Pilih atau tulis alasan pembatalan:</label>

                {/* Quick Selection Chips */}
                <div className="cancel-reason-chips">
                  {[
                    "Ingin mengubah rangkaian bunga",
                    "Ingin ganti tanggal sewa / kirim",
                    "Salah memasukkan data penerima",
                    "Kendala metode pembayaran",
                    "Lainnya",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`reason-chip ${cancelReasonText === chip ? "selected" : ""}`}
                      onClick={() => setCancelReasonText(chip)}
                      disabled={cancelling}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  id="cancel-reason-input"
                  required
                  rows={3}
                  placeholder="Tuliskan alasan pembatalan pesanan di sini..."
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  disabled={cancelling}
                  maxLength={500}
                />
              </div>

              <div className="cancel-warning-notice">
                <AlertCircle size={14} className="notice-icon" />
                <span>
                  Perhatian: Pembatalan pesanan bersifat permanen. Slot jadwal dan
                  reservasi stok bunga akan langsung dibebaskan.
                </span>
              </div>

              <div className="cancel-modal-actions">
                <button
                  type="button"
                  className="cancel-btn-back"
                  onClick={() => {
                    if (!cancelling) {
                      setShowCancelModal(false);
                      setModalError("");
                    }
                  }}
                  disabled={cancelling}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="cancel-btn-confirm"
                  disabled={cancelling || !cancelReasonText.trim()}
                >
                  {cancelling ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Membatalkan...</span>
                    </>
                  ) : (
                    <span>Ya, Batalkan Pesanan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Printable Formal Invoice / Receipt ─── */}
      <div className="printable-invoice-sheet" aria-hidden="true">
        <div className="print-invoice-header">
          <div>
            <h1 className="print-store-name">LICHARY FLORIST</h1>
            <small style={{ color: "#666" }}>Atelier Bunga &amp; Rental Papan Ucapan • Yogyakarta</small>
          </div>
          <div>
            <h2 className="print-invoice-title">FAKTUR PESANAN</h2>
            <div style={{ fontSize: "10pt", color: "#444" }}>#ORDER-{order.id.slice(0, 8).toUpperCase()}</div>
            <div style={{ fontSize: "9pt", color: "#666" }}>{createdDate}</div>
          </div>
        </div>

        <div className="print-meta-grid">
          <div>
            <strong>Informasi Pemesan:</strong>
            <div>Nama: {order.customerName}</div>
            <div>WhatsApp: {order.waNumber}</div>
          </div>
          <div>
            <strong>Tujuan &amp; Penerima:</strong>
            <div>Penerima: {order.recipientName} ({order.recipientPhone})</div>
            <div>Metode: {order.deliveryType === "PICKUP" ? "Ambil Sendiri (Pickup)" : "Pengiriman (Delivery)"}</div>
            {order.deliveryAddress?.fullAddress && <div>Alamat: {order.deliveryAddress.fullAddress}</div>}
          </div>
        </div>

        {order.customTextRequest && (
          <div style={{ background: "#f9f9f9", padding: "10px 14px", borderLeft: "3px solid #d48b9f", marginBottom: "16px", fontSize: "10pt" }}>
            <strong>Pesan pada Pita / Kartu Ucapan:</strong>
            <div style={{ fontStyle: "italic", marginTop: "2px" }}>&quot;{order.customTextRequest}&quot;</div>
          </div>
        )}

        <table className="print-table">
          <thead>
            <tr>
              <th>Item Produk / Rental</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Harga</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it) => (
              <tr key={it.id}>
                <td>
                  <strong>{it.productNameSnapshot || "Bunga / Karangan"}</strong>
                  {it.bookingDate && (
                    <div style={{ fontSize: "9pt", color: "#666" }}>
                      Periode: {formatBookingDate(it.bookingDate)} {it.bookingEndDate ? `s/d ${formatBookingDate(it.bookingEndDate)}` : ""}
                    </div>
                  )}
                  {it.customNoteSnapshot && <div style={{ fontSize: "9pt", color: "#666" }}>Catatan: {it.customNoteSnapshot}</div>}
                </td>
                <td className="text-right">{it.qty}</td>
                <td className="text-right">{rupiah.format(Number(it.priceSnapshot))}</td>
                <td className="text-right">{rupiah.format(Number(it.priceSnapshot) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-total-block">
          <div className="print-total-row">
            <span>Subtotal:</span>
            <span>{rupiah.format(Number(order.subtotal))}</span>
          </div>
          <div className="print-total-row">
            <span>Ongkos Kirim:</span>
            <span>{Number(order.ongkirFee) > 0 ? rupiah.format(Number(order.ongkirFee)) : "GRATIS"}</span>
          </div>
          <div className="print-total-row grand-total">
            <span>Total Transaksi:</span>
            <span>{rupiah.format(Number(order.total))}</span>
          </div>
          <div className="print-total-row" style={{ marginTop: "8px", color: "#166437", fontWeight: "bold" }}>
            <span>DP 50% (Wajib):</span>
            <span>{rupiah.format(Number(order.dpAmount))}</span>
          </div>
          <div className="print-total-row" style={{ color: "#9d174d" }}>
            <span>Sisa Pelunasan:</span>
            <span>{rupiah.format(Number(order.remainingAmount))}</span>
          </div>
        </div>

        <div className="print-footer-note">
          <p style={{ margin: "0 0 4px" }}>Terima kasih telah mempercayakan momen spesial Anda kepada LICHARY Florist Atelier.</p>
          <small>Struk ini sah dan diterbitkan secara digital oleh sistem LICHARY Florist. Layanan Pelanggan: WA 0895-1788-0077</small>
        </div>
      </div>
    </main>
  );
}
