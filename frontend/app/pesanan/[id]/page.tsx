"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  FileCheck,
  MapPin,
  MessageCircle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ApiError,
  cancelOrder,
  fetchOrderDetail,
  retractDpProof,
  retractFinalProof,
  uploadDpProof,
  uploadFinalProof,
} from "@/lib/api";
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
  const user = useSeliStore((state) => state.user);
  const showToast = useSeliStore((state) => state.showToast);

  const [dpFile, setDpFile] = useState<File | null>(null);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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

  if (!user) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <h2>Akses Terbatas</h2>
          <p>Silakan masuk ke akun Anda untuk melihat detail pesanan.</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat detail pesanan…</p>
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

  const handleUploadDp = async (e: FormEvent) => {
    e.preventDefault();
    if (!dpFile) return;
    setUploading(true);
    setError("");
    try {
      await uploadDpProof(orderId, dpFile);
      setDpFile(null);
      showToast("Bukti DP 50% berhasil diunggah!");
      await refetch();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengunggah bukti DP.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFinal = async (e: FormEvent) => {
    e.preventDefault();
    if (!finalFile) return;
    setUploading(true);
    setError("");
    try {
      await uploadFinalProof(orderId, finalFile);
      setFinalFile(null);
      showToast("Bukti Pelunasan berhasil diunggah!");
      await refetch();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengunggah bukti pelunasan.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRetractDp = async () => {
    if (
      !confirm("Apakah Anda yakin ingin menarik bukti DP yang sedang ditinjau?")
    )
      return;
    try {
      await retractDpProof(orderId);
      showToast("Bukti DP berhasil ditarik");
      await refetch();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menarik bukti DP.",
      );
    }
  };

  const handleRetractFinal = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menarik bukti pelunasan yang sedang ditinjau?",
      )
    )
      return;
    try {
      await retractFinalProof(orderId);
      showToast("Bukti pelunasan berhasil ditarik");
      await refetch();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal menarik bukti pelunasan.",
      );
    }
  };

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

  return (
    <main className="order-detail-page shell">
      <Link href="/pesanan" className="back-link">
        <ArrowLeft size={16} /> Kembali ke Pesanan Saya
      </Link>

      <header className="order-header-banner">
        <div className="header-info">
          <span className="order-category-tag">
            {order.status === "PENDING_PAYMENT" || order.status === "REJECTED"
              ? "Instruksi Pembayaran DP"
              : order.status === "PENDING_FINAL_PAYMENT"
                ? "Instruksi Pelunasan Final"
                : "Detail Transaksi"}
          </span>
          <h1>
            {order.status === "PENDING_PAYMENT" || order.status === "REJECTED"
              ? "Pembayaran DP 50% & Unggah Bukti"
              : order.status === "PENDING_FINAL_PAYMENT"
                ? "Pelunasan Final & Unggah Bukti"
                : `#ORDER-${order.id.slice(0, 8).toUpperCase()}`}
          </h1>
          <div className="created-time" suppressHydrationWarning>
            <Clock size={14} className="clock-icon" />
            <span>Pesanan #ORDER-{order.id.slice(0, 8).toUpperCase()} • Dibuat pada {createdDate}</span>
          </div>
        </div>

        <div className="header-actions">
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
          {/* Upload DP Proof Section */}
          {["PENDING_PAYMENT", "REJECTED"].includes(order.status) && (
            <section className="proof-upload-card">
              <div className="card-header-with-icon">
                <Upload size={22} />
                <div>
                  <h3>Unggah Bukti DP 50%</h3>
                  <small>
                    Batas Waktu: <strong>{dpDeadlineText}</strong>
                  </small>
                </div>
              </div>

              <div className="bank-account-info">
                <p>Transfer ke Rekening Resmi Seli Florist:</p>
                <strong>BCA 123-456-7890 a.n. Seli Florist</strong>
                <p>
                  Nominal DP:{" "}
                  <strong>{rupiah.format(Number(order.dpAmount))}</strong>
                </p>
              </div>

              {dpProof && (
                <div
                  className={`proof-status-box ${dpProof.verificationStatus.toLowerCase()}`}
                >
                  <FileCheck size={18} />
                  <div>
                    <strong>Bukti DP: {dpProof.verificationStatus}</strong>
                    {dpProof.rejectedReason && (
                      <p className="text-red">
                        Alasan Penolakan: {dpProof.rejectedReason}
                      </p>
                    )}
                    {dpProof.verificationStatus === "PENDING" && (
                      <button
                        className="text-btn"
                        onClick={() => void handleRetractDp()}
                      >
                        Tarik Bukti
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={(e) => void handleUploadDp(e)}>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={(e) => setDpFile(e.target.files?.[0] ?? null)}
                  />
                  <span>
                    {dpFile
                      ? dpFile.name
                      : "Pilih Foto Bukti Transfer DP (JPG/PNG/WEBP, Max 2MB)"}
                  </span>
                </label>

                <button
                  type="submit"
                  className="primary-button full-width"
                  disabled={uploading || !dpFile}
                >
                  {uploading ? "Mengunggah…" : "Kirim Bukti DP"}
                </button>
              </form>
            </section>
          )}

          {/* Upload Final Payment Proof Section */}
          {["DP_VERIFIED", "PENDING_FINAL_PAYMENT"].includes(order.status) && (
            <section className="proof-upload-card">
              <div className="card-header-with-icon">
                <Upload size={22} />
                <div>
                  <h3>Unggah Bukti Pelunasan Final</h3>
                  <small>
                    Nominal Pelunasan:{" "}
                    <strong>
                      {rupiah.format(Number(order.remainingAmount))}
                    </strong>
                  </small>
                </div>
              </div>

              <div className="bank-account-info">
                <p>Transfer Pelunasan ke Rekening Resmi:</p>
                <strong>BCA 123-456-7890 a.n. Seli Florist</strong>
              </div>

              {finalProof && (
                <div
                  className={`proof-status-box ${finalProof.verificationStatus.toLowerCase()}`}
                >
                  <FileCheck size={18} />
                  <div>
                    <strong>
                      Bukti Pelunasan: {finalProof.verificationStatus}
                    </strong>
                    {finalProof.rejectedReason && (
                      <p className="text-red">
                        Alasan Penolakan: {finalProof.rejectedReason}
                      </p>
                    )}
                    {finalProof.verificationStatus === "PENDING" && (
                      <button
                        className="text-btn"
                        onClick={() => void handleRetractFinal()}
                      >
                        Tarik Bukti
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={(e) => void handleUploadFinal(e)}>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={(e) => setFinalFile(e.target.files?.[0] ?? null)}
                  />
                  <span>
                    {finalFile
                      ? finalFile.name
                      : "Pilih Foto Bukti Pelunasan (JPG/PNG/WEBP, Max 2MB)"}
                  </span>
                </label>

                <button
                  type="submit"
                  className="primary-button full-width"
                  disabled={uploading || !finalFile}
                >
                  {uploading ? "Mengunggah…" : "Kirim Bukti Pelunasan"}
                </button>
              </form>
            </section>
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
    </main>
  );
}
