"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Eye, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import {
  adminComplete,
  adminForceCancel,
  adminGetOrder,
  adminListOrders,
  adminProcess,
  adminReassignBoard,
  adminReject,
  adminUpdateStatus,
  adminVerifyDp,
  adminVerifyFinal,
  fetchBoards,
  resolveImageUrl,
} from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { BoardInventory, Order } from "@/lib/types";
import { getStatusBadge } from "@/src/app/pesanan/page";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function AdminOrdersPage() {
  const showToast = useSeliStore((state) => state.showToast);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionModal, setActionModal] = useState<
    "reject" | "cancel" | "reassign" | "status" | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["admin-orders", selectedStatus],
    queryFn: () => adminListOrders(1, selectedStatus || undefined),
    refetchInterval: 3000,
  });

  const { data: boards = [] } = useQuery<BoardInventory[]>({
    queryKey: ["admin-boards"],
    queryFn: fetchBoards,
    refetchInterval: 3000,
  });

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await adminGetOrder(id);
      setSelectedOrder(detail);
    } catch {
      showToast("Gagal memuat detail pesanan", "error");
    }
  };

  const handleVerifyDp = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin memverifikasi bukti DP 50% ini?"))
      return;
    setProcessing(true);
    try {
      await adminVerifyDp(id);
      showToast("Bukti DP berhasil diverifikasi!");
      if (selectedOrder?.id === id) handleOpenDetail(id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal verifikasi DP",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyFinal = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin memverifikasi bukti pelunasan ini?"))
      return;
    setProcessing(true);
    try {
      await adminVerifyFinal(id);
      showToast("Bukti Pelunasan berhasil diverifikasi!");
      if (selectedOrder?.id === id) handleOpenDetail(id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal verifikasi pelunasan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteOrder = async (id: string) => {
    if (!confirm("Tandai pesanan ini sebagai SELESAI?")) return;
    setProcessing(true);
    try {
      await adminComplete(id);
      showToast("Pesanan selesai!");
      if (selectedOrder?.id === id) handleOpenDetail(id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menyelesaikan pesanan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessOrder = async (id: string) => {
    if (!confirm("Mulai proses pengerjaan pesanan ini?")) return;
    setProcessing(true);
    try {
      await adminProcess(id);
      showToast("Pesanan mulai diproses");
      if (selectedOrder?.id === id) handleOpenDetail(id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal memproses pesanan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedOrder || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      await adminReject(selectedOrder.id, rejectReason);
      showToast("Bukti ditolak & customer di-blacklist jika curang");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menolak bukti",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    setProcessing(true);
    try {
      await adminForceCancel(selectedOrder.id, cancelReason);
      showToast("Pesanan berhasil dibatalkan paksa");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal membatalkan pesanan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedOrder || !selectedBoardId) return;
    setProcessing(true);
    try {
      await adminReassignBoard(selectedOrder.id, selectedBoardId);
      showToast("Unit papan ucapan berhasil dialokasikan ulang");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Gagal mengalokasikan ulang unit papan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setProcessing(true);
    try {
      await adminUpdateStatus(selectedOrder.id, newStatus, statusNote);
      showToast("Status pesanan berhasil diubah!");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal mengubah status pesanan",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-orders-page">
      <header className="admin-page-header">
        <div>
          <h1>Antrean Verifikasi &amp; Pesanan</h1>
          <p>
            Kelola verifikasi bukti transfer DP, pelunasan, unit rental, dan
            pembatalan.
          </p>
        </div>
        <button className="primary-button compact" onClick={() => refetch()}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="category-strip filter-tabs">
        <button
          className={!selectedStatus ? "active" : ""}
          onClick={() => setSelectedStatus("")}
        >
          Semua Antrean
        </button>
        <button
          className={selectedStatus === "PENDING_PAYMENT" ? "active" : ""}
          onClick={() => setSelectedStatus("PENDING_PAYMENT")}
        >
          Menunggu DP
        </button>
        <button
          className={selectedStatus === "PENDING_FINAL_PAYMENT" ? "active" : ""}
          onClick={() => setSelectedStatus("PENDING_FINAL_PAYMENT")}
        >
          Menunggu Pelunasan
        </button>
        <button
          className={selectedStatus === "DP_VERIFIED" ? "active" : ""}
          onClick={() => setSelectedStatus("DP_VERIFIED")}
        >
          DP Verified
        </button>
        <button
          className={selectedStatus === "COMPLETED" ? "active" : ""}
          onClick={() => setSelectedStatus("COMPLETED")}
        >
          Selesai
        </button>
        <button
          className={selectedStatus === "CANCELLED" ? "active" : ""}
          onClick={() => setSelectedStatus("CANCELLED")}
        >
          Dibatalkan
        </button>
      </div>

      {/* Table of Orders */}
      <div className="admin-table-card">
        {isLoading ? (
          <div className="empty-state">
            <p>Memuat daftar transaksi…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={40} />
            <p>Tidak ada transaksi pada filter ini.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID &amp; Waktu</th>
                <th>Pelanggan</th>
                <th>Penerima</th>
                <th>Total / DP</th>
                <th>Status</th>
                <th>Bukti Pembayaran</th>
                <th>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => {
                const badge = getStatusBadge(ord.status);
                const dpP = ord.paymentProofs?.find(
                  (p) => p.proofType === "DP",
                );
                const finalP = ord.paymentProofs?.find(
                  (p) => p.proofType === "FINAL",
                );

                return (
                  <tr key={ord.id}>
                    <td>
                      <strong>#{ord.id.slice(0, 8).toUpperCase()}</strong>
                      <br />
                      <small className="text-muted" suppressHydrationWarning>
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>
                    <td>
                      <strong>{ord.customerName}</strong>
                      <br />
                      <small>{ord.waNumber}</small>
                    </td>
                    <td>
                      {ord.recipientName}
                      <br />
                      <small>{ord.recipientPhone}</small>
                    </td>
                    <td>
                      <strong>{rupiah.format(Number(ord.total))}</strong>
                      <br />
                      <small>DP: {rupiah.format(Number(ord.dpAmount))}</small>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <div className="proof-indicator-cell">
                        {dpP && (
                          <span
                            className={`proof-chip ${dpP.verificationStatus.toLowerCase()}`}
                          >
                            DP: {dpP.verificationStatus}
                          </span>
                        )}
                        {finalP && (
                          <span
                            className={`proof-chip ${finalP.verificationStatus.toLowerCase()}`}
                          >
                            Final: {finalP.verificationStatus}
                          </span>
                        )}
                        {!dpP && !finalP && (
                          <small className="text-muted">Belum diupload</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="table-action-btn"
                          onClick={() => handleOpenDetail(ord.id)}
                        >
                          <Eye size={15} /> Detail
                        </button>
                        {ord.status === "PENDING_PAYMENT" && dpP && (
                          <button
                            className="table-action-btn success"
                            disabled={processing}
                            onClick={() => void handleVerifyDp(ord.id)}
                          >
                            Verifikasi DP
                          </button>
                        )}
                        {["PENDING_FINAL_PAYMENT", "DP_VERIFIED"].includes(
                          ord.status,
                        ) &&
                          finalP && (
                            <button
                              className="table-action-btn success"
                              disabled={processing}
                              onClick={() => void handleVerifyFinal(ord.id)}
                            >
                              Verifikasi Final
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="admin-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                Detail Transaksi #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <button
                className="close-btn"
                aria-label="Tutup detail transaksi"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-detail-body">
              {/* Row 1: 2-column Grid for Customer Info & Payment Breakdown */}
              <div className="detail-row-2col">
                <div className="detail-col">
                  <h3>Info Pelanggan &amp; Pengiriman</h3>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.customerName} (
                    {selectedOrder.waNumber})
                  </p>
                  <p>
                    <strong>Penerima:</strong> {selectedOrder.recipientName} (
                    {selectedOrder.recipientPhone})
                  </p>
                  <p>
                    <strong>Metode Pengiriman:</strong>{" "}
                    {selectedOrder.deliveryType === "DELIVERY"
                      ? "Dikirim Kurir"
                      : "Ambil Mandiri (Pickup)"}
                  </p>
                  {selectedOrder.deliveryAddress && (
                    <p>
                      <strong>Alamat Tujuan:</strong>{" "}
                      {selectedOrder.deliveryAddress.fullAddress}
                    </p>
                  )}
                  {selectedOrder.customTextRequest && (
                    <p>
                      <strong>Pesan Ucapan:</strong> &quot;
                      {selectedOrder.customTextRequest}&quot;
                    </p>
                  )}
                </div>

                <div className="detail-col">
                  <h3>Skema &amp; Rincian Biaya</h3>
                  <div className="price-breakdown-table">
                    <div className="p-row">
                      <span>Subtotal</span>
                      <span>{rupiah.format(Number(selectedOrder.subtotal))}</span>
                    </div>
                    <div className="p-row">
                      <span>Ongkos Kirim</span>
                      <span>{rupiah.format(Number(selectedOrder.ongkirFee))}</span>
                    </div>
                    <div className="p-row total">
                      <span>Total Transaksi</span>
                      <strong>{rupiah.format(Number(selectedOrder.total))}</strong>
                    </div>
                    <div className="p-row dp">
                      <span>DP Wajib 50%</span>
                      <strong>{rupiah.format(Number(selectedOrder.dpAmount))}</strong>
                    </div>
                    <div className="p-row remaining">
                      <span>Sisa Pelunasan</span>
                      <span>{rupiah.format(Number(selectedOrder.remainingAmount))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Full Width Item List */}
              <div className="detail-card-full">
                <h3>Daftar Item Pesanan ({selectedOrder.items?.length ?? 0})</h3>
                <div className="admin-item-grid">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="admin-item-chip">
                      <div className="item-qty-badge">{item.qty}x</div>
                      <div className="item-info-text">
                        <strong>{item.productNameSnapshot}</strong>
                        {item.variantNameSnapshot && (
                          <span className="variant-tag"> ({item.variantNameSnapshot})</span>
                        )}
                        {item.customNoteSnapshot && (
                          <p className="note-subtext">&quot;{item.customNoteSnapshot}&quot;</p>
                        )}
                      </div>
                      <strong className="item-total-price">
                        {rupiah.format(Number(item.priceSnapshot) * item.qty)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Full Width Horizontal Payment Proof Cards */}
              <div className="detail-card-full">
                <h3>Bukti Transfer &amp; Pembayaran</h3>
                {selectedOrder.paymentProofs && selectedOrder.paymentProofs.length > 0 ? (
                  <div className="admin-proofs-horizontal">
                    {selectedOrder.paymentProofs.map((p) => (
                      <div key={p.id} className="proof-preview-card-h">
                        <div className="proof-card-header">
                          <span className="proof-type-badge">
                            {p.proofType === "DP" ? "Bukti DP 50%" : "Bukti Pelunasan"}
                          </span>
                          <span className={`status-pill ${p.verificationStatus.toLowerCase()}`}>
                            {p.verificationStatus === "PENDING"
                              ? "Menunggu Review"
                              : p.verificationStatus === "APPROVED"
                                ? "Disetujui"
                                : "Ditolak"}
                          </span>
                        </div>
                        <a
                          href={resolveImageUrl(p.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="proof-img-frame"
                          title="Klik untuk membuka gambar penuh"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveImageUrl(p.fileUrl)}
                            alt="Bukti Transfer"
                          />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-proof-notice">Belum ada foto bukti pembayaran diunggah.</p>
                )}
              </div>
            </div>

            <div className="admin-modal-actions">
              {selectedOrder.status === "PENDING_PAYMENT" && (
                <button
                  className="primary-button compact"
                  disabled={processing}
                  onClick={() => void handleVerifyDp(selectedOrder.id)}
                >
                  Verifikasi DP 50%
                </button>
              )}
              {["PENDING_FINAL_PAYMENT", "DP_VERIFIED"].includes(
                selectedOrder.status,
              ) && (
                <button
                  className="primary-button compact"
                  disabled={processing}
                  onClick={() => void handleVerifyFinal(selectedOrder.id)}
                >
                  Verifikasi Pelunasan
                </button>
              )}

              <button
                className="secondary-button"
                onClick={() => setActionModal("reject")}
              >
                Tolak Bukti
              </button>

              <button
                className="secondary-button"
                onClick={() => setActionModal("reassign")}
              >
                Alokasikan Ulang Unit Sewa
              </button>

              <button
                className="secondary-button"
                style={{ borderColor: "var(--rose)", color: "var(--rose)" }}
                onClick={() => {
                  setNewStatus(selectedOrder.status);
                  setStatusNote("");
                  setActionModal("status");
                }}
              >
                Ubah Status Manual
              </button>

              {["DP_VERIFIED", "PENDING_FINAL_PAYMENT", "FULLY_PAID"].includes(
                selectedOrder.status,
              ) && (
                <button
                  className="primary-button compact"
                  disabled={processing}
                  onClick={() => void handleProcessOrder(selectedOrder.id)}
                >
                  Mulai Proses Pengerjaan
                </button>
              )}

              {(selectedOrder.status === "FULLY_PAID" ||
                (selectedOrder.status === "PROCESSING" &&
                  Number(selectedOrder.remainingAmount ?? 0) === 0)) && (
                <button
                  className="primary-button compact success"
                  disabled={processing}
                  onClick={() => void handleCompleteOrder(selectedOrder.id)}
                >
                  Tandai Selesai
                </button>
              )}

              <button
                className="primary-button compact danger"
                onClick={() => setActionModal("cancel")}
              >
                Batalkan Paksa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Sub-Modals */}
      {actionModal === "reject" && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>Tolak Bukti &amp; Blacklist</h3>
            <p>Masukkan alasan penolakan bukti transfer:</p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Bukti palsu / mutasi bank tidak sesuai..."
            />
            <div className="modal-actions-row">
              <button
                className="secondary-button"
                onClick={() => setActionModal(null)}
              >
                Batal
              </button>
              <button
                className="primary-button danger"
                disabled={processing}
                onClick={() => void handleConfirmReject()}
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModal === "cancel" && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>Batalkan Paksa Order</h3>
            <p>Masukkan alasan pembatalan paksa oleh admin:</p>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Stok rusak / permintaan pelanggan..."
            />
            <div className="modal-actions-row">
              <button
                className="secondary-button"
                onClick={() => setActionModal(null)}
              >
                Batal
              </button>
              <button
                className="primary-button danger"
                disabled={processing}
                onClick={() => void handleConfirmCancel()}
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModal === "reassign" && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>Alokasikan Ulang Unit Papan Ucapan</h3>
            <p>Pilih unit fisik papan ucapan untuk dialokasikan:</p>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="admin-select"
            >
              <option value="">-- Pilih Unit Papan --</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.boardName} ({b.boardType ?? "Standar"})
                </option>
              ))}
            </select>
            <div className="modal-actions-row">
              <button
                className="secondary-button"
                onClick={() => setActionModal(null)}
              >
                Batal
              </button>
              <button
                className="primary-button"
                disabled={processing}
                onClick={() => void handleConfirmReassign()}
              >
                Simpan Alokasi Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModal === "status" && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <h3>Ubah Status Pesanan Manual</h3>
            <p style={{ fontSize: "13px", color: "#666" }}>
              Pilih status baru untuk pesanan <strong>#{selectedOrder.id.slice(0, 8).toUpperCase()}</strong> (Customer: {selectedOrder.customerName}):
            </p>

            <div style={{ marginTop: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Status Baru:
              </label>
              <select
                className="admin-select"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu DP)</option>
                <option value="DP_VERIFIED">DP_VERIFIED (DP 50% Diverifikasi)</option>
                <option value="PENDING_FINAL_PAYMENT">PENDING_FINAL_PAYMENT (Menunggu Pelunasan)</option>
                <option value="FULLY_PAID">FULLY_PAID (Lunas 100%)</option>
                <option value="PROCESSING">PROCESSING (Diproses)</option>
                <option value="COMPLETED">COMPLETED (Selesai)</option>
                <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>

            <div style={{ marginTop: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Catatan Perubahan Admin (Opsional):
              </label>
              <input
                type="text"
                placeholder="Misal: Koreksi pesanan batal/tolak atas permintaan pembeli"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

            <div className="modal-actions-row" style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                className="secondary-button"
                onClick={() => setActionModal(null)}
              >
                Batal
              </button>
              <button
                className="primary-button compact"
                disabled={processing || !newStatus}
                onClick={() => void handleConfirmUpdateStatus()}
              >
                Simpan Perubahan Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
