"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const today = new Date();
    const firstDay = formatLocalDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const lastDay = formatLocalDate(today);
    setFrom(firstDay);
    setTo(lastDay);
    setMounted(true);
  }, []);

  const { data: summary } = useQuery<ReportSummary>({
    queryKey: ["report-summary", from, to],
    queryFn: () => fetchReportSummary(from, to),
    enabled: mounted && Boolean(from) && Boolean(to),
  });

  const { data: chartData = [], isLoading: loadingChart } = useQuery<
    ChartDataPoint[]
  >({
    queryKey: ["report-chart", from, to],
    queryFn: () => fetchChartData(from, to),
    enabled: mounted && Boolean(from) && Boolean(to),
  });

  const handleExport = () => {
    const url = exportReport(from, to);
    window.open(url, "_blank");
  };

  // Find max revenue for scaling chart bars
  const maxVal = Math.max(
    ...chartData.map((d) => Number(d.revenue ?? 0)),
    100000
  );

  return (
    <div className="admin-reports-page">
      <header className="admin-page-header">
        <div>
          <h1>Laporan Keuangan &amp; Laba Rugi</h1>
          <p>
            Pantau omzet pendapatan kotor, HPP, laba bersih, dan ekspor laporan
            ke Excel.
          </p>
        </div>
        <button className="primary-button compact" onClick={handleExport}>
          <Download size={16} /> Export Ke Excel (.xlsx)
        </button>
      </header>

      {/* Date Range Picker */}
      <div className="admin-card-form date-filter-row">
        <label>
          Dari Tanggal:
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Sampai Tanggal:
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      {/* Summary KPI Cards */}
      <div className="report-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <Wallet size={24} />
          </div>
          <div>
            <small>Total Pendapatan (Gross)</small>
            <strong>{rupiah.format(summary?.totalRevenue ?? 0)}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon hpp">
            <TrendingUp size={24} />
          </div>
          <div>
            <small>Total HPP (Bahan Baku)</small>
            <strong>{rupiah.format(summary?.totalHpp ?? 0)}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon profit">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <small>Laba Kotor (Gross Profit)</small>
            <strong className="text-green">
              {rupiah.format(summary?.grossProfit ?? 0)}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orders">
            <Calendar size={24} />
          </div>
          <div>
            <small>Total Pesanan Selesai</small>
            <strong>{summary?.totalOrders ?? 0} Transaksi</strong>
          </div>
        </div>
      </div>

      {/* Financial Chart Visualization */}
      <section className="admin-table-card chart-section">
        <h3>Grafik Tren Pendapatan &amp; Laba</h3>

        {loadingChart ? (
          <p>Memuat grafik tren…</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted">
            Tidak ada data transaksi pada rentang tanggal ini.
          </p>
        ) : (
          <div className="chart-bar-container">
            {chartData.map((dp, idx) => {
              const periodStr = dp.period || dp.date || "";
              const revenueVal = Number(dp.revenue ?? 0);
              const profitVal = Number(dp.profit ?? dp.grossProfit ?? 0);
              const revPct = Math.round((revenueVal / maxVal) * 100);
              const profitPct = Math.round((profitVal / maxVal) * 100);
              return (
                <div key={idx} className="chart-bar-column">
                  <div className="chart-bars-wrap">
                    <div
                      className="chart-bar revenue-bar"
                      style={{ height: `${Math.max(5, revPct)}%` }}
                      title={`Revenue: ${rupiah.format(revenueVal)}`}
                    />
                    <div
                      className="chart-bar profit-bar"
                      style={{ height: `${Math.max(5, profitPct)}%` }}
                      title={`Profit: ${rupiah.format(profitVal)}`}
                    />
                  </div>
                  <span className="chart-label">
                    {periodStr.length > 5 ? periodStr.slice(5) : periodStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="chart-legend">
          <span>
            <b className="legend-box revenue" /> Pendapatan (Gross)
          </span>
          <span>
            <b className="legend-box profit" /> Laba (Profit)
          </span>
        </div>
      </section>
    </div>
  );
}
