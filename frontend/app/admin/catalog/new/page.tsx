"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  adminCreateProduct,
  adminUploadProductImage,
  fetchCategories,
  fetchProducts,
} from "@/lib/api";
import { announceCatalogChange } from "@/lib/catalog-events";
import { useSeliStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminNewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useSeliStore((state) => state.showToast);

  /* Form Fields */
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stockType, setStockType] = useState<
    "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT"
  >("READY_STOCK");
  const [stockQty, setStockQty] = useState("10");
  const [poDays, setPoDays] = useState("3");

  /* Image Upload */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* Variants */
  const [variants, setVariants] = useState<
    Array<{ name: string; priceDelta: number }>
  >([]);
  const [variantName, setVariantName] = useState("");
  const [variantDelta, setVariantDelta] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setUploadFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast("Format file harus JPG, PNG, atau WEBP", "error");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast("Ukuran file maksimal 5MB", "error");
      return;
    }

    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddVariant = () => {
    if (!variantName.trim()) return;
    setVariants([
      ...variants,
      { name: variantName.trim(), priceDelta: Number(variantDelta) || 0 },
    ]);
    setVariantName("");
    setVariantDelta("");
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !basePrice) {
      showToast("Harap isi semua kolom wajib (*)", "error");
      return;
    }

    setSubmitting(true);
    let uploadSuccess = true;
    let uploadErrorMessage = "";

    try {
      const product = await adminCreateProduct<Product>({
        name,
        categoryId,
        description,
        basePrice: Number(basePrice),
        stockType,
        stockQty: Number(stockQty),
        poDays: stockType === "PRE_ORDER" ? Number(poDays) : undefined,
        variants: variants.map((variant) => ({
          variantName: variant.name,
          priceDelta: variant.priceDelta,
        })),
      });

      if (uploadFile && product?.id) {
        try {
          await adminUploadProductImage(product.id, uploadFile, true);
        } catch (uploadErr) {
          uploadSuccess = false;
          uploadErrorMessage =
            uploadErr instanceof Error
              ? uploadErr.message
              : "Gagal mengunggah foto produk";
        }
      }

      const latestProducts = await fetchProducts();
      queryClient.setQueryData(["admin-products"], latestProducts);
      queryClient.removeQueries({ queryKey: ["products"] });
      announceCatalogChange();

      if (!uploadSuccess) {
        showToast(
          `Produk "${name}" dibuat, tetapi foto gagal diunggah: ${uploadErrorMessage}`,
          "error",
        );
      } else {
        showToast(`Produk "${name}" berhasil ditambahkan!`);
      }

      router.push("/admin/catalog");
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal membuat produk",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <Link
            href="/admin/catalog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--admin-muted)",
              fontSize: "12.5px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Kembali ke Katalog</span>
          </Link>
          <h1>Tambah Produk Baru</h1>
          <p>
            Daftarkan buket bunga, papan ucapan, atau item hampers baru ke dalam katalog toko online Seli Florist.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/catalog" className="atelier-btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            form="new-product-form"
            className="atelier-btn-primary"
            disabled={submitting}
          >
            <Check size={16} weight="bold" />
            <span>{submitting ? "Menyimpan…" : "Simpan & Publikasikan"}</span>
          </button>
        </div>
      </header>

      {/* ─── Two-Column Layout ─── */}
      <form
        id="new-product-form"
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px", alignItems: "start" }}
      >
        {/* Left Column: Product Details & Pricing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section 1: Basic Information */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Informasi Dasar Produk</h2>
            </div>
            <div className="atelier-panel-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Nama Produk *</label>
                <input
                  type="text"
                  required
                  className="atelier-form-input"
                  placeholder="Contoh: Buket Mawar Merah Passionate 10 Tangkai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Kategori *</label>
                <select
                  required
                  className="atelier-form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Deskripsi Rangkaian Bunga</label>
                <textarea
                  rows={4}
                  className="atelier-form-textarea"
                  placeholder="Jelaskan jenis bunga, nuansa warna pembungkus (wrapping), ukuran, dan pesan bunga..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Pricing & Stock Model */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Harga &amp; Skema Persediaan</h2>
            </div>
            <div className="atelier-panel-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Harga Jual Dasar (IDR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="atelier-form-input"
                  placeholder="Contoh: 350000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="atelier-form-group">
                  <label className="atelier-form-label">Model Stok *</label>
                  <select
                    className="atelier-form-select"
                    value={stockType}
                    onChange={(e) =>
                      setStockType(
                        e.target.value as "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT",
                      )
                    }
                  >
                    <option value="READY_STOCK">Ready Stock (Siap Kirim)</option>
                    <option value="PRE_ORDER">Pre-Order (PO / Dirangkai Dulu)</option>
                    <option value="RENTAL_UNIT">Unit Rental (Papan Ucapan)</option>
                  </select>
                </div>

                <div className="atelier-form-group">
                  <label className="atelier-form-label">Jumlah Stok Awal *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="atelier-form-input"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                  />
                </div>
              </div>

              {stockType === "PRE_ORDER" && (
                <div className="atelier-form-group">
                  <label className="atelier-form-label">Estimasi Pengerjaan PO (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    className="atelier-form-input"
                    value={poDays}
                    onChange={(e) => setPoDays(e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Optional Variants */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Varian Produk (Opsional)</h2>
            </div>
            <div className="atelier-panel-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--admin-muted)" }}>
                Tambahkan pilihan ukuran buket, warna kertas pembungkus, atau tambahan tangkai bunga.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr auto", gap: "10px", alignItems: "flex-end" }}>
                <div className="atelier-form-group">
                  <label className="atelier-form-label">Nama Varian</label>
                  <input
                    type="text"
                    className="atelier-form-input"
                    placeholder="Misal: Ukuran Jumbo / Tambah Cokelat"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                  />
                </div>
                <div className="atelier-form-group">
                  <label className="atelier-form-label">Selisih Harga (+ IDR)</label>
                  <input
                    type="number"
                    className="atelier-form-input"
                    placeholder="0"
                    value={variantDelta}
                    onChange={(e) => setVariantDelta(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="atelier-btn-secondary"
                  onClick={handleAddVariant}
                  style={{ height: "38px" }}
                >
                  <Plus size={14} weight="bold" />
                  <span>Tambah</span>
                </button>
              </div>

              {variants.length > 0 && (
                <div className="atelier-table-wrap">
                  <table className="atelier-table">
                    <thead>
                      <tr>
                        <th>Nama Varian</th>
                        <th>Biaya Tambahan</th>
                        <th style={{ textAlign: "right" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, idx) => (
                        <tr key={idx}>
                          <td><strong>{v.name}</strong></td>
                          <td>
                            {v.priceDelta > 0 ? (
                              <span style={{ color: "#166437", fontWeight: 600 }}>
                                + Rp {v.priceDelta.toLocaleString("id-ID")}
                              </span>
                            ) : (
                              <span style={{ color: "var(--admin-muted)" }}>Tanpa biaya tambahan</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="atelier-btn-danger compact"
                              onClick={() => handleRemoveVariant(idx)}
                            >
                              <Trash size={13} weight="bold" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Photo Upload & Publish Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Photo Upload Section */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Foto Utama Produk</h2>
            </div>
            <div className="atelier-panel-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {previewUrl ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview Produk"
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid var(--admin-border)",
                    }}
                  />
                  <button
                    type="button"
                    className="atelier-btn-secondary compact"
                    onClick={() => handleFileChange(null)}
                  >
                    Ganti Foto
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "36px 16px",
                    border: "2px dashed var(--admin-border)",
                    borderRadius: "12px",
                    background: "var(--admin-surface-muted)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <UploadSimple size={28} weight="regular" style={{ color: "var(--admin-rose)" }} />
                  <strong style={{ fontSize: "13px", color: "var(--admin-ink)" }}>
                    Pilih Foto Produk
                  </strong>
                  <small style={{ color: "var(--admin-muted)", fontSize: "11px" }}>
                    Format JPG, PNG, atau WEBP (Maksimal 5MB)
                  </small>
                  <input
                    type="file"
                    style={{ display: "none" }}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </section>

          {/* Publishing Card */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Publikasi</h2>
            </div>
            <div className="atelier-panel-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--admin-muted)" }}>
                Setelah disimpan, produk akan langsung tampil di etalase toko dan siap dipesan pelanggan.
              </p>
              <button
                type="submit"
                className="atelier-btn-primary"
                style={{ width: "100%", padding: "10px" }}
                disabled={submitting}
              >
                <Check size={16} weight="bold" />
                <span>{submitting ? "Menyimpan Produk…" : "Simpan & Publikasikan"}</span>
              </button>
              <Link
                href="/admin/catalog"
                className="atelier-btn-secondary"
                style={{ width: "100%", padding: "10px", textAlign: "center" }}
              >
                Batal
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
