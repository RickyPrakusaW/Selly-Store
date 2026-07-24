"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ImagePlus,
  Package,
  PenLine,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteProduct,
  adminDeleteProductImage,
  adminUpdateStock,
  adminUploadProductImage,
  fetchCategories,
  fetchProducts,
  resolveImageUrl,
} from "@/lib/api";
import { announceCatalogChange } from "@/lib/catalog-events";

import { useSeliStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const showToast = useSeliStore((state) => state.showToast);
  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products",
  );
  const [searchQuery, setSearchQuery] = useState("");

  /* Modal Image State */
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  /* Category Form State */
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const { data: categories = [], refetch: refetchCategories } = useQuery<
    Category[]
  >({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
    staleTime: 0,
    refetchInterval: 3000,
  });

  const { data: products = [], refetch: refetchProducts } = useQuery<Product[]>(
    {
      queryKey: ["admin-products"],
      queryFn: () => fetchProducts(),
      staleTime: 0,
      refetchInterval: 3000,
    },
  );

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeletingProduct(true);
    try {
      const result = await adminDeleteProduct(productToDelete.id);
      showToast(
        result.message,
        result.mode === "archived" ? "info" : "success",
      );
      setProductToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchProducts();
      announceCatalogChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus produk",
        "error",
      );
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleUpdateStock = async (id: string, currentQty: number) => {
    const newQtyStr = prompt("Masukkan jumlah stok baru:", String(currentQty));
    if (newQtyStr === null) return;
    const newQty = Number(newQtyStr);
    if (isNaN(newQty)) return;
    try {
      await adminUpdateStock(id, { stockQty: newQty });
      showToast("Stok berhasil diperbarui");
      refetchProducts();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal memperbarui stok",
        "error",
      );
    }
  };

  const handleUploadImage = async (productId: string) => {
    if (!uploadFile) return;
    if (
      !ACCEPTED_IMAGE_TYPES.includes(uploadFile.type) ||
      uploadFile.size > MAX_IMAGE_SIZE
    ) {
      showToast(
        "Foto harus berformat JPG, PNG, atau WEBP dengan ukuran maksimal 5MB",
        "error",
      );
      return;
    }
    setLoading(true);
    try {
      await adminUploadProductImage(productId, uploadFile, true);
      showToast("Gambar produk berhasil diunggah");
      setUploadFile(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      const refreshed = await refetchProducts();
      const currentProduct = refreshed.data?.find(
        (product) => product.id === productId,
      );
      if (currentProduct) setSelectedProduct(currentProduct);
      announceCatalogChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal mengunggah gambar",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (productId: string, imageId: string) => {
    if (!confirm("Hapus gambar produk ini?")) return;
    try {
      await adminDeleteProductImage(productId, imageId);
      showToast("Gambar dihapus");
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      const refreshed = await refetchProducts();
      const currentProduct = refreshed.data?.find(
        (product) => product.id === productId,
      );
      if (currentProduct) setSelectedProduct(currentProduct);
      announceCatalogChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus gambar",
        "error",
      );
    }
  };

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    setLoading(true);
    try {
      await adminCreateCategory({
        name: catName,
        slug: catSlug.toLowerCase().replace(/\s+/g, "_"),
        ...(catDesc ? { description: catDesc } : {}),
      });
      showToast("Kategori baru berhasil dibuat");
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      refetchCategories();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal membuat kategori",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await adminDeleteCategory(id);
      showToast("Kategori dihapus");
      refetchCategories();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus kategori",
        "error",
      );
    }
  };

  return (
    <div className="admin-catalog-page">
      <header className="admin-page-header">
        <div>
          <h1>Kelola Katalog &amp; Stok Produk</h1>
          <p>
            Kelola daftar produk, ubah stok, atur gambar produk, dan kelola
            kategori.
          </p>
        </div>
        <Link href="/admin/catalog/new" className="primary-button">
          <Plus size={18} /> Tambah Produk Baru
        </Link>
      </header>

      {/* Tabs */}
      <div className="category-strip filter-tabs">
        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} /> Kelola Produk ({products.length})
        </button>
        <button
          className={activeTab === "categories" ? "active" : ""}
          onClick={() => setActiveTab("categories")}
        >
          <Tags size={16} /> Kelola Kategori ({categories.length})
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="admin-table-card full-width">
          <div className="table-header-toolbar">
            <h3>Daftar Seluruh Produk ({filteredProducts.length})</h3>
            <label className="header-search compact">
              <Search size={16} />
              <input
                type="text"
                placeholder="Cari nama produk / kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Produk &amp; Kategori</th>
                <th>Tipe Stok</th>
                <th>Harga Jual</th>
                <th>Stok Tersedia</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const rawImg =
                  prod.images?.find((i) => i.isPrimary)?.imageUrl ??
                  prod.images?.[0]?.imageUrl;
                const imgUrl = resolveImageUrl(rawImg);
                return (
                  <tr key={prod.id}>
                    <td>
                      {imgUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="admin-table-thumb"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-muted">No Image</span>
                      )}
                    </td>

                    <td>
                      <strong>{prod.name}</strong>
                      <br />
                      <small className="text-muted">
                        {prod.category?.name ?? "Tanpa Kategori"}
                      </small>
                    </td>
                    <td>
                      <span className="stock-type-tag">
                        {prod.stockType === "READY_STOCK" && "Ready Stock"}
                        {prod.stockType === "PRE_ORDER" &&
                          `PO (${prod.poDays ?? 3} hr)`}
                        {prod.stockType === "RENTAL_UNIT" && "Papan Rental"}
                      </span>
                    </td>
                    <td>
                      <strong>{rupiah.format(Number(prod.basePrice))}</strong>
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        onClick={() =>
                          void handleUpdateStock(
                            prod.id,
                            prod.availableQty ?? 0,
                          )
                        }
                        title="Klik untuk ubah stok"
                      >
                        {prod.availableQty ?? 0} unit{" "}
                        <PenLine size={13} aria-hidden="true" />
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="table-action-btn"
                          onClick={() => setSelectedProduct(prod)}
                        >
                          <ImagePlus size={14} /> Foto
                        </button>
                        <button
                          className="table-action-btn danger"
                          onClick={() => setProductToDelete(prod)}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="admin-two-cols">
          <form
            className="admin-card-form"
            onSubmit={(e) => void handleCreateCategory(e)}
          >
            <h3>Buat Kategori Baru</h3>
            <label>
              Nama Kategori *
              <input
                required
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                }}
                placeholder="Buket Bunga Segar"
              />
            </label>

            <label>
              Slug Kategori *
              <input
                required
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="buket_bunga"
              />
            </label>

            <label>
              Deskripsi Kategori
              <textarea
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              <Plus size={16} /> {loading ? "Membuat…" : "Tambah Kategori"}
            </button>
          </form>

          <div className="admin-table-card">
            <h3>Daftar Kategori</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Slug</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <code>{c.slug}</code>
                    </td>
                    <td>
                      <button
                        className="table-action-btn danger"
                        onClick={() => void handleDeleteCategory(c.id)}
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {selectedProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="catalog-image-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="catalog-modal-header">
              <div>
                <h2 id="image-modal-title">Foto Produk</h2>
                <p>{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                className="catalog-modal-close"
                aria-label="Tutup pengelola foto"
                onClick={() => setSelectedProduct(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="existing-images-grid">
              {selectedProduct.images?.map((img) => (
                <div key={img.id} className="image-preview-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(img.imageUrl)}
                    alt="Produk"
                    className="admin-modal-thumb"
                  />
                  <button
                    className="delete-chip-btn"
                    aria-label={`Hapus foto ${selectedProduct.name}`}
                    onClick={() =>
                      void handleDeleteImage(selectedProduct.id, img.id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {!selectedProduct.images?.length && (
                <p className="clean-empty-note">
                  Produk ini belum memiliki foto.
                </p>
              )}
            </div>

            <label className="file-input-label catalog-file-input">
              <Upload size={20} aria-hidden="true" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <span>{uploadFile ? uploadFile.name : "Pilih Foto Baru"}</span>
              <small>JPG, PNG, atau WEBP, maksimal 5MB</small>
            </label>

            <div className="modal-actions-row">
              <button
                className="btn-secondary-flat"
                onClick={() => setSelectedProduct(null)}
              >
                Tutup
              </button>
              <button
                className="btn-primary-maroon"
                disabled={loading || !uploadFile}
                onClick={() => void handleUploadImage(selectedProduct.id)}
              >
                <Upload size={16} /> {loading ? "Mengunggah..." : "Unggah Foto"}
              </button>
            </div>
          </section>
        </div>
      )}

      {productToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!deletingProduct) setProductToDelete(null);
          }}
        >
          <section
            className="catalog-image-modal catalog-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-modal-icon" aria-hidden="true">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 id="delete-product-title">Hapus produk?</h2>
              <p className="delete-product-name">{productToDelete.name}</p>
            </div>
            <div id="delete-product-description" className="delete-policy-note">
              <strong>Pembersihan aman otomatis</strong>
              <p>
                Produk tanpa riwayat transaksi akan dihapus permanen bersama
                gambar dan data operasionalnya. Produk yang memiliki riwayat
                transaksi akan diarsipkan agar laporan tetap akurat, sementara
                file gambar dan data yang tidak diperlukan akan dibersihkan.
              </p>
            </div>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-secondary-flat"
                disabled={deletingProduct}
                onClick={() => setProductToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger-solid"
                disabled={deletingProduct}
                onClick={() => void handleDeleteProduct()}
              >
                <Trash2 size={16} />
                {deletingProduct ? "Memproses..." : "Hapus Produk"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
