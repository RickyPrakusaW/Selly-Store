"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowsClockwise,
  CurrencyDollar,
  Info,
  Plus,
  Trash,
  TrendDown,
  TrendUp,
  Wallet,
} from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import {
  addCapital,
  addExpense,
  deleteExpense,
  fetchCapital,
  fetchExpenses,
  fetchProductCosts,
  fetchProducts,
  setProductCost,
} from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type {
  CapitalInjection,
  Expense,
  Product,
  ProductCost,
} from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const EXPENSE_LABELS: Record<string, string> = {
  RAW_MATERIAL: "Bahan Baku (Pita/Bunga/Kertas)",
  OPERATIONAL: "Operasional (Listrik/Air/Internet)",
  SALARY: "Gaji & Upah Karyawan",
  TRANSPORT: "Transportasi / Bahan Bakar",
  MARKETING: "Promosi / Iklan",
  OTHER: "Pengeluaran Lainnya",
};

export default function AdminFinancePage() {
  const showToast = useSeliStore((state) => state.showToast);
  const [activeTab, setActiveTab] = useState<"costs" | "capital" | "expenses">(
    "costs",
  );

  const [costProductId, setCostProductId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [costEffectiveDate, setCostEffectiveDate] = useState(todayIsoDate());

  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalSource, setCapitalSource] = useState("");
  const [capitalNote, setCapitalNote] = useState("");
  const [capitalDate, setCapitalDate] = useState(todayIsoDate());

  const [expenseCategory, setExpenseCategory] = useState("RAW_MATERIAL");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIsoDate());

  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["admin-products-list"],
    queryFn: () => fetchProducts(),
  });

  const { data: costs = [], refetch: refetchCosts } = useQuery<ProductCost[]>({
    queryKey: ["admin-product-costs"],
    queryFn: () => fetchProductCosts(),
    enabled: activeTab === "costs",
  });

  const { data: capital = [], refetch: refetchCapital } = useQuery<
    CapitalInjection[]
  >({
    queryKey: ["admin-capital"],
    queryFn: () => fetchCapital(),
    enabled: activeTab === "capital",
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery<Expense[]>(
    {
      queryKey: ["admin-expenses"],
      queryFn: () => fetchExpenses(),
      enabled: activeTab === "expenses",
    },
  );

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCapital = capital.reduce((s, c) => s + Number(c.amount), 0);

  const handleSaveCost = async (e: FormEvent) => {
    e.preventDefault();
    if (!costProductId || !costPrice) return;
    setLoading(true);
    try {
      await setProductCost({
        productId: costProductId,
        costPrice: Number(costPrice),
        effectiveDate: costEffectiveDate,
      });
      showToast("Harga Pokok (HPP) berhasil disimpan");
      setCostPrice("");
      refetchCosts();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menyimpan HPP",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCapital = async (e: FormEvent) => {
    e.preventDefault();
    if (!capitalAmount || !capitalSource) return;
    setLoading(true);
    try {
      await addCapital({
        amount: Number(capitalAmount),
        source: capitalSource,
        ...(capitalNote.trim() ? { note: capitalNote.trim() } : {}),
        injectedAt: capitalDate,
      });
      showToast("Injeksi modal berhasil dicatat");
      setCapitalAmount("");
      setCapitalSource("");
      setCapitalNote("");
      refetchCapital();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal mencatat modal",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDesc) return;
    setLoading(true);
    try {
      await addExpense({
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDesc,
        expenseDate,
      });
      showToast("Beban pengeluaran berhasil dicatat");
      setExpenseAmount("");
      setExpenseDesc("");
      refetchExpenses();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal mencatat pengeluaran",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Hapus catatan pengeluaran ini?")) return;
    try {
      await deleteExpense(id);
      showToast("Catatan pengeluaran dihapus");
      refetchExpenses();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus catatan",
        "error",
      );
    }
  };

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <h1>Buku Kas &amp; Akuntansi Operasional</h1>
          <p>
            Kelola struktur Harga Pokok Penjualan (HPP), pencatatan modal pemilik toko, dan pengeluaran operasional atelier.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="atelier-btn-secondary"
            onClick={() => {
              void refetchCosts();
              void refetchCapital();
              void refetchExpenses();
            }}
            title="Muat ulang data buku kas"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* ─── Summary Strip for Expenses or Capital ─── */}
      {activeTab === "expenses" && (
        <section className="atelier-operations-bar">
          <div className="atelier-metric-cell">
            <div className="metric-cell-label">
              <span>Total Beban Operasional</span>
              <TrendDown size={16} weight="regular" />
            </div>
            <div className="metric-cell-value-wrap">
              <span className="metric-cell-value" style={{ color: "#991b2b" }}>
                {rupiah.format(totalExpenses)}
              </span>
            </div>
            <div>
              <span className="metric-cell-tag warning">{expenses.length} Transaksi Tercatat</span>
            </div>
          </div>
        </section>
      )}

      {activeTab === "capital" && (
        <section className="atelier-operations-bar">
          <div className="atelier-metric-cell">
            <div className="metric-cell-label">
              <span>Total Modal Masuk</span>
              <Wallet size={16} weight="regular" />
            </div>
            <div className="metric-cell-value-wrap">
              <span className="metric-cell-value" style={{ color: "#166437" }}>
                {rupiah.format(totalCapital)}
              </span>
            </div>
            <div>
              <span className="metric-cell-tag good">{capital.length} Kali Injeksi Modal</span>
            </div>
          </div>
        </section>
      )}

      {/* ─── Segmented Tabs ─── */}
      <div className="atelier-segmented-tabs">
        <button
          type="button"
          className={`atelier-tab-btn ${activeTab === "costs" ? "active" : ""}`}
          onClick={() => setActiveTab("costs")}
        >
          Harga Pokok (HPP) Produk
        </button>
        <button
          type="button"
          className={`atelier-tab-btn ${activeTab === "capital" ? "active" : ""}`}
          onClick={() => setActiveTab("capital")}
        >
          Injeksi Modal Pemilik
        </button>
        <button
          type="button"
          className={`atelier-tab-btn ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          Beban Operasional Toko
        </button>
      </div>

      {/* ─── TAB 1: PRODUCT COSTS (HPP) ─── */}
      {activeTab === "costs" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", alignItems: "start" }}>
          {/* Form */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Atur HPP Produk</h2>
            </div>
            <form onSubmit={(e) => void handleSaveCost(e)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--admin-surface-muted)", borderRadius: "8px", fontSize: "12px", color: "var(--admin-muted)" }}>
                <Info size={16} weight="regular" style={{ flexShrink: 0, color: "var(--admin-rose)" }} />
                <span>HPP digunakan sistem secara otomatis untuk menghitung laba kotor di laporan keuangan.</span>
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Pilih Produk *</label>
                <select
                  required
                  className="atelier-form-select"
                  value={costProductId}
                  onChange={(e) => setCostProductId(e.target.value)}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Harga Jual: {rupiah.format(Number(p.basePrice))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Harga Pokok / Modal Rangkaian (IDR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="atelier-form-input"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Contoh: 75000"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Tanggal Efektif Berlaku *</label>
                <input
                  type="date"
                  required
                  className="atelier-form-input"
                  value={costEffectiveDate}
                  onChange={(e) => setCostEffectiveDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="atelier-btn-primary"
                disabled={loading}
                style={{ alignSelf: "flex-start", marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>{loading ? "Menyimpan…" : "Simpan HPP Produk"}</span>
              </button>
            </form>
          </section>

          {/* Table */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Daftar HPP Terdaftar ({costs.length})</h2>
            </div>
            <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              {costs.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                  Belum ada HPP produk yang dicatat.
                </div>
              ) : (
                <table className="atelier-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Biaya Modal (HPP)</th>
                      <th>Tanggal Efektif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.product?.name ?? c.productId}</strong>
                        </td>
                        <td>
                          <strong style={{ color: "var(--admin-rose)", fontVariantNumeric: "tabular-nums" }}>
                            {rupiah.format(Number(c.costPrice))}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                            {c.effectiveDate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ─── TAB 2: CAPITAL INJECTION ─── */}
      {activeTab === "capital" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", alignItems: "start" }}>
          {/* Form */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Catat Modal Pemilik</h2>
            </div>
            <form onSubmit={(e) => void handleSaveCapital(e)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Nominal Modal (IDR) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  className="atelier-form-input"
                  value={capitalAmount}
                  onChange={(e) => setCapitalAmount(e.target.value)}
                  placeholder="Contoh: 10000000"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Sumber Dana Modal *</label>
                <input
                  required
                  className="atelier-form-input"
                  value={capitalSource}
                  onChange={(e) => setCapitalSource(e.target.value)}
                  placeholder="Setoran Tunai Pemilik / Rekening BCA Toko"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Tanggal Masuk *</label>
                <input
                  type="date"
                  required
                  className="atelier-form-input"
                  value={capitalDate}
                  onChange={(e) => setCapitalDate(e.target.value)}
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Keterangan Tambahan (Opsional)</label>
                <input
                  className="atelier-form-input"
                  value={capitalNote}
                  onChange={(e) => setCapitalNote(e.target.value)}
                  placeholder="Penambahan kas cadangan operasional..."
                />
              </div>

              <button
                type="submit"
                className="atelier-btn-primary"
                disabled={loading}
                style={{ alignSelf: "flex-start", marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>{loading ? "Menyimpan…" : "Catat Modal Masuk"}</span>
              </button>
            </form>
          </section>

          {/* Table */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Riwayat Injeksi Modal ({capital.length})</h2>
            </div>
            <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              {capital.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                  Belum ada catatan modal masuk.
                </div>
              ) : (
                <table className="atelier-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Nominal</th>
                      <th>Sumber Dana</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capital.map((cap) => (
                      <tr key={cap.id}>
                        <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{cap.injectedAt}</td>
                        <td>
                          <strong style={{ color: "#166437", fontVariantNumeric: "tabular-nums" }}>
                            {rupiah.format(Number(cap.amount))}
                          </strong>
                        </td>
                        <td>{cap.source}</td>
                        <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{cap.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ─── TAB 3: OPERATIONAL EXPENSES ─── */}
      {activeTab === "expenses" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", alignItems: "start" }}>
          {/* Form */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Catat Pengeluaran Operasional</h2>
            </div>
            <form onSubmit={(e) => void handleSaveExpense(e)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Kategori Beban *</label>
                <select
                  className="atelier-form-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                >
                  <option value="RAW_MATERIAL">Bahan Baku (Pita/Bunga/Kertas)</option>
                  <option value="OPERATIONAL">Operasional (Listrik/Air/Internet)</option>
                  <option value="SALARY">Gaji &amp; Upah Karyawan</option>
                  <option value="TRANSPORT">Transportasi / Bahan Bakar</option>
                  <option value="MARKETING">Promosi / Iklan</option>
                  <option value="OTHER">Pengeluaran Lainnya</option>
                </select>
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Nominal Biaya (IDR) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  className="atelier-form-input"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Deskripsi Keperluan *</label>
                <input
                  required
                  className="atelier-form-input"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Beli kertas celophane pink 10 lembar"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Tanggal Transaksi *</label>
                <input
                  type="date"
                  required
                  className="atelier-form-input"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="atelier-btn-primary"
                disabled={loading}
                style={{ alignSelf: "flex-start", marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>{loading ? "Menyimpan…" : "Catat Pengeluaran"}</span>
              </button>
            </form>
          </section>

          {/* Table */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Buku Pengeluaran ({expenses.length})</h2>
              {expenses.length > 0 && (
                <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                  Total: <strong style={{ color: "#991b2b" }}>{rupiah.format(totalExpenses)}</strong>
                </span>
              )}
            </div>
            <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              {expenses.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                  Belum ada catatan pengeluaran.
                </div>
              ) : (
                <table className="atelier-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kategori</th>
                      <th>Deskripsi</th>
                      <th>Jumlah</th>
                      <th style={{ textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{exp.expenseDate}</td>
                        <td>
                          <span className="status-badge-pill tag-neutral" style={{ fontSize: "10px" }}>
                            {EXPENSE_LABELS[exp.category] ?? exp.category}
                          </span>
                        </td>
                        <td style={{ fontSize: "12.5px" }}>{exp.description}</td>
                        <td>
                          <strong style={{ color: "#991b2b", fontVariantNumeric: "tabular-nums" }}>
                            {rupiah.format(Number(exp.amount))}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="atelier-btn-danger compact"
                            onClick={() => void handleDeleteExpense(exp.id)}
                            title="Hapus entri"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
