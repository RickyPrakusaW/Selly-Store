"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FloppyDisk,
  ImageSquare,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Rows,
  SquaresFour,
  Tag,
  Trash,
  UploadSimple,
  Warning,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteProduct,
  adminDeleteProductImage,
  adminUpdateProduct,
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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");

  /* Modal Image State */
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  /* View & Edit Product Modal State */
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");
  const [editStockType, setEditStockType] = useState<
    "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT"
  >("READY_STOCK");
  const [editStockQty, setEditStockQty] = useState("0");
  const [editPoDays, setEditPoDays] = useState("3");
  const [savingEdit, setSavingEdit] = useState(false);

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
    refetchInterval: 5000,
  });

  const { data: products = [], refetch: refetchProducts } = useQuery<Product[]>(
    {
      queryKey: ["admin-products"],
      queryFn: () => fetchProducts(),
      staleTime: 0,
      refetchInterval: 5000,
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

  const confirmDeleteProduct = (prod: Product) => {
    setProductToDelete(prod);
    setDeleteConfirmText("");
  };

  const openViewProduct = (prod: Product, edit = false) => {
    setViewProduct(prod);
    setIsEditing(edit);
    setEditName(prod.name);
    setEditCategoryId(prod.category?.id || "");
    setEditDescription(prod.description || "");
    setEditBasePrice(String(prod.basePrice));
    setEditStockType(
      (prod.stockType as "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT") ||
        "READY_STOCK",
    );
    setEditStockQty(String(prod.availableQty ?? 0));
    setEditPoDays(String(prod.poDays ?? 3));
  };

  const handleSaveProductEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!viewProduct) return;
    setSavingEdit(true);
    try {
      await adminUpdateProduct(viewProduct.id, {
        name: editName,
        categoryId: editCategoryId || undefined,
        description: editDescription,
        basePrice: Number(editBasePrice),
        stockType: editStockType,
        stockQty: Number(editStockQty),
        poDays: editStockType === "PRE_ORDER" ? Number(editPoDays) : undefined,
      });
      showToast("Produk berhasil diperbarui!", "success");
      setIsEditing(false);
      setViewProduct(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchProducts();
      announceCatalogChange();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal memperbarui produk",
        "error",
      );
    } finally {
      setSavingEdit(false);
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
      showToast("Foto produk berhasil diunggah");
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
        err instanceof Error ? err.message : "Gagal mengunggah foto",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (productId: string, imageId: string) => {
    if (!confirm("Hapus foto produk ini?")) return;
    try {
      await adminDeleteProductImage(productId, imageId);
      showToast("Foto produk dihapus");
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
        err instanceof Error ? err.message : "Gagal menghapus foto",
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
      showToast("Kategori baru berhasil ditambahkan");
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
    if (!confirm("Hapus kategori ini? Pastikan tidak ada produk terkait.")) return;
    try {
      await adminDeleteCategory(id);
      showToast("Kategori berhasil dihapus");
      refetchCategories();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus kategori",
        "error",
      );
    }
  };

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <h1>Katalog Bunga &amp; Manajemen Stok</h1>
          <p>
            Kelola inventaris buket bunga, papan ucapan, stok siap kirim, foto etalase, dan kategori produk.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/catalog/new" className="atelier-btn-primary">
            <Plus size={16} weight="bold" />
            <span>Tambah Produk Baru</span>
          </Link>
        </div>
      </header>

      {/* ─── Segmented Tabs: Produk vs Kategori ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div className="atelier-segmented-tabs">
          <button
            type="button"
            className={`atelier-tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Koleksi Produk ({products.length})
          </button>
          <button
            type="button"
            className={`atelier-tab-btn ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Kategori ({categories.length})
          </button>
        </div>

        {activeTab === "products" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="atelier-segmented-tabs">
              <button
                type="button"
                className={`atelier-tab-btn ${viewMode === "cards" ? "active" : ""}`}
                onClick={() => setViewMode("cards")}
                title="Tampilan Galeri Kartu"
              >
                <SquaresFour size={16} weight="regular" />
              </button>
              <button
                type="button"
                className={`atelier-tab-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel Rinci"
              >
                <Rows size={16} weight="regular" />
              </button>
            </div>

            <div className="atelier-search-box">
              <MagnifyingGlass size={16} weight="regular" />
              <input
                type="text"
                className="atelier-search-input"
                placeholder="Cari nama produk / kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── TAB 1: PRODUK ─── */}
      {activeTab === "products" && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="atelier-panel">
              <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                <Tag size={36} weight="light" style={{ margin: "0 auto 8px", color: "var(--admin-border)" }} />
                <strong style={{ display: "block", color: "var(--admin-ink)", fontSize: "14px" }}>
                  Tidak ada produk ditemukan
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  Ganti kata kunci pencarian atau klik &quot;Tambah Produk Baru&quot;.
                </p>
              </div>
            </div>
          ) : viewMode === "cards" ? (
            /* Cards View */
            <div className="admin-products-grid">
              {filteredProducts.map((prod) => {
                const rawImg =
                  prod.images?.find((i) => i.isPrimary)?.imageUrl ??
                  prod.images?.[0]?.imageUrl;
                const imgUrl = resolveImageUrl(rawImg);

                return (
                  <div
                    key={prod.id}
                    className="admin-product-card"
                    onClick={() => openViewProduct(prod)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="admin-prod-img-wrap">
                      {imgUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--admin-muted)", fontSize: "12px", background: "var(--admin-surface-muted)" }}>
                          Tanpa Foto
                        </div>
                      )}
                      <span
                        className={`status-badge-pill ${
                          prod.stockType === "READY_STOCK"
                            ? "badge-green"
                            : prod.stockType === "PRE_ORDER"
                            ? "badge-orange"
                            : "badge-blue"
                        }`}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                          fontSize: "10px",
                        }}
                      >
                        {prod.stockType === "READY_STOCK" && "Ready Stock"}
                        {prod.stockType === "PRE_ORDER" && `PO (${prod.poDays ?? 3}h)`}
                        {prod.stockType === "RENTAL_UNIT" && "Rental"}
                      </span>
                    </div>

                    <div className="admin-prod-body">
                      <span style={{ fontSize: "11px", color: "var(--admin-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {prod.category?.name ?? "Koleksi Toko"}
                      </span>
                      <strong className="admin-prod-title">{prod.name}</strong>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                        <span className="admin-prod-price">
                          {rupiah.format(Number(prod.basePrice))}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleUpdateStock(prod.id, prod.availableQty ?? 0);
                          }}
                          className="atelier-btn-secondary compact"
                          style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            color: (prod.availableQty ?? 0) <= 5 ? "#991b2b" : "var(--admin-ink)",
                            borderColor: (prod.availableQty ?? 0) <= 5 ? "#facbcf" : "var(--admin-border)",
                            background: (prod.availableQty ?? 0) <= 5 ? "#fdf2f2" : "#ffffff",
                          }}
                          title="Klik untuk ubah stok cepat"
                        >
                          <span>{prod.availableQty ?? 0} unit</span>
                          <PencilSimple size={11} weight="bold" />
                        </button>
                      </div>

                      <div className="admin-prod-footer" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="atelier-btn-secondary compact"
                          onClick={() => openViewProduct(prod, true)}
                          title="Edit Produk"
                        >
                          <PencilSimple size={13} weight="bold" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="atelier-btn-secondary compact"
                          onClick={() => setSelectedProduct(prod)}
                          title="Kelola Foto"
                        >
                          <ImageSquare size={13} weight="bold" />
                          <span>Foto</span>
                        </button>
                        <button
                          type="button"
                          className="atelier-btn-danger compact"
                          onClick={() => confirmDeleteProduct(prod)}
                          title="Hapus Produk"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="atelier-table-wrap">
              <table className="atelier-table">
                <thead>
                  <tr>
                    <th style={{ width: "64px" }}>Foto</th>
                    <th>Nama Produk &amp; Kategori</th>
                    <th>Tipe Stok</th>
                    <th>Harga Jual</th>
                    <th>Stok Tersedia</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
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
                              style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--admin-border)" }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "var(--admin-surface-muted)", display: "grid", placeItems: "center", fontSize: "10px", color: "var(--admin-muted)" }}>
                              N/A
                            </div>
                          )}
                        </td>
                        <td>
                          <strong
                            style={{ color: "var(--admin-rose)", cursor: "pointer", fontSize: "13px" }}
                            onClick={() => openViewProduct(prod)}
                          >
                            {prod.name}
                          </strong>
                          <small style={{ display: "block", color: "var(--admin-muted)", fontSize: "11px" }}>
                            {prod.category?.name ?? "Tanpa Kategori"}
                          </small>
                        </td>
                        <td>
                          <span className="status-badge-pill tag-neutral">
                            {prod.stockType === "READY_STOCK" && "Ready Stock"}
                            {prod.stockType === "PRE_ORDER" && `PO (${prod.poDays ?? 3} hari)`}
                            {prod.stockType === "RENTAL_UNIT" && "Rental Papan"}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                            {rupiah.format(Number(prod.basePrice))}
                          </strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="atelier-btn-secondary compact"
                            onClick={() => void handleUpdateStock(prod.id, prod.availableQty ?? 0)}
                            title="Klik untuk ubah stok cepat"
                          >
                            <span>{prod.availableQty ?? 0} unit</span>
                            <PencilSimple size={12} weight="bold" />
                          </button>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="atelier-btn-secondary compact"
                              onClick={() => openViewProduct(prod, true)}
                            >
                              <PencilSimple size={13} weight="bold" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="atelier-btn-secondary compact"
                              onClick={() => setSelectedProduct(prod)}
                            >
                              <ImageSquare size={13} weight="bold" />
                              <span>Foto</span>
                            </button>
                            <button
                              type="button"
                              className="atelier-btn-danger compact"
                              onClick={() => confirmDeleteProduct(prod)}
                            >
                              <Trash size={13} weight="bold" />
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
        </>
      )}

      {/* ─── TAB 2: KATEGORI ─── */}
      {activeTab === "categories" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px" }}>
          {/* Add Category Form */}
          <div className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Tambah Kategori Baru</h2>
            </div>
            <form onSubmit={(e) => void handleCreateCategory(e)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="atelier-form-group">
                <label className="atelier-form-label">Nama Kategori *</label>
                <input
                  required
                  className="atelier-form-input"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                  }}
                  placeholder="Contoh: Buket Bunga Meja"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Slug Sistem *</label>
                <input
                  required
                  className="atelier-form-input"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="buket_bunga_meja"
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  className="atelier-form-textarea"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Koleksi rangkaian bunga segar untuk hiasan meja..."
                />
              </div>

              <button
                type="submit"
                className="atelier-btn-primary"
                disabled={loading}
                style={{ alignSelf: "flex-start", marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>{loading ? "Menyimpan…" : "Simpan Kategori"}</span>
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Daftar Kategori Aktif</h2>
            </div>
            <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="atelier-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Slug</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <code style={{ fontSize: "11.5px", color: "var(--admin-muted)" }}>{c.slug}</code>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="atelier-btn-danger compact"
                          onClick={() => void handleDeleteCategory(c.id)}
                        >
                          <Trash size={13} weight="bold" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: View & Edit Product ─── */}
      {viewProduct && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            if (!savingEdit) setViewProduct(null);
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: "580px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{isEditing ? "Edit Rincian Produk" : "Pratinjau Produk"}</h3>
                <small style={{ color: "var(--admin-muted)", fontSize: "12px" }}>{viewProduct.name}</small>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setViewProduct(null)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={(e) => void handleSaveProductEdit(e)} className="admin-modal-body">
                <div className="atelier-form-group">
                  <label className="atelier-form-label">Nama Produk *</label>
                  <input
                    required
                    className="atelier-form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="atelier-form-group">
                    <label className="atelier-form-label">Kategori</label>
                    <select
                      className="atelier-form-select"
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="atelier-form-group">
                    <label className="atelier-form-label">Tipe Stok *</label>
                    <select
                      className="atelier-form-select"
                      value={editStockType}
                      onChange={(e) =>
                        setEditStockType(
                          e.target.value as "READY_STOCK" | "PRE_ORDER" | "RENTAL_UNIT",
                        )
                      }
                    >
                      <option value="READY_STOCK">Ready Stock</option>
                      <option value="PRE_ORDER">Pre Order (PO)</option>
                      <option value="RENTAL_UNIT">Rental Unit</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="atelier-form-group">
                    <label className="atelier-form-label">Harga Jual (IDR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="atelier-form-input"
                      value={editBasePrice}
                      onChange={(e) => setEditBasePrice(e.target.value)}
                    />
                  </div>

                  <div className="atelier-form-group">
                    <label className="atelier-form-label">Jumlah Stok *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="atelier-form-input"
                      value={editStockQty}
                      onChange={(e) => setEditStockQty(e.target.value)}
                    />
                  </div>
                </div>

                {editStockType === "PRE_ORDER" && (
                  <div className="atelier-form-group">
                    <label className="atelier-form-label">Estimasi Pengerjaan PO (Hari)</label>
                    <input
                      type="number"
                      min={1}
                      className="atelier-form-input"
                      value={editPoDays}
                      onChange={(e) => setEditPoDays(e.target.value)}
                    />
                  </div>
                )}

                <div className="atelier-form-group">
                  <label className="atelier-form-label">Deskripsi Rangkaian Bunga</label>
                  <textarea
                    rows={3}
                    className="atelier-form-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="admin-modal-footer" style={{ margin: "8px -20px -20px -20px" }}>
                  <button
                    type="button"
                    className="atelier-btn-secondary compact"
                    onClick={() => setIsEditing(false)}
                    disabled={savingEdit}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="atelier-btn-primary compact"
                    disabled={savingEdit}
                  >
                    <FloppyDisk size={14} weight="bold" />
                    <span>{savingEdit ? "Menyimpan…" : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-modal-body">
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {viewProduct.images?.length ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={resolveImageUrl(
                        viewProduct.images.find((i) => i.isPrimary)?.imageUrl ??
                          viewProduct.images[0]?.imageUrl,
                      )}
                      alt={viewProduct.name}
                      style={{
                        width: "88px",
                        height: "88px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1px solid var(--admin-border)",
                      }}
                    />
                  ) : (
                    <div style={{ width: "88px", height: "88px", background: "var(--admin-surface-muted)", borderRadius: "10px", display: "grid", placeItems: "center", fontSize: "11px", color: "var(--admin-muted)" }}>
                      Tanpa Foto
                    </div>
                  )}

                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "17px", color: "var(--admin-rose)" }}>
                      {viewProduct.name}
                    </h4>
                    <p style={{ margin: "0 0 6px", fontSize: "12.5px", color: "var(--admin-muted)" }}>
                      Kategori: {viewProduct.category?.name ?? "Tanpa Kategori"}
                    </p>
                    <strong style={{ fontSize: "16px", color: "var(--admin-ink)" }}>
                      {rupiah.format(Number(viewProduct.basePrice))}
                    </strong>
                  </div>
                </div>

                <div style={{ background: "var(--admin-surface-muted)", padding: "12px 14px", borderRadius: "10px", fontSize: "13px" }}>
                  <div><strong>Stok:</strong> {viewProduct.availableQty ?? 0} unit</div>
                  {viewProduct.description && (
                    <p style={{ margin: "8px 0 0", color: "var(--admin-muted)", fontSize: "12.5px" }}>
                      {viewProduct.description}
                    </p>
                  )}
                </div>

                <div className="admin-modal-footer" style={{ margin: "8px -20px -20px -20px" }}>
                  <button
                    type="button"
                    className="atelier-btn-secondary compact"
                    onClick={() => {
                      const prod = viewProduct;
                      setViewProduct(null);
                      setSelectedProduct(prod);
                    }}
                  >
                    <ImageSquare size={14} weight="bold" />
                    <span>Kelola Foto</span>
                  </button>
                  <button
                    type="button"
                    className="atelier-btn-primary compact"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilSimple size={14} weight="bold" />
                    <span>Edit Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Foto Produk ─── */}
      {selectedProduct && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: "540px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Galeri Foto Produk</h3>
                <small style={{ color: "var(--admin-muted)", fontSize: "12px" }}>{selectedProduct.name}</small>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedProduct(null)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                {selectedProduct.images?.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageUrl(img.imageUrl)}
                      alt="Produk"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      aria-label="Hapus foto"
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "rgba(153, 27, 43, 0.9)",
                        color: "#fff",
                        border: "none",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => void handleDeleteImage(selectedProduct.id, img.id)}
                    >
                      <Trash size={12} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>

              {(!selectedProduct.images || selectedProduct.images.length === 0) && (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--admin-muted)", background: "var(--admin-surface-muted)", borderRadius: "8px", fontSize: "12.5px" }}>
                  Belum ada foto yang diunggah untuk produk ini.
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--admin-border)", paddingTop: "14px" }}>
                <label className="atelier-form-label" style={{ marginBottom: "6px", display: "block" }}>
                  Unggah Foto Baru
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: "12.5px" }}
                />
                <small style={{ display: "block", color: "var(--admin-muted)", fontSize: "11px", marginTop: "4px" }}>
                  Format JPG, PNG, atau WEBP (Maksimal 5MB)
                </small>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="atelier-btn-secondary compact"
                onClick={() => setSelectedProduct(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="atelier-btn-primary compact"
                disabled={loading || !uploadFile}
                onClick={() => void handleUploadImage(selectedProduct.id)}
              >
                <UploadSimple size={14} weight="bold" />
                <span>{loading ? "Mengunggah…" : "Unggah Foto"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Hapus Produk ─── */}
      {productToDelete && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            if (!deletingProduct) setProductToDelete(null);
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Warning size={20} weight="fill" style={{ color: "#b91c1c" }} />
                <h3 style={{ margin: 0, color: "#991b2b" }}>Hapus Produk</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setProductToDelete(null)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: "13px" }}>
                Apakah Anda yakin ingin menghapus produk <strong>{productToDelete.name}</strong>?
              </p>
              <div style={{ padding: "10px 12px", background: "var(--admin-surface-muted)", borderRadius: "8px", fontSize: "12px", color: "var(--admin-muted)" }}>
                Produk tanpa riwayat transaksi akan dihapus permanen. Produk yang memiliki transaksi akan diarsipkan agar rekap pembukuan tetap valid.
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">
                  Ketik <strong>delete</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  className="atelier-form-input"
                  placeholder="Ketik 'delete'"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={deletingProduct}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="atelier-btn-secondary compact"
                disabled={deletingProduct}
                onClick={() => setProductToDelete(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="atelier-btn-danger compact"
                disabled={
                  deletingProduct ||
                  deleteConfirmText.trim().toLowerCase() !== "delete"
                }
                onClick={() => void handleDeleteProduct()}
              >
                <Trash size={14} weight="bold" />
                <span>{deletingProduct ? "Menghapus…" : "Hapus Produk"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
