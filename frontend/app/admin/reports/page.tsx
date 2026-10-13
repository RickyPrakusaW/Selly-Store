"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarBlank,
  ChartBar,
  DownloadSimple,
  FileXls,
  TrendDown,
  TrendUp,
  Wallet,
} from "@phosphor-icons/react";
import { useState } from "react";
import { exportReport, fetchChartData, fetchReportSummary } from "@/lib/api";
import type { ChartDataPoint, ReportSummary } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminReportsPage() {
  const [from, setFrom] = useState(() => {
    const today = new Date();
    return formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [to, setTo] = useState(() => formatLocalDate(new Date()));

  const { data: summary, isLoading: loadingSummary } = useQuery<ReportSummary>({
    queryKey: ["report-summary", from, to],
    queryFn: () => fetchReportSummary(from, to),
    enabled: Boolean(from) && Boolean(to),
  });

  const { data: chartData = [], isLoading: loadingChart } = useQuery<
    ChartDataPoint[]
  >({
    queryKey: ["report-chart", from, to],
    queryFn: () => fetchChartData(from, to),
    enabled: Boolean(from) && Boolean(to),
  });

  const handleExport = () => {
    const url = exportReport(from, to);
    window.open(url, "_blank");
  };

  const maxVal = Math.max(
    ...chartData.map((d) => Number(d.revenue ?? 0)),
    100000,
  );

  const profitMargin =
    summary && summary.totalRevenue > 0
      ? ((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1)
      : "0.0";

  const isProfit = summary ? summary.grossProfit >= 0 : true;

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <h1>Laporan Penjualan &amp; Laba Rugi</h1>
          <p>
            Rekapitulasi omzet kotor, beban pokok penjualan (HPP), laba bersih toko, dan ekspor lembar pembukuan Excel.
          </p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="atelier-btn-primary" onClick={handleExport}>
            <DownloadSimple size={16} weight="bold" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </header>

      {/* ─── Date Range Filter Bar ─── */}
      <section className="atelier-panel">
        <div className="atelier-panel-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--admin-rose)" }}>
              <CalendarBlank size={18} weight="bold" />
              <strong style={{ fontSize: "13px" }}>Rentang Periode Pembukuan:</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "var(--admin-muted)", fontWeight: 600 }}>
                Dari:
              </label>
              <input
                type="date"
                className="atelier-form-input"
                style={{ width: "auto", padding: "6px 10px", fontSize: "12.5px" }}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "var(--admin-muted)", fontWeight: 600 }}>
                Sampai:
              </label>
              <input
                type="date"
                className="atelier-form-input"
                style={{ width: "auto", padding: "6px 10px", fontSize: "12.5px" }}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Financial KPI Strip ─── */}
      <section className="atelier-operations-bar">
        {/* Total Omzet */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Omzet Kotor (Gross)</span>
            <Wallet size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">
              {loadingSummary ? "—" : rupiah.format(summary?.totalRevenue ?? 0)}
            </span>
          </div>
          <div>
            <span className="metric-cell-tag neutral">Periode Terpilih</span>
          </div>
        </div>

        {/* HPP */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Beban Pokok (HPP)</span>
            <TrendDown size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value" style={{ color: "#92400e" }}>
              {loadingSummary ? "—" : rupiah.format(summary?.totalHpp ?? 0)}
            </span>
          </div>
          <div>
            <span className="metric-cell-tag warning">Bahan Baku &amp; Pembuatan</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Laba Kotor Toko</span>
            {isProfit ? (
              <TrendUp size={16} weight="bold" style={{ color: "#166437" }} />
            ) : (
              <TrendDown size={16} weight="bold" style={{ color: "#991b2b" }} />
            )}
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value" style={{ color: isProfit ? "#166437" : "#991b2b" }}>
              {loadingSummary ? "—" : rupiah.format(summary?.grossProfit ?? 0)}
            </span>
          </div>
          <div>
            <span className={`metric-cell-tag ${isProfit ? "good" : "warning"}`}>
              Margin: {profitMargin}%
            </span>
          </div>
        </div>

        {/* Selesai */}
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Pesanan Selesai</span>
            <ChartBar size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">
              {loadingSummary ? "—" : summary?.totalOrders ?? 0}
            </span>
            <span className="metric-cell-sub">Transaksi</span>
          </div>
          <div>
            <span className="metric-cell-tag good">Tuntas Terkirim</span>
          </div>
        </div>
      </section>

      {/* ─── Profit Margin Banner ─── */}
      {summary && (
        <section className={`profit-margin-banner ${!isProfit ? "loss" : ""}`}>
          <div className="profit-margin-text">
            <strong>Margin Laba Kotor: {profitMargin}%</strong>
            <small>
              Dari total omzet {rupiah.format(summary.totalRevenue)}, laba kotor yang dihasilkan adalah {rupiah.format(summary.grossProfit)}.
              {Number(profitMargin) < 20 && isProfit && " Pertimbangkan tinjauan efisiensi bahan bunga."}
              {!isProfit && " Biaya HPP dan operasional melebihi pendapatan pada rentang ini."}
            </small>
          </div>
          <div className="profit-margin-pct">
            {profitMargin}%
          </div>
        </section>
      )}

      {/* ─── Revenue & Profit Trend Chart ─── */}
      <section className="atelier-panel">
        <div className="atelier-panel-header">
          <div>
            <h2 className="atelier-panel-title">Grafik Tren Penjualan &amp; Laba</h2>
            <small style={{ color: "var(--admin-muted)", fontSize: "12px" }}>
              Distribusi harian / mingguan dalam rentang tanggal yang dipilih.
            </small>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--admin-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 10, height: 10, background: "var(--admin-rose)", borderRadius: 2 }} />
              Omzet Penjualan
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 10, height: 10, background: "#166437", borderRadius: 2 }} />
              Laba Bersih
            </span>
          </div>
        </div>

        <div className="atelier-panel-body" style={{ padding: "24px" }}>
          {loadingChart ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-muted)", fontSize: "13px" }}>
              Memuat grafik data…
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--admin-muted)" }}>
              <ChartBar size={36} weight="light" style={{ margin: "0 auto 8px", color: "var(--admin-border)" }} />
              <strong style={{ display: "block", color: "var(--admin-ink)", fontSize: "14px" }}>
                Tidak ada data pada periode ini
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                Pilih rentang tanggal yang memiliki pesanan selesai.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "12px",
                height: "220px",
                paddingBottom: "24px",
                borderBottom: "1px solid var(--admin-border)",
                overflowX: "auto",
              }}
            >
              {chartData.map((dp, idx) => {
                const periodStr = dp.period || dp.date || "";
                const revenueVal = Number(dp.revenue ?? 0);
                const profitVal = Number(dp.profit ?? dp.grossProfit ?? 0);
                const revPct = Math.round((revenueVal / maxVal) * 100);
                const profitPct = Math.round((profitVal / maxVal) * 100);

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      minWidth: "36px",
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100%", width: "100%", justifyContent: "center" }}>
                      <div
                        style={{
                          width: "14px",
                          height: `${Math.max(4, revPct)}%`,
                          background: "var(--admin-rose)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s ease",
                        }}
                        title={`Omzet: ${rupiah.format(revenueVal)}`}
                      />
                      <div
                        style={{
                          width: "14px",
                          height: `${Math.max(4, Math.max(0, profitPct))}%`,
                          background: "#166437",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s ease",
                        }}
                        title={`Laba: ${rupiah.format(profitVal)}`}
                      />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--admin-muted)", whiteSpace: "nowrap" }}>
                      {periodStr.length > 5 ? periodStr.slice(5) : periodStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Export Action Banner ─── */}
      <section className="atelier-panel">
        <div className="atelier-panel-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FileXls size={32} weight="duotone" style={{ color: "var(--admin-rose)" }} />
            <div>
              <strong style={{ fontSize: "14px", display: "block", color: "var(--admin-ink)" }}>
                Unduh Buku Rekapitulasi Excel
              </strong>
              <span style={{ fontSize: "12.5px", color: "var(--admin-muted)" }}>
                File .xlsx siap pakai untuk rekap akuntansi dan audit pembukuan bulanan.
              </span>
            </div>
          </div>
          <button type="button" className="atelier-btn-secondary" onClick={handleExport}>
            <DownloadSimple size={15} weight="bold" />
            <span>Unduh Laporan (.xlsx)</span>
          </button>
        </div>
      </section>
    </div>
  );
}
