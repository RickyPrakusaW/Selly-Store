"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowsClockwise,
  CalendarBlank,
  CheckCircle,
  Eye,
  MagnifyingGlass,
  Receipt,
  Tag,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import {
  adminListOrders,
  fetchBoards,
  fetchCalendar,
  fetchProducts,
  fetchReportSummary,
} from "@/lib/api";
import { getStatusBadge } from "@/app/pesanan/page";
import { useSeliStore } from "@/lib/store";
import type {
  BoardInventory,
  CalendarDay,
  Order,
  Product,
  ReportSummary,
} from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatIndoDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("id-ID", options);
}

export default function AdminDashboardPage() {
  const user = useSeliStore((state) => state.user);
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const currentMonthStr = today.toISOString().slice(0, 7);
  const currentMonthFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const currentMonthTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  /* 1. Fetch Orders Queue */
  const {
    data: orders = [],
    isLoading: loadingOrders,
    isRefetching: refetchingOrders,
    refetch: refetchOrders,
  } = useQuery<Order[]>({
    queryKey: ["admin-dashboard-orders"],
    queryFn: () => adminListOrders(1),
    refetchInterval: 10000,
  });

  /* 2. Fetch Board Units & Calendar */
  const { data: boards = [], refetch: refetchBoards } = useQuery<BoardInventory[]>({
    queryKey: ["admin-dashboard-boards"],
    queryFn: fetchBoards,
    refetchInterval: 10000,
  });

  const { data: calendar = [] } = useQuery<CalendarDay[]>({
    queryKey: ["admin-dashboard-calendar", currentMonthStr],
    queryFn: () => fetchCalendar(currentMonthStr),
    refetchInterval: 15000,
  });

  /* 3. Fetch Catalog Products */
  const { data: products = [], refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["admin-dashboard-products"],
    queryFn: () => fetchProducts(),
    refetchInterval: 30000,
  });

  /* 4. Fetch Monthly Revenue Summary */
  const { data: summary } = useQuery<ReportSummary>({
    queryKey: ["admin-dashboard-summary", currentMonthFrom, currentMonthTo],
    queryFn: () => fetchReportSummary(currentMonthFrom, currentMonthTo),
    enabled: user?.role === "OWNER" || user?.role === "FINANCE",
  });

  const handleRefreshAll = () => {
    void refetchOrders();
    void refetchBoards();
    void refetchProducts();
  };

  /* Calculated Metrics */
  const pendingOrders = orders.filter((o) => {
    const hasPendingProof = o.paymentProofs?.some(
      (p) => p.verificationStatus === "PENDING",
    );
    const hasWaitingPaymentWithProof =
      o.status === "PENDING_PAYMENT" && (o.paymentProofs?.length ?? 0) > 0;
    return Boolean(hasPendingProof || hasWaitingPaymentWithProof);
  });

  const activeBoardsCount = boards.filter((b) => b.isActive).length;
  const todayCalendar = calendar.find((c) => c.date === todayStr);
  const todayBookedCount = todayCalendar?.bookedBoards ?? 0;
  const todayAvailCount = todayCalendar?.available ?? activeBoardsCount;

  const lowStockProducts = products.filter((p) => {
    const stockVal = p.availableQty ?? p.stockQty ?? 0;
    return stockVal <= 5;
  });

  /* Filtered recent orders table */
  const displayedOrders = orders.filter((o) => {
    if (orderFilter === "PENDING") {
      return (
        o.paymentProofs?.some((p) => p.verificationStatus === "PENDING") ||
        (o.status === "PENDING_PAYMENT" && (o.paymentProofs?.length ?? 0) > 0)
      );
    }
    if (orderFilter === "PAID") {
      return (
        o.status === "DP_VERIFIED" ||
        o.status === "FULLY_PAID" ||
        o.status === "PROCESSING" ||
        o.status === "COMPLETED"
      );
    }
    return true;
  }).slice(0, 8);

  return (
    <div className="admin-page-wrap">
      {/* ─── Top Executive Bar ─── */}
      <section className="admin-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--admin-muted)", marginBottom: "4px" }}>
            <CalendarBlank size={15} weight="regular" />
            <span>{formatIndoDate(today)}</span>
            <span>•</span>
            <span style={{ color: "var(--admin-rose)", fontWeight: 600 }}>Sistem Operasional Aktif</span>
          </div>
          <h1>Ringkasan Operasional Toko</h1>
          <p>
            Pantau antrean verifikasi pembayaran, keterisian papan ucapan hari ini, serta pergerakan katalog bunga.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="atelier-btn-secondary"
            onClick={handleRefreshAll}
            disabled={refetchingOrders}
            title="Muat ulang seluruh data"
          >
            <ArrowsClockwise
              size={15}
              weight="bold"
              className={refetchingOrders ? "spin-animate" : ""}
            />
            <span>Segarkan</span>
          </button>
          <Link href="/admin/orders" className="atelier-btn-primary">
            <Receipt size={16} weight="regular" />
            <span>Antrean Pesanan</span>
          </Link>
        </div>
      </section>

      {/* ─── Urgent Pending Alert Banner ─── */}
      {pendingOrders.length > 0 && (
        <section className="atelier-alert-strip">
          <div className="alert-strip-content">
            <WarningCircle size={24} weight="fill" style={{ flexShrink: 0, color: "#b45309" }} />
            <div>
              <strong>
                Perhatian: Terdapat {pendingOrders.length} bukti transfer menunggu verifikasi
              </strong>
              <p>
                Pelanggan telah mengunggah bukti pembayaran. Segera verifikasi agar pesanan bunga dapat dirangkai tepat waktu.
              </p>
            </div>
          </div>
          <Link href="/admin/orders" className="atelier-btn-primary compact">
            <span>Buka Antrean</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </section>
      )}

      {/* ─── Atelier Operations Bar (Clean non-AI slop metrics) ─── */}
      <section className="atelier-operations-bar">
        {/* Metric 1: Antrean Verifikasi */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Antrean Verifikasi</span>
            <Receipt size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{pendingOrders.length}</span>
            <span className="metric-cell-sub">Pesanan</span>
          </div>
          <div>
            {pendingOrders.length > 0 ? (
              <span className="metric-cell-tag pending">Butuh Tindakan Segera</span>
            ) : (
              <span className="metric-cell-tag good">Antrean Bersih</span>
            )}
          </div>
        </div>

        {/* Metric 2: Omzet Berjalan */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Omzet Bulan Ini</span>
            <span>IDR</span>
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">
              {summary ? rupiah.format(summary.totalRevenue) : rupiah.format(0)}
            </span>
          </div>
          <div>
            <span className="metric-cell-tag neutral">
              {summary ? `${summary.totalOrders} Transaksi Selesai` : "Bulan Berjalan"}
            </span>
          </div>
        </div>

        {/* Metric 3: Papan Ucapan Hari Ini */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Papan Ucapan Hari Ini</span>
            <CalendarBlank size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">
              {todayBookedCount} / {activeBoardsCount}
            </span>
            <span className="metric-cell-sub">Unit Terpakai</span>
          </div>
          <div>
            <span className="metric-cell-tag good">
              {todayAvailCount} Unit Tersedia
            </span>
          </div>
        </div>

        {/* Metric 4: Katalog Produk & Stok */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Katalog Bunga</span>
            <Tag size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{products.length}</span>
            <span className="metric-cell-sub">Item Terdaftar</span>
          </div>
          <div>
            {lowStockProducts.length > 0 ? (
              <span className="metric-cell-tag warning">
                {lowStockProducts.length} Stok Menipis
              </span>
            ) : (
              <span className="metric-cell-tag good">Stok Aman</span>
            )}
          </div>
        </div>
      </section>

      {/* ─── Recent Orders Operational Workbench ─── */}
      <section className="atelier-panel">
        <div className="atelier-panel-header">
          <div>
            <h2 className="atelier-panel-title">Pesanan Masuk Terbaru</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--admin-muted)" }}>
              Daftar transaksi pelanggan yang memerlukan pemantauan dan proses perakitan.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="atelier-segmented-tabs">
              <button
                type="button"
                className={`atelier-tab-btn ${orderFilter === "ALL" ? "active" : ""}`}
                onClick={() => setOrderFilter("ALL")}
              >
                Semua ({orders.length})
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${orderFilter === "PENDING" ? "active" : ""}`}
                onClick={() => setOrderFilter("PENDING")}
              >
                Perlu Verifikasi ({pendingOrders.length})
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${orderFilter === "PAID" ? "active" : ""}`}
                onClick={() => setOrderFilter("PAID")}
              >
                Terkonfirmasi
              </button>
            </div>

            <Link href="/admin/orders" className="atelier-btn-secondary compact">
              <span>Kelola Semua</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
          {loadingOrders ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
              Memuat data pesanan…
            </div>
          ) : displayedOrders.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
              <Receipt size={32} weight="light" style={{ margin: "0 auto 8px", color: "var(--admin-border)" }} />
              <strong style={{ display: "block", color: "var(--admin-ink)", fontSize: "14px" }}>
                Tidak ada pesanan dalam kategori ini
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                Saat pelanggan memesan, rincian transaksi akan muncul di sini secara instan.
              </p>
            </div>
          ) : (
            <table className="atelier-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>WhatsApp</th>
                  <th>Status Pesanan</th>
                  <th>Total Biaya</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => {
                  const hasUnverifiedProof =
                    order.paymentProofs?.some(
                      (p) => p.verificationStatus === "PENDING",
                    ) ?? false;

                  return (
                    <tr key={order.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--admin-rose)" }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--admin-muted)", whiteSpace: "nowrap" }}>
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <strong style={{ display: "block", color: "var(--admin-ink)", fontSize: "13px" }}>
                          {order.customerName}
                        </strong>
                        {order.recipientName && (
                          <small style={{ color: "var(--admin-muted)", fontSize: "11px" }}>
                            Penerima: {order.recipientName}
                          </small>
                        )}
                      </td>
                      <td style={{ fontSize: "12px" }}>
                        {order.waNumber ? (
                          <a
                            href={`https://wa.me/${order.waNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--admin-rose)", textDecoration: "underline" }}
                          >
                            {order.waNumber}
                          </a>
                        ) : (
                          <span style={{ color: "var(--admin-muted)" }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {(() => {
                            const badge = getStatusBadge(order.status);
                            return (
                              <span className={`status-badge-pill ${badge.className}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                          {hasUnverifiedProof && (
                            <span className="status-badge-pill badge-orange" title="Bukti transfer baru belum diverifikasi">
                              Bukti Baru
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {rupiah.format(Number(order.total))}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link
                          href={`/admin/orders?search=${order.id.slice(-6)}`}
                          className="atelier-btn-secondary compact"
                        >
                          <Eye size={13} weight="bold" />
                          <span>Periksa</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
