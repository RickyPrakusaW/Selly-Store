"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { exportReport, fetchChartData, fetchReportSummary } from "@/lib/api";
import type { ChartDataPoint, ReportSummary } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function AdminReportsPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);

  const { data: summary } = useQuery<ReportSummary>({
    queryKey: ["report-summary", from, to],
    queryFn: () => fetchReportSummary(from, to),
  });

  const { data: chartData = [], isLoading: loadingChart } = useQuery<
    ChartDataPoint[]
  >({
    queryKey: ["report-chart", from, to],
    queryFn: () => fetchChartData(from, to),
  });

  const handleExport = () => {
    const url = exportReport(from, to);
    window.open(url, "_blank");
  };

  // Find max revenue for scaling chart bars
  const maxVal = Math.max(...chartData.map((d) => d.revenue), 100000);

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
              const revPct = Math.round((dp.revenue / maxVal) * 100);
              const profitPct = Math.round((dp.profit / maxVal) * 100);
              return (
                <div key={idx} className="chart-bar-column">
                  <div className="chart-bars-wrap">
                    <div
                      className="chart-bar revenue-bar"
                      style={{ height: `${Math.max(5, revPct)}%` }}
                      title={`Revenue: ${rupiah.format(dp.revenue)}`}
                    />
                    <div
                      className="chart-bar profit-bar"
                      style={{ height: `${Math.max(5, profitPct)}%` }}
                      title={`Profit: ${rupiah.format(dp.profit)}`}
                    />
                  </div>
                  <span className="chart-label">{dp.date.slice(5)}</span>
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
