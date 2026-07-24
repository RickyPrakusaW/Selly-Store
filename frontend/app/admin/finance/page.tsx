"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, Plus, Trash2, TrendingUp, Wallet } from "lucide-react";
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

export default function AdminFinancePage() {
  const showToast = useSeliStore((state) => state.showToast);
  const [activeTab, setActiveTab] = useState<"costs" | "capital" | "expenses">(
    "costs",
  );

  // Product Costs Form State
  const [costProductId, setCostProductId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [costEffectiveDate, setCostEffectiveDate] = useState(todayIsoDate());

  // Capital Form State
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalSource, setCapitalSource] = useState("");
  const [capitalNote, setCapitalNote] = useState("");
  const [capitalDate, setCapitalDate] = useState(todayIsoDate());

  // Expense Form State
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
      showToast("Pengeluaran berhasil dicatat");
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
      showToast("Pengeluaran dihapus");
      refetchExpenses();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus",
        "error",
      );
    }
  };

  return (
    <div className="admin-finance-page">
      <header className="admin-page-header">
        <div>
          <h1>Manajemen Keuangan &amp; Akuntansi</h1>
          <p>
            Catat HPP (Bahan Baku), Modal Pemilik, dan Biaya Operasional Toko.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="category-strip filter-tabs">
        <button
          className={activeTab === "costs" ? "active" : ""}
          onClick={() => setActiveTab("costs")}
        >
          <DollarSign size={16} /> Harga Pokok (HPP)
        </button>
        <button
          className={activeTab === "capital" ? "active" : ""}
          onClick={() => setActiveTab("capital")}
        >
          <Wallet size={16} /> Injeksi Modal Pemilik
        </button>
        <button
          className={activeTab === "expenses" ? "active" : ""}
          onClick={() => setActiveTab("expenses")}
        >
          <TrendingUp size={16} /> Biaya Operasional
        </button>
      </div>

      {/* TAB 1: PRODUCT COSTS (HPP) */}
      {activeTab === "costs" && (
        <div className="admin-two-cols">
          <form
            className="admin-card-form"
            onSubmit={(e) => void handleSaveCost(e)}
          >
            <h3>Atur Harga Pokok (HPP) Produk</h3>
            <label>
              Pilih Produk *
              <select
                required
                value={costProductId}
                onChange={(e) => setCostProductId(e.target.value)}
                className="admin-select"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Jual: {rupiah.format(Number(p.basePrice))})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Harga Modal / HPP (Rp) *
              <input
                type="number"
                required
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="50000"
              />
            </label>

            <label>
              Tanggal Efektif *
              <input
                type="date"
                required
                value={costEffectiveDate}
                onChange={(e) => setCostEffectiveDate(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              <Plus size={16} /> {loading ? "Menyimpan…" : "Simpan HPP Produk"}
            </button>
          </form>

          <div className="admin-table-card">
            <h3>Daftar HPP Produk Terdaftar</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Modal (HPP)</th>
                  <th>Tanggal Efektif</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.product?.name ?? c.productId}</strong>
                    </td>
                    <td>{rupiah.format(Number(c.costPrice))}</td>
                    <td>{c.effectiveDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CAPITAL INJECTIONS */}
      {activeTab === "capital" && (
        <div className="admin-two-cols">
          <form
            className="admin-card-form"
            onSubmit={(e) => void handleSaveCapital(e)}
          >
            <h3>Tambah Modal Pemilik</h3>
            <label>
              Jumlah Modal (Rp) *
              <input
                type="number"
                required
                min="1000"
                value={capitalAmount}
                onChange={(e) => setCapitalAmount(e.target.value)}
                placeholder="5000000"
              />
            </label>

            <label>
              Sumber Modal *
              <input
                required
                value={capitalSource}
                onChange={(e) => setCapitalSource(e.target.value)}
                placeholder="Setoran Tunai Pemilik / Bank BCA"
              />
            </label>

            <label>
              Tanggal Masuk Modal *
              <input
                type="date"
                required
                value={capitalDate}
                onChange={(e) => setCapitalDate(e.target.value)}
              />
            </label>

            <label>
              Catatan Keterangan
              <input
                value={capitalNote}
                onChange={(e) => setCapitalNote(e.target.value)}
                placeholder="Tambahan kas awal bulan..."
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              <Plus size={16} /> {loading ? "Mencatat…" : "Tambah Modal"}
            </button>
          </form>

          <div className="admin-table-card">
            <h3>Riwayat Injeksi Modal</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jumlah</th>
                  <th>Sumber</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {capital.map((cap) => (
                  <tr key={cap.id}>
                    <td>{cap.injectedAt}</td>
                    <td>
                      <strong>{rupiah.format(Number(cap.amount))}</strong>
                    </td>
                    <td>{cap.source}</td>
                    <td>{cap.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL EXPENSES */}
      {activeTab === "expenses" && (
        <div className="admin-two-cols">
          <form
            className="admin-card-form"
            onSubmit={(e) => void handleSaveExpense(e)}
          >
            <h3>Catat Pengeluaran Operasional</h3>
            <label>
              Kategori Pengeluaran *
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="admin-select"
              >
                <option value="RAW_MATERIAL">
                  Bahan Baku (Pita/Kertas/Bunga)
                </option>
                <option value="OPERATIONAL">
                  Operasional Toko (Listrik/Air/Internet)
                </option>
                <option value="SALARY">Gaji Karyawan</option>
                <option value="TRANSPORT">Transportasi / Bensin</option>
                <option value="MARKETING">Iklan / Pemasaran</option>
                <option value="OTHER">Lain-lain</option>
              </select>
            </label>

            <label>
              Nominal Pengeluaran (Rp) *
              <input
                type="number"
                required
                min="100"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="150000"
              />
            </label>

            <label>
              Deskripsi Pengeluaran *
              <input
                required
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="Beli kertas wrapping pink 5 roll"
              />
            </label>

            <label>
              Tanggal Pengeluaran *
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              <Plus size={16} /> {loading ? "Mencatat…" : "Catat Pengeluaran"}
            </button>
          </form>

          <div className="admin-table-card">
            <h3>Daftar Pengeluaran Toko</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.expenseDate}</td>
                    <td>
                      <span className="badge-chip">{exp.category}</span>
                    </td>
                    <td>{exp.description}</td>
                    <td>
                      <strong>{rupiah.format(Number(exp.amount))}</strong>
                    </td>
                    <td>
                      <button
                        className="table-action-btn danger"
                        onClick={() => void handleDeleteExpense(exp.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
