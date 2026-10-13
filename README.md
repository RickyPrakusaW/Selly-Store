# 🌸 Seli Florist — E-Commerce & Rental Platform

Platform e-commerce modern untuk penjualan buket bunga, kado, dan penyewaan unit papan ucapan. Dibangun dengan arsitektur monorepo yang bersih, aman, dan modular.

---

## 🏛️ Arsitektur & Teknologi

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, React 19, Tailwind CSS, TanStack Query, Zustand) — Port `3001`
* **Backend:** [NestJS](https://nestjs.org/) REST API (TypeScript, Prisma ORM, PostgreSQL, Redis, Swagger) — Port `3000`
* **AI & Integration:** Model Context Protocol ([MCP Specification](docs/MCP_SPEC.md))

---

## 📁 Struktur Direktori

```text
Selly-Store/
├── backend/            # NestJS REST API, Prisma schema, migrations, & seeder
├── frontend/           # Next.js 16 Web Application (Storefront & Admin Panel)
│   └── public/
│       └── images/     # 📸 ASET FOTO & GAMBAR WEBSITE (Lihat PANDUAN_ASSET_FOTO.md)
│           ├── products/   # Foto produk buket bunga, hampers, & papan ucapan
│           ├── banners/    # Foto banner hero slider & promo halaman depan
│           ├── categories/ # Foto thumbnail kategori belanja
│           └── branding/   # Logo butik & ikon toko
├── docs/               # Seluruh dokumentasi teknis, produk, endpoint, & skenario
│   ├── DOKU_QRIS_INTEGRASI.md           # Panduan integrasi payment gateway DOKU QRIS
│   ├── PRODUCT.md                       # Visi produk, profil pengguna, & prinsip desain
│   ├── design.md                        # Panduan visual UI/UX & palet warna
│   ├── ENDPOINTS.md                     # Cheatsheet ringkas seluruh API endpoints
│   ├── DOKUMENTASI_CUSTOMER_POSTMAN.md  # Detail payload & response tiap endpoint
│   ├── SCENARIOS.md                     # Alur pengujian bisnis end-to-end
│   ├── MCP_SPEC.md                      # Spesifikasi resmi Model Context Protocol
│   ├── note.md                          # Dokumen perancangan awal & aturan bisnis
│   ├── revisi.md                        # Catatan evaluasi arsitektur
│   ├── Seli_Florist_Customer_Collection.json # Postman collection customer
│   └── Seli_Florist_Postman_Collection.json  # Postman collection lengkap
└── README.md           # Panduan utama project
```

---

## 🚀 Panduan Menjalankan Project

### 1. Prasyarat
* Node.js versi 20 atau 24 LTS
* Database PostgreSQL (lokal atau cloud seperti [Neon.tech](https://neon.tech))

### 2. Backend (NestJS)
```bash
cd backend
npm install

# Setup environment (pastikan DATABASE_URL sudah terisi)
cp .env.example .env

# Jalankan migrasi & seeder
npx prisma migrate dev
npm run prisma:seed

# Mulai server backend
npm run start:dev
```
* **API Base:** `http://localhost:3000/api`
* **Swagger Docs:** `http://localhost:3000/api/docs`

### 3. Frontend (Next.js)
```bash
cd frontend
npm install

# Setup environment
cp .env.example .env.local

# Mulai server frontend
npm run dev
```
* **Web Storefront:** `http://localhost:3001`
* **Portal Admin:** `http://localhost:3001/admin/login`

---

## 🤖 Model Context Protocol (MCP)

Untuk integrasi dengan AI Agent (Claude Desktop, Cursor, Antigravity, dll.), silakan merujuk ke:
👉 [**`docs/MCP_SPEC.md`**](docs/MCP_SPEC.md)
