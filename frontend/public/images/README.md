# 📸 Panduan Folder Asset Foto & Gambar Website — Seli Florist

Folder ini (`frontend/public/images/`) adalah **tempat penyimpanan utama seluruh aset foto dan gambar statis** untuk website Seli Florist.

File yang diletakkan di dalam folder ini otomatis dapat diakses langsung oleh browser melalui URL `/images/...`.

---

## 📁 Struktur Subfolder

```text
frontend/public/images/
├── products/          # Foto produk buket bunga, hampers, dan papan ucapan
│   ├── buket-bunga-mawar.jpg
│   ├── hampers-spesial.jpg
│   └── papan-ucapan-akrilik.jpg
│
├── banners/           # Foto hero banner slider & promosi halaman depan
│   └── hero-bouquet.jpg
│
├── categories/        # Foto thumbnail kartu kategori belanja
│   ├── category-bouquet.jpg
│   ├── category-board.jpg
│   └── category-hampers.jpg
│
├── branding/          # Logo toko, lambang butik, icon, watermark
│   └── logo.jpeg
│
├── PANDUAN_ASSET_FOTO.md # Dokumen panduan ini
│
│  # File kompatibilitas (jangan dihapus agar rute lama tetap jalan):
├── hero-bouquet.jpg
├── category-board.jpg
└── category-hampers.jpg
```

---

## 🚀 Cara Menambahkan & Menggunakan Foto di Website

### 1. Menambahkan Foto Baru
Cukup salin / seret (*drag-and-drop*) file foto Anda ke dalam subfolder yang sesuai:
* Jika foto buket atau kado baru: letakkan di `products/` (misal: `buket-tulip-pink.webp`).
* Jika banner promo baru: letakkan di `banners/` (misal: `promo-hari-ibu.jpg`).
* Jika kategori baru: letakkan di `categories/`.

### 2. Memanggil Foto di Komponen Next.js / React
Gunakan path yang diawali dengan `/images/subfolder/nama-file.ext`:

```tsx
import Image from "next/image";

// Contoh 1: Menampilkan foto produk
<Image
  src="/images/products/buket-bunga-mawar.jpg"
  alt="Buket Bunga Mawar Merah"
  width={600}
  height={600}
  className="rounded-xl object-cover"
/>

// Contoh 2: Menampilkan banner hero
<Image
  src="/images/banners/hero-bouquet.jpg"
  alt="Banner Seli Florist"
  width={1920}
  height={800}
  priority
/>

// Contoh 3: Tag img HTML biasa
<img src="/images/branding/logo.jpeg" alt="Logo Seli Florist" />
```

---

## 💡 Rekomendasi Format & Ukuran Gambar

Agar website Seli Florist tetap memuat dengan **sangat cepat, mulus, dan hemat kuota pelanggan**:

| Jenis Gambar | Format Disarankan | Dimensi Rekomendasi | Batas Ukuran File |
| :--- | :--- | :--- | :--- |
| **Foto Produk** | `.webp` atau `.jpg` | 800 × 800 px (1:1) / 800 × 1000 px | < 300 KB |
| **Banner Hero** | `.webp` atau `.jpg` | 1920 × 800 px | < 600 KB |
| **Thumbnail Kategori** | `.webp` atau `.jpg` | 600 × 600 px | < 250 KB |
| **Logo & Ikon** | `.png` transparan / `.svg` | 512 × 512 px | < 100 KB |

> **Tips:** Gunakan tool gratis seperti [squoosh.app](https://squoosh.app) atau [tinypng.com](https://tinypng.com) untuk mengompres foto sebelum diunggah agar visual tetap tajam namun ukuran file sangat ringan.

---

## ⚠️ Perbedaan: Foto Statis vs Foto Dinamis (Upload)

1. **Foto Statis Website (`frontend/public/images/`):**
   * Foto desain bawaan website, banner promosi, logo butik, dan kartu kategori.
   * Dikelola langsung di repository proyek ini.

2. **Foto Dinamis Sistem (`backend/uploads/` & API):**
   * Bukti transfer DP/pelunasan yang diunggah customer.
   * Foto produk tambahan yang diupload admin melalui panel `/admin/catalog/new`.
   * Disimpan secara otomatis oleh backend NestJS dan disajikan lewat endpoint `/api/files/...`.
