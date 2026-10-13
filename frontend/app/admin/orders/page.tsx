"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowsClockwise,
  Check,
  CheckCircle,
  Eye,
  MagnifyingGlass,
  Prohibit,
  Receipt,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
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
import { getStatusBadge } from "@/app/pesanan/page";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function AdminOrdersPage() {
  const showToast = useSeliStore((state) => state.showToast);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
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
    refetchInterval: 5000,
  });

  const { data: boards = [] } = useQuery<BoardInventory[]>({
    queryKey: ["admin-boards"],
    queryFn: fetchBoards,
    refetchInterval: 10000,
  });

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.waNumber?.toLowerCase().includes(q) ||
      o.recipientName?.toLowerCase().includes(q)
    );
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
    if (!confirm("Konfirmasi verifikasi bukti transfer DP 50% untuk pesanan ini?"))
      return;
    setProcessing(true);
    try {
      await adminVerifyDp(id);
      showToast("Bukti DP 50% berhasil diverifikasi!");
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
    if (!confirm("Konfirmasi verifikasi bukti transfer pelunasan?"))
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
    if (!confirm("Tandai pesanan ini telah SELESAI diserahkan?")) return;
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
    if (!confirm("Mulai proses perangkaian / persiapan pesanan ini?")) return;
    setProcessing(true);
    try {
      await adminProcess(id);
      showToast("Pesanan sedang diproses");
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
      showToast("Bukti pembayaran ditolak");
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
      showToast("Pesanan dibatalkan");
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
      showToast("Alokasi unit papan diperbarui");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Gagal mengalokasikan unit papan",
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
      showToast("Status pesanan berhasil diperbarui");
      setActionModal(null);
      handleOpenDetail(selectedOrder.id);
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal memperbarui status",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const pendingVerifyCount = orders.filter(
    (o) => o.paymentProofs?.some((p) => p.verificationStatus === "PENDING"),
  ).length;

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <h1>Antrean Verifikasi &amp; Manajemen Pesanan</h1>
          <p>
            Verifikasi bukti transfer DP atau pelunasan, pantau pengerjaan pesanan bunga, dan kelola alokasi unit papan ucapan.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="atelier-btn-secondary"
            onClick={() => refetch()}
            title="Muat ulang daftar pesanan"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* ─── Urgent Alert Banner ─── */}
      {pendingVerifyCount > 0 && (
        <section className="atelier-alert-strip">
          <div className="alert-strip-content">
            <WarningCircle size={22} weight="fill" style={{ color: "#b45309", flexShrink: 0 }} />
            <div>
              <strong>{pendingVerifyCount} Bukti Pembayaran Menunggu Konfirmasi</strong>
              <p>
                Pelanggan telah mengunggah bukti transfer. Buka rincian pesanan untuk memverifikasi.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Controls: Filter Tabs + Search Box ─── */}
      <section className="atelier-panel">
        <div className="atelier-panel-body" style={{ padding: "16px 20px" }}>
          <div className="atelier-toolbar">
            <div className="atelier-segmented-tabs" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={`atelier-tab-btn ${!selectedStatus ? "active" : ""}`}
                onClick={() => setSelectedStatus("")}
              >
                Semua ({orders.length})
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "PENDING_PAYMENT" ? "active" : ""}`}
                onClick={() => setSelectedStatus("PENDING_PAYMENT")}
              >
                Menunggu DP
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "PENDING_FINAL_PAYMENT" ? "active" : ""}`}
                onClick={() => setSelectedStatus("PENDING_FINAL_PAYMENT")}
              >
                Menunggu Pelunasan
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "DP_VERIFIED" ? "active" : ""}`}
                onClick={() => setSelectedStatus("DP_VERIFIED")}
              >
                DP Terverifikasi
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "PROCESSING" ? "active" : ""}`}
                onClick={() => setSelectedStatus("PROCESSING")}
              >
                Diproses
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "COMPLETED" ? "active" : ""}`}
                onClick={() => setSelectedStatus("COMPLETED")}
              >
                Selesai
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${selectedStatus === "CANCELLED" ? "active" : ""}`}
                onClick={() => setSelectedStatus("CANCELLED")}
              >
                Dibatalkan
              </button>
            </div>

            <div className="atelier-search-box">
              <MagnifyingGlass size={16} weight="regular" />
              <input
                type="text"
                className="atelier-search-input"
                placeholder="Cari ID, pelanggan, WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─── Orders Table ─── */}
        <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0, borderTop: "1px solid var(--admin-border)" }}>
          {isLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
              Memuat data pesanan…
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
              <Receipt size={36} weight="light" style={{ margin: "0 auto 8px", color: "var(--admin-border)" }} />
              <strong style={{ display: "block", color: "var(--admin-ink)", fontSize: "14px" }}>
                Tidak ada pesanan ditemukan
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                Coba sesuaikan kata kunci pencarian atau ubah tab status di atas.
              </p>
            </div>
          ) : (
            <table className="atelier-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Penerima</th>
                  <th>Total / DP</th>
                  <th>Status Transaksi</th>
                  <th>Bukti Bayar</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const dpP = ord.paymentProofs?.find((p) => p.proofType === "DP");
                  const finalP = ord.paymentProofs?.find((p) => p.proofType === "FINAL");

                  return (
                    <tr key={ord.id}>
                      <td>
                        <strong style={{ color: "var(--admin-rose)", fontFamily: "monospace", fontSize: "12.5px" }}>
                          #{ord.id.slice(0, 8).toUpperCase()}
                        </strong>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--admin-muted)", whiteSpace: "nowrap" }}>
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <strong style={{ display: "block", fontSize: "13px", color: "var(--admin-ink)" }}>
                          {ord.customerName}
                        </strong>
                        <small style={{ color: "var(--admin-muted)", fontSize: "11px" }}>
                          {ord.waNumber}
                        </small>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px" }}>{ord.recipientName}</span>
                        {ord.recipientPhone && (
                          <small style={{ display: "block", color: "var(--admin-muted)", fontSize: "11px" }}>
                            {ord.recipientPhone}
                          </small>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: "var(--admin-rose)", fontVariantNumeric: "tabular-nums" }}>
                          {rupiah.format(Number(ord.total))}
                        </strong>
                        <small style={{ display: "block", color: "#166437", fontSize: "11px", fontWeight: 600 }}>
                          DP: {rupiah.format(Number(ord.dpAmount))}
                        </small>
                      </td>
                      <td>
                        {(() => {
                          const badge = getStatusBadge(ord.status);
                          return (
                            <span className={`status-badge-pill ${badge.className}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {dpP && (
                            <span className={`status-badge-pill ${dpP.verificationStatus === "PENDING" ? "badge-orange" : dpP.verificationStatus === "APPROVED" ? "badge-green" : "badge-red"}`}>
                              DP: {dpP.verificationStatus}
                            </span>
                          )}
                          {finalP && (
                            <span className={`status-badge-pill ${finalP.verificationStatus === "PENDING" ? "badge-orange" : finalP.verificationStatus === "APPROVED" ? "badge-green" : "badge-red"}`}>
                              Final: {finalP.verificationStatus}
                            </span>
                          )}
                          {!dpP && !finalP && (
                            <span style={{ color: "var(--admin-muted)", fontSize: "11px" }}>
                              Belum ada bukti
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="atelier-btn-secondary compact"
                            onClick={() => handleOpenDetail(ord.id)}
                          >
                            <Eye size={13} weight="bold" />
                            <span>Detail</span>
                          </button>
                          {ord.status === "PENDING_PAYMENT" && dpP && dpP.verificationStatus === "PENDING" && (
                            <button
                              type="button"
                              className="atelier-btn-primary compact"
                              disabled={processing}
                              onClick={() => void handleVerifyDp(ord.id)}
                            >
                              <Check size={13} weight="bold" />
                              <span>Verif DP</span>
                            </button>
                          )}
                          {["PENDING_FINAL_PAYMENT", "DP_VERIFIED"].includes(ord.status) &&
                            finalP &&
                            finalP.verificationStatus === "PENDING" && (
                              <button
                                type="button"
                                className="atelier-btn-primary compact"
                                disabled={processing}
                                onClick={() => void handleVerifyFinal(ord.id)}
                              >
                                <Check size={13} weight="bold" />
                                <span>Verif Pelunasan</span>
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
      </section>

      {/* ─── Detail Modal ─── */}
      {selectedOrder && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: "720px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  Rincian Transaksi #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h3>
                <small style={{ color: "var(--admin-muted)", fontSize: "12px" }}>
                  Status: {selectedOrder.status}
                </small>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                aria-label="Tutup rincian"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Row 1: Customer Info & Cost Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "var(--admin-surface-muted)", padding: "14px", borderRadius: "10px", fontSize: "12.5px" }}>
                  <strong style={{ display: "block", color: "var(--admin-rose)", marginBottom: "8px", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                    Informasi Pemesan &amp; Kirim
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div><strong>Pemesan:</strong> {selectedOrder.customerName} ({selectedOrder.waNumber})</div>
                    <div><strong>Penerima:</strong> {selectedOrder.recipientName} ({selectedOrder.recipientPhone})</div>
                    <div><strong>Metode:</strong> {selectedOrder.deliveryType === "DELIVERY" ? "Dikirim Kurir" : "Ambil Mandiri di Toko"}</div>
                    {selectedOrder.deliveryAddress && (
                      <div><strong>Alamat:</strong> {selectedOrder.deliveryAddress.fullAddress}</div>
                    )}
                    {selectedOrder.customTextRequest && (
                      <div><strong>Ucapan:</strong> &quot;{selectedOrder.customTextRequest}&quot;</div>
                    )}
                  </div>
                </div>

                <div style={{ background: "var(--admin-surface-muted)", padding: "14px", borderRadius: "10px", fontSize: "12.5px" }}>
                  <strong style={{ display: "block", color: "var(--admin-rose)", marginBottom: "8px", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                    Rincian Pembayaran
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Subtotal:</span>
                      <span>{rupiah.format(Number(selectedOrder.subtotal))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Ongkos Kirim:</span>
                      <span>{rupiah.format(Number(selectedOrder.ongkirFee))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--admin-border)", paddingTop: "4px", fontWeight: 700, color: "var(--admin-rose)" }}>
                      <span>Total Transaksi:</span>
                      <span>{rupiah.format(Number(selectedOrder.total))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#166437", fontWeight: 600 }}>
                      <span>DP Wajib 50%:</span>
                      <span>{rupiah.format(Number(selectedOrder.dpAmount))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--admin-muted)" }}>
                      <span>Sisa Pelunasan:</span>
                      <span>{rupiah.format(Number(selectedOrder.remainingAmount))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <strong style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-muted)", marginBottom: "8px" }}>
                  Item Bunga Dipesan ({selectedOrder.items?.length ?? 0})
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "8px",
                        background: "#ffffff",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <strong>{item.qty}x {item.productNameSnapshot}</strong>
                        {item.variantNameSnapshot && (
                          <span style={{ color: "var(--admin-muted)", marginLeft: "6px" }}>
                            ({item.variantNameSnapshot})
                          </span>
                        )}
                        {item.customNoteSnapshot && (
                          <div style={{ fontSize: "11px", color: "var(--admin-muted)", marginTop: "2px" }}>
                            Catatan: &quot;{item.customNoteSnapshot}&quot;
                          </div>
                        )}
                      </div>
                      <strong style={{ fontVariantNumeric: "tabular-nums", color: "var(--admin-rose)" }}>
                        {rupiah.format(Number(item.priceSnapshot) * item.qty)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Proofs Inspection */}
              <div>
                <strong style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-muted)", marginBottom: "8px" }}>
                  Bukti Pembayaran / Mutasi Transfer
                </strong>
                {selectedOrder.paymentProofs && selectedOrder.paymentProofs.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                    {selectedOrder.paymentProofs.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: "1px solid var(--admin-border)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: "#ffffff",
                        }}
                      >
                        <div style={{ padding: "8px 12px", background: "var(--admin-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                          <strong>{p.proofType === "DP" ? "Bukti DP 50%" : "Bukti Pelunasan"}</strong>
                          <span className={`status-badge-pill ${p.verificationStatus === "PENDING" ? "badge-orange" : p.verificationStatus === "APPROVED" ? "badge-green" : "badge-red"}`}>
                            {p.verificationStatus}
                          </span>
                        </div>
                        <a
                          href={resolveImageUrl(p.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "block", background: "#f8f4f6", textAlign: "center", padding: "10px" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveImageUrl(p.fileUrl)}
                            alt="Bukti Transfer"
                            style={{ maxHeight: "200px", width: "100%", objectFit: "contain", borderRadius: "6px" }}
                          />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", background: "var(--admin-surface-muted)", borderRadius: "8px", fontSize: "12.5px", color: "var(--admin-muted)" }}>
                    Pelanggan belum mengunggah bukti transfer.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="admin-modal-footer" style={{ flexWrap: "wrap" }}>
              {selectedOrder.status === "PENDING_PAYMENT" && (
                <button
                  type="button"
                  className="atelier-btn-primary compact"
                  disabled={processing}
                  onClick={() => void handleVerifyDp(selectedOrder.id)}
                >
                  <Check size={14} weight="bold" />
                  <span>Verifikasi DP 50%</span>
                </button>
              )}
              {["PENDING_FINAL_PAYMENT", "DP_VERIFIED"].includes(selectedOrder.status) && (
                <button
                  type="button"
                  className="atelier-btn-primary compact"
                  disabled={processing}
                  onClick={() => void handleVerifyFinal(selectedOrder.id)}
                >
                  <Check size={14} weight="bold" />
                  <span>Verifikasi Pelunasan</span>
                </button>
              )}
              {["DP_VERIFIED", "PENDING_FINAL_PAYMENT", "FULLY_PAID"].includes(selectedOrder.status) && (
                <button
                  type="button"
                  className="atelier-btn-primary compact"
                  disabled={processing}
                  onClick={() => void handleProcessOrder(selectedOrder.id)}
                >
                  <span>Mulai Rangkai</span>
                </button>
              )}
              {(selectedOrder.status === "FULLY_PAID" ||
                (selectedOrder.status === "PROCESSING" &&
                  Number(selectedOrder.remainingAmount ?? 0) === 0)) && (
                <button
                  type="button"
                  className="atelier-btn-primary compact"
                  style={{ background: "#166437", borderColor: "#14532d" }}
                  disabled={processing}
                  onClick={() => void handleCompleteOrder(selectedOrder.id)}
                >
                  <span>Tandai Selesai</span>
                </button>
              )}
              <button
                type="button"
                className="atelier-btn-secondary compact"
                onClick={() => setActionModal("reassign")}
              >
                <span>Alokasi Papan</span>
              </button>
              <button
                type="button"
                className="atelier-btn-secondary compact"
                onClick={() => {
                  setNewStatus(selectedOrder.status);
                  setStatusNote("");
                  setActionModal("status");
                }}
              >
                <span>Ubah Status</span>
              </button>
              <button
                type="button"
                className="atelier-btn-secondary compact"
                style={{ color: "#92400e", borderColor: "#fde68a" }}
                onClick={() => setActionModal("reject")}
              >
                <span>Tolak Bukti</span>
              </button>
              <button
                type="button"
                className="atelier-btn-danger compact"
                onClick={() => setActionModal("cancel")}
              >
                <Prohibit size={13} weight="bold" />
                <span>Batalkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sub-modal: Tolak Bukti ─── */}
      {actionModal === "reject" && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Tolak Bukti Pembayaran</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setActionModal(null)}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: "13px", color: "var(--admin-muted)" }}>
                Masukkan alasan penolakan bukti transfer untuk pelanggan:
              </p>
              <textarea
                rows={3}
                required
                className="atelier-form-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Mutasi rekening tidak tertera, nominal salah, atau bukti tidak terbaca..."
              />
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="atelier-btn-secondary compact" onClick={() => setActionModal(null)}>
                Batal
              </button>
              <button
                type="button"
                className="atelier-btn-danger compact"
                disabled={processing || !rejectReason.trim()}
                onClick={() => void handleConfirmReject()}
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sub-modal: Batalkan Paksa ─── */}
      {actionModal === "cancel" && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Batalkan Pesanan</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setActionModal(null)}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: "13px", color: "var(--admin-muted)" }}>
                Masukkan alasan pembatalan operasional pesanan #{selectedOrder.id.slice(0, 8).toUpperCase()}:
              </p>
              <textarea
                rows={3}
                required
                className="atelier-form-textarea"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Stok bunga rusak akibat cuaca, atau pembatalan atas permintaan pembeli..."
              />
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="atelier-btn-secondary compact" onClick={() => setActionModal(null)}>
                Kembali
              </button>
              <button
                type="button"
                className="atelier-btn-danger compact"
                disabled={processing || !cancelReason.trim()}
                onClick={() => void handleConfirmCancel()}
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sub-modal: Alokasi Ulang Unit Papan ─── */}
      {actionModal === "reassign" && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Alokasikan Unit Papan Ucapan</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setActionModal(null)}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: "13px", color: "var(--admin-muted)" }}>
                Pilih unit fisik papan ucapan dari inventaris toko:
              </p>
              <select
                className="atelier-form-select"
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
              >
                <option value="">-- Pilih Unit Papan --</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.boardName} ({b.boardType ?? "Standar"})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="atelier-btn-secondary compact" onClick={() => setActionModal(null)}>
                Batal
              </button>
              <button
                type="button"
                className="atelier-btn-primary compact"
                disabled={processing || !selectedBoardId}
                onClick={() => void handleConfirmReassign()}
              >
                Simpan Alokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sub-modal: Ubah Status Manual ─── */}
      {actionModal === "status" && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Ubah Status Pesanan Manual</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setActionModal(null)}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="atelier-form-group">
                <label className="atelier-form-label">Status Baru:</label>
                <select
                  className="atelier-form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu DP)</option>
                  <option value="DP_VERIFIED">DP_VERIFIED (DP Terverifikasi)</option>
                  <option value="PENDING_FINAL_PAYMENT">PENDING_FINAL_PAYMENT (Menunggu Pelunasan)</option>
                  <option value="FULLY_PAID">FULLY_PAID (Lunas 100%)</option>
                  <option value="PROCESSING">PROCESSING (Diproses)</option>
                  <option value="COMPLETED">COMPLETED (Selesai)</option>
                  <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                  <option value="REJECTED">REJECTED (Ditolak)</option>
                </select>
              </div>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Catatan Admin (Opsional):</label>
                <input
                  type="text"
                  className="atelier-form-input"
                  placeholder="Contoh: Koreksi status berdasarkan konfirmasi via WhatsApp"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="atelier-btn-secondary compact" onClick={() => setActionModal(null)}>
                Batal
              </button>
              <button
                type="button"
                className="atelier-btn-primary compact"
                disabled={processing || !newStatus}
                onClick={() => void handleConfirmUpdateStatus()}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
