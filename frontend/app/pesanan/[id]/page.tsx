"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Printer,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ApiError,
  cancelOrder,
  fetchOrderDetail,
} from "@/lib/api";
import { QrisPaymentBox } from "@/components/qris-payment-box";
import { useMounted } from "@/lib/use-mounted";
import { useSeliStore } from "@/lib/store";
import { formatBookingDate, type Order } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

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
    try {
      await cancelOrder(orderId, cancelReasonText);
      setShowCancelModal(false);
      showToast("Pesanan berhasil dibatalkan.");
      await refetch();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal membatalkan pesanan.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const dpProof = order.paymentProofs?.find((p) => p.proofType === "DP");
  const finalProof = order.paymentProofs?.find((p) => p.proofType === "FINAL");

  const createdDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dpDeadlineText = order.dpDeadline
    ? new Date(order.dpDeadline).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077";
  const waHelpText = encodeURIComponent(
    `Halo Admin Seli Florist, saya ingin konfirmasi pesanan #ORDER-${order.id.slice(0, 8).toUpperCase()}`,
  );
  const waHelpLink = `https://wa.me/${waNumber}?text=${waHelpText}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWa = () => {
    const text =
      `🌸 *STRUK RESMI SELI FLORIST ATELIER* 🌸\n` +
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

  return (
    <main className="order-detail-page shell">
      <Link href="/pesanan" className="back-link">
        <ArrowLeft size={16} /> Kembali ke Pesanan Saya
      </Link>

      <header className="order-header-banner">
        <div className="header-info">
          <span className="order-category-tag">
            {order.status === "PENDING_PAYMENT" || order.status === "REJECTED"
              ? "Pembayaran DP 50% (QRIS)"
              : order.status === "PENDING_FINAL_PAYMENT"
                ? "Pelunasan Final (QRIS)"
                : "Detail Transaksi"}
          </span>
          <h1>
            {order.status === "PENDING_PAYMENT" || order.status === "REJECTED"
              ? "Pembayaran DP 50% via QRIS"
              : order.status === "PENDING_FINAL_PAYMENT"
                ? "Pelunasan Final via QRIS"
                : `#ORDER-${order.id.slice(0, 8).toUpperCase()}`}
          </h1>
          <div className="created-time" suppressHydrationWarning>
            <Clock size={14} className="clock-icon" />
            <span>Pesanan #ORDER-{order.id.slice(0, 8).toUpperCase()} • Dibuat pada {createdDate}</span>
          </div>
        </div>

        <div className="header-actions-group">
          <button type="button" className="print-invoice-btn" onClick={handlePrint} title="Cetak struk resmi atau simpan sebagai PDF">
            <Printer size={16} /> Cetak Struk
          </button>
          <button type="button" className="share-wa-btn" onClick={handleShareWa} title="Bagikan ringkasan pesanan ke WhatsApp">
            <Share2 size={16} /> Bagikan WA
          </button>
          <a
            href={waHelpLink}
            target="_blank"
            rel="noreferrer"
            className="wa-button-green"
          >
            <MessageCircle size={17} /> Bantuan WA
          </a>
        </div>
      </header>

      {error && (
        <div className="inline-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Timeline */}
      <section className="stepper-card">
        <h3>Status Alur Pesanan</h3>
        <div className="stepper-timeline">
          <div className="step-node active">
            <div className="circle">1</div>
            <span>Pesanan Dibuat</span>
          </div>
          <div
            className={`step-node ${order.status !== "PENDING_PAYMENT" ? "active" : ""}`}
          >
            <div className="circle">2</div>
            <span>Verifikasi DP 50%</span>
          </div>
          <div
            className={`step-node ${["FULLY_PAID", "PROCESSING", "COMPLETED"].includes(order.status) ? "active" : ""}`}
          >
            <div className="circle">3</div>
            <span>Pelunasan Final</span>
          </div>
          <div
            className={`step-node ${order.status === "COMPLETED" ? "active" : ""}`}
          >
            <div className="circle">4</div>
            <span>Pesanan Selesai</span>
          </div>
        </div>
      </section>

      <div className="order-detail-grid">
        {/* Left Column: Items & Delivery */}
        <div className="detail-left">
          {/* Item List */}
          <section className="checkout-card">
            <h2>Daftar Bunga &amp; Item Pesanan</h2>
            <div className="order-items-table">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div>
                    <strong>{item.productNameSnapshot}</strong>
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
                    <span>{item.qty}x</span>
                    <strong>
                      {rupiah.format(Number(item.priceSnapshot) * item.qty)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery & Customer Info */}
          <section className="checkout-card">
            <h2>Informasi Pengiriman &amp; Penerima</h2>
            <div className="info-grid-2">
              <div>
                <small>Pemesan / Customer:</small>
                <p>
                  <strong>{order.customerName}</strong> ({order.waNumber})
                </p>
              </div>
              <div>
                <small>Penerima Bunga:</small>
                <p>
                  <strong>{order.recipientName}</strong> ({order.recipientPhone}
                  )
                </p>
              </div>
              <div>
                <small>Metode Pengiriman:</small>
                <p>
                  <strong>
                    {order.deliveryType === "DELIVERY"
                      ? "Dikirim Kurir"
                      : "Ambil Mandiri (Pickup)"}
                  </strong>
                </p>
              </div>
              {order.deliveryAddress && (
                <div className="full-span">
                  <small>Alamat Lengkap Tujuan:</small>
                  <p>
                    <MapPin size={14} /> {order.deliveryAddress.fullAddress}
                  </p>
                </div>
              )}
              {order.customTextRequest && (
                <div className="full-span">
                  <small>Teks / Pesan Ucapan Tambahan:</small>
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
            <h2>Ringkasan Pembayaran</h2>
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
          className="modal-backdrop"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="auth-card cancel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Batalkan Pesanan</h2>
            <p>
              Apakah Anda yakin ingin membatalkan pesanan ini? Masukkan alasan
              pembatalan:
            </p>
            <form onSubmit={(e) => void handleCancelOrder(e)}>
              <textarea
                required
                rows={3}
                placeholder="Alasan pembatalan..."
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
              />
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCancelModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="primary-button danger"
                  disabled={cancelling}
                >
                  {cancelling ? "Membatalkan…" : "Konfirmasi Pembatalan"}
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
            <h1 className="print-store-name">SELI FLORIST</h1>
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
          <p style={{ margin: "0 0 4px" }}>Terima kasih telah mempercayakan momen spesial Anda kepada Seli Florist Atelier.</p>
          <small>Struk ini sah dan diterbitkan secara digital oleh sistem Seli Florist. Layanan Pelanggan: WA 0895-1788-0077</small>
        </div>
      </div>
    </main>
  );
}
