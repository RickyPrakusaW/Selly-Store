"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2, Upload } from "lucide-react";
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
    <div className="admin-page-container">
      {/* Header Bar */}
      <header className="admin-page-header flex-between">
        <div>
          <Link href="/admin/catalog" className="back-link-btn">
            <ArrowLeft size={15} /> Kembali ke Katalog
          </Link>
          <h1 className="page-title-text">Tambah Produk Baru</h1>
        </div>
        <div className="header-actions">
          <Link href="/admin/catalog" className="btn-secondary-flat">
            Batal
          </Link>
          <button
            type="submit"
            form="new-product-form"
            className="btn-primary-maroon"
            disabled={submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan & Publikasikan"}
          </button>
        </div>
      </header>

      <form
        id="new-product-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="admin-two-col-layout"
      >
        {/* LEFT COLUMN */}
        <div className="admin-left-col">
          {/* Card 1: Main Info */}
          <div className="admin-panel-card">
            <div className="card-header-clean">
              <h2>Informasi Produk</h2>
              <p>Rincian dasar produk yang akan dilihat pembeli di toko.</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Nama Produk <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-control-clean"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Buket Mawar Merah Passionate"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Kategori <span className="required-star">*</span>
              </label>
              <select
                required
                className="form-control-clean select-clean"
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

            <div className="form-group">
              <label className="form-label">Deskripsi Produk</label>
              <textarea
                className="form-control-clean textarea-clean"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan deskripsi lengkap, jenis bunga, ukuran, dan saran perawatan..."
              />
            </div>
          </div>

          {/* Card 2: Pricing & Inventory */}
          <div className="admin-panel-card">
            <div className="card-header-clean">
              <h2>Harga &amp; Persediaan</h2>
              <p>
                Atur harga jual, tipe pengelolaan stok, dan durasi pengerjaan.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Harga Jual Dasar (Rp) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                className="form-control-clean"
                required
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="250000"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Tipe Stok <span className="required-star">*</span>
                </label>
                <select
                  className="form-control-clean select-clean"
                  value={stockType}
                  onChange={(e) =>
                    setStockType(
                      e.target.value as
                        "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT",
                    )
                  }
                >
                  <option value="READY_STOCK">Ready Stock (Siap Kirim)</option>
                  <option value="PRE_ORDER">Pre-Order (PO / Pesan Dulu)</option>
                  <option value="RENTAL_UNIT">
                    Unit Rental (Papan Ucapan)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Stok Awal <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  className="form-control-clean"
                  required
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
              </div>
            </div>

            {stockType === "PRE_ORDER" && (
              <div className="form-group">
                <label className="form-label">
                  Estimasi Pengerjaan PO (Hari)
                </label>
                <input
                  type="number"
                  className="form-control-clean"
                  min="1"
                  value={poDays}
                  onChange={(e) => setPoDays(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Card 3: Variants */}
          <div className="admin-panel-card">
            <div className="card-header-clean">
              <h2>Varian Produk (Opsional)</h2>
              <p>
                Opsi tambahan seperti isi tangkai, warna bouquet, atau ukuran
                hampers.
              </p>
            </div>

            <div className="variant-box-clean">
              <div className="variant-input-row">
                <div className="form-group flex-2">
                  <label className="form-label">Nama Varian</label>
                  <input
                    type="text"
                    className="form-control-clean"
                    placeholder="misal: 10 Tangkai / Soft Pink"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Biaya Tambahan (Rp)</label>
                  <input
                    type="number"
                    className="form-control-clean"
                    placeholder="0"
                    value={variantDelta}
                    onChange={(e) => setVariantDelta(e.target.value)}
                  />
                </div>
                <div className="form-group flex-auto">
                  <label className="form-label">&nbsp;</label>
                  <button
                    type="button"
                    className="btn-secondary-flat"
                    onClick={handleAddVariant}
                  >
                    <Plus size={15} /> Tambah
                  </button>
                </div>
              </div>

              {variants.length > 0 ? (
                <table className="clean-table variant-table">
                  <thead>
                    <tr>
                      <th>Varian</th>
                      <th>Biaya Tambahan</th>
                      <th style={{ width: "60px", textAlign: "center" }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{v.name}</strong>
                        </td>
                        <td>
                          <span
                            className={
                              v.priceDelta > 0
                                ? "badge-price-extra"
                                : "badge-price-free"
                            }
                          >
                            {v.priceDelta > 0
                              ? `+ Rp ${v.priceDelta.toLocaleString("id-ID")}`
                              : "Gratis"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-icon-danger"
                            onClick={() => handleRemoveVariant(idx)}
                            title="Hapus varian"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="clean-empty-note">
                  Belum ada varian. Isi bidang di atas lalu klik Tambah.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="admin-right-col">
          {/* Card 4: Product Image */}
          <div className="admin-panel-card">
            <div className="card-header-clean">
              <h2>Foto Utama Produk</h2>
              <p>Pilih foto produk berkualitas tinggi.</p>
            </div>

            <div className="dropzone-clean">
              {previewUrl ? (
                <div className="preview-wrap-clean">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="dropzone-preview-thumb"
                  />
                  <button
                    type="button"
                    className="btn-secondary-flat compact"
                    onClick={() => handleFileChange(null)}
                  >
                    Ganti Foto
                  </button>
                </div>
              ) : (
                <label className="dropzone-label-clean">
                  <Upload size={32} style={{ color: "#701a35" }} />
                  <strong>Pilih Foto Produk</strong>
                  <small>JPG, PNG, atau WEBP (Maks. 5MB)</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              )}
            </div>
          </div>

          {/* Publication Box */}
          <div className="admin-panel-card sticky-panel">
            <div className="card-header-clean">
              <h2>Status Publikasi</h2>
              <p>Simpan dan langsung tampilkan produk di toko.</p>
            </div>

            <div className="panel-actions-col">
              <button
                type="submit"
                className="btn-primary-maroon full-btn"
                disabled={submitting}
              >
                <Check size={16} />
                {submitting ? "Menyimpan..." : "Simpan & Publikasikan"}
              </button>
              <Link
                href="/admin/catalog"
                className="btn-secondary-flat full-btn center-text"
              >
                Batal
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
