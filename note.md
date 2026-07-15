# CLAUDE.md — Florist, Papan Ucapan Rental & Kado E-Commerce API

> Important Note: This `CLAUDE.md` is written to guide Claude Code in building a Node.js + NestJS REST API project untuk platform e-commerce florist mobile-first (Flutter Web frontend). Always prioritize security, transaction-safety (anti race-condition), ORM best practices, dan kriteria proyek yang wajib (soft-booking, anti-spam, ongkir otomatis, panel admin keuangan).

---

## 1. Project Overview

- **Name** : Florist & Papan Ucapan Rental E-Commerce API
- **Description** : REST API untuk platform jual buket bunga, barang kado, dan sewa papan ucapan harian. Mendukung guest checkout, soft-booking anti double-booking, kalkulasi ongkir otomatis berbasis jarak (Google Distance Matrix), pembayaran manual (DP 50%, tanpa payment gateway), integrasi web-to-WhatsApp, dan panel admin dengan laporan keuangan.
- **Goal** : Backend production-ready yang aman dari race-condition (booking papan ucapan) dan spam order fiktif, dengan laporan laba-rugi yang akurat untuk owner.
- **Target Users**: Admin/Owner, Staff Verifikasi Pembayaran, dan Customer (guest, tanpa wajib register).
- **Version** : v1.0.0
- **Status** : Active development

---

## 2. Tech Stack

- **Runtime** : Node.js
- **Framework** : NestJS (modular, TypeScript)
- **Database** : PostgreSQL
- **ORM** : Prisma (dengan Prisma CLI & Prisma Migrate)
- **Lock/TTL Layer** : Redis (soft-booking lock 15 menit, rate-limiting)
- **Authentication** : JWT (`@nestjs/jwt`) & bcrypt — **khusus untuk Admin/Staff**, customer tetap guest checkout
- **Validation** : `class-validator` + `class-transformer` (DTO-based, native NestJS)
- **File Upload** : Multer (`@nestjs/platform-express`) — validasi ekstensi `.jpg/.jpeg/.png` & max 2MB
- **3rd Party API** : Google Distance Matrix API (ongkir), tidak ada payment gateway (manual transfer)
- **Export Laporan** : ExcelJS (generate `.xlsx` di backend)
- **Charting Data Source** : endpoint agregasi khusus (`/admin/reports/*`), rendering chart dilakukan di Flutter Web (`fl_chart`)
- **Extra Libs** : cors, helmet, morgan, `@nestjs/schedule` (cron expiry lock & order), `bullmq` (queue, opsional)
- **Package Manager** : npm

---

## 3. Commands

```bash
# Development
npm run start:dev        # Jalankan dev server (watch mode)
npm run build             # Build production
npm run start:prod        # Jalankan production build

# Package Management
npm install [package]     # Install package baru

# Database & ORM (Prisma CLI)
npx prisma migrate dev --name [nama_migrasi]   # Buat & jalankan migrasi baru
npx prisma migrate deploy                       # Deploy migrasi ke production
npx prisma generate                              # Generate Prisma Client setelah ubah schema
npx prisma studio                                # GUI lihat isi database
npx prisma db seed                               # Jalankan seeder (dummy produk, admin default)
```

> **Catatan:** Selalu gunakan `npm` dan `npx`. Jangan gunakan `yarn` atau `pnpm`. Setiap perubahan `schema.prisma`, WAJIB jalankan `prisma migrate dev` — jangan edit tabel manual lewat DB client.

---

## 4. Project Structure

Architecture: Modular NestJS (Module - Controller - Service - Repository pattern)

```text
[root]/
  src/
    modules/
      auth/               # Login admin/staff (JWT), guard, role decorator
      catalog/            # CRUD produk, kategori, varian, stok (ready/PO)
      booking/            # Booking calendar papan ucapan, soft-lock service
      checkout/            # Guest checkout, hitung DP, snapshot harga
      ongkir/              # Google Distance Matrix integration & cache
      payment-proof/       # Upload bukti bayar, validasi file, verifikasi admin
      blacklist/           # Kelola blacklist WA/IP
      whatsapp/            # Generator token terenkripsi & deep-link WA
      finance/             # Modal, pengeluaran, HPP produk, laporan laba-rugi
      reports/             # Endpoint agregasi dashboard & export XLSX
      admin/               # Dashboard, manajemen role staff
    common/
      guards/             # AuthGuard, RolesGuard
      interceptors/        # Response formatter, logging
      filters/             # Global exception filter (format error konsisten)
      decorators/           # @Roles(), @CurrentUser()
      pipes/                # Validation pipe custom
    jobs/
      release-expired-lock.job.ts   # Cron: expire soft-lock booking
      release-expired-order.job.ts  # Cron: cancel pending order lewat dp_deadline
    prisma/
      prisma.service.ts
      schema.prisma
    main.ts                # Entry point (bootstrap NestJS, helmet, cors)
    app.module.ts
  prisma/
    migrations/            # File migrasi Prisma (auto-generated)
    seed.ts                 # Seeder produk & admin default
  public/
    uploads/                 # Fallback lokal (jika tidak pakai object storage eksternal)
```

**Aturan Penempatan File:**
- Setiap fitur baru dibuat sebagai **module NestJS terpisah** (`nest g module [nama]`), jangan taruh semua logic di satu module besar.
- Business logic & query database selalu di **Service**, Controller hanya menerima request & memanggil service.
- Schema tabel WAJIB dibuat lewat `schema.prisma` + `prisma migrate`, jangan buat manual di SQL.
- JANGAN ubah `prisma.service.ts` bawaan kecuali menambah logging/middleware Prisma.

---

## 5. Naming Conventions

```text
# File dan Folder
- Controllers   : kebab-case contoh: booking.controller.ts, payment-proof.controller.ts
- Services      : kebab-case contoh: booking.service.ts, ongkir.service.ts
- Modules       : kebab-case contoh: booking.module.ts
- DTO           : PascalCase + Dto suffix contoh: CreateBookingDto, UploadPaymentProofDto
- Models (Prisma schema) : PascalCase contoh: Product, BoardBooking, Order, Expense

# Di dalam Kode
- Variabel      : camelCase contoh: waNumber, isSoftLocked
- Konstanta     : UPPER_SNAKE contoh: JWT_SECRET, SOFT_LOCK_DURATION_MINUTES
- Fungsi        : camelCase contoh: calculateOngkir, checkPendingOrderByWa
- Model (DB)    : PascalCase contoh: Order, BoardBooking, ProductCost
- Tabel (DB)    : snake_case (plural) contoh: orders, board_bookings, product_costs

# Git Branch
- Fitur baru    : feat/[nama-fitur]
- Bug fix       : fix/[nama-bug]
```

---

## 6. Code Conventions

**Pendekatan Coding:**
- Selalu gunakan try-catch (atau global exception filter) di setiap Controller/Service.
- Validasi input via DTO + `class-validator`, jangan validasi manual di Controller.
- Hindari callback hell, selalu gunakan async/await.
- Logic penghitungan (ongkir, laba, HPP) **wajib** di Service backend — jangan pernah dihitung ulang di Flutter client.

**Standar HTTP Status Code:**
- 200 OK: Berhasil mengambil/mengupdate data.
- 201 Created: Berhasil membuat data baru (POST).
- 400 Bad Request: Gagal validasi DTO / Input salah / Stok-kuota tidak cukup.
- 401 Unauthorized: Token admin tidak ada / expired.
- 403 Forbidden: Role tidak sesuai, atau WA/IP masuk blacklist.
- 404 Not Found: Data (Product/Order/Booking) tidak ditemukan.
- 409 Conflict: Tanggal booking sedang di-soft-lock user lain / order pending sudah ada untuk WA tsb.
- 500 Internal Server Error: Kesalahan server/database.

---

## 7. API Response & Error Handling

Selalu kembalikan format JSON yang konsisten di semua endpoint.

**Format Sukses:**
```javascript
res.status(200).json({
  success: true,
  message: "Deskripsi aksi sukses",
  data: { ... } // object atau array
});
```

**Format Error (Validation / Logic / Conflict):**
```javascript
res.status(400).json({
  success: false,
  message: "Validation Error / Pesan spesifik",
  errors: [ ... ] // Opsional, array error field dari class-validator
});
```

---

## 8. Database & ORM Rules (Prisma)

1. **Wajib ORM**: Dilarang menulis raw SQL query kecuali untuk aggregasi laporan berat yang memang butuh `$queryRaw` (dan itu pun harus dikomentari alasannya).
2. **Migration**: Setiap ada perubahan schema, WAJIB jalankan `prisma migrate dev`. Jangan ubah struktur tabel manual via DB client (DBeaver/pgAdmin).
3. **Transaksi Booking (Anti Race-Condition)**: Saat proses soft-lock tanggal papan ucapan, WAJIB gunakan `prisma.$transaction()` dikombinasikan dengan **unique constraint** `(board_id, booking_date)` di level schema — race condition harus tetap gagal aman di level DB, bukan hanya dicegah di kode aplikasi.
4. **Validasi Kuota/Stok**: Sebelum insert order untuk produk `ready_stock`, cek stok cukup. Untuk `pre_order`, cek `po_days` dan set estimasi tanggal siap otomatis.
5. **Constraint Anti-Spam**: Kolom `wa_number` di tabel `orders` WAJIB punya partial unique index `WHERE status = 'pending_payment'` — jangan hanya cek via query `findFirst` di service tanpa constraint DB, karena itu tidak aman terhadap concurrent request.
6. **HPP & Laporan Keuangan**: Setiap `OrderItem` WAJIB menyimpan `price_snapshot` DAN `cost_price_snapshot` (dari `ProductCost` saat order dibuat) — jangan hitung laba dari harga HPP produk saat ini, karena harga modal bisa berubah seiring waktu dan akan merusak akurasi laporan histori.

---

## 9. Security & Validation Rules

- **Password Admin/Staff**: Wajib di-hash menggunakan `bcrypt` sebelum disimpan (tidak berlaku untuk customer, karena guest checkout tidak butuh akun).
- **Auth**: Gunakan JWT khusus untuk `/admin/*` routes. Simpan token di `Authorization: Bearer <token>`.
- **Role Control**: Buat guard `@Roles('admin', 'owner', 'staff_verifikasi')` untuk membatasi akses endpoint tertentu — data keuangan (`/admin/finance/*`, `/admin/reports/*`) hanya boleh diakses role `owner`/`finance`.
- **Validasi Input**: Semua `req.body` WAJIB divalidasi menggunakan DTO + `class-validator` sebelum masuk ke service/database.
- **Validasi Upload Bukti Bayar**: Cek `Content-Type` & magic bytes file (bukan hanya ekstensi nama file), tolak jika ukuran > 2MB, simpan dengan nama file ter-randomize (UUID).
- **Blacklist Check**: WAJIB dijalankan sebagai guard/middleware **sebelum** request menyentuh service checkout — cek `wa_number` dan `ip_address` terhadap tabel `blacklist`.
- **Rate Limiting**: Gunakan `@nestjs/throttler` untuk membatasi request checkout per IP per menit (mencegah bot spam sebelum menyentuh DB).

---

## 10. Features & Task Breakdown (Checklist)

Tandai dengan `[x]` jika sudah selesai. Jangan ubah fitur yang sudah `[x]`.

### Modul 1: Auth Admin & Master Data
- [ ] POST `/api/admin/auth/login` (JWT, hash password, return role)
- [ ] GET, PUT `/api/admin/profile` (update profil staff/admin)
- [ ] CRUD `/api/admin/staff` (kelola akun staff & role, khusus owner)
- [ ] CRUD `/api/categories` (Master kategori: bunga, kado, papan_ucapan)

### Modul 2: Katalog Produk & Stok
- [ ] CRUD `/api/products` (Auth: Admin, upload foto via Multer)
- [ ] PUT `/api/products/:id/stock` (set `ready_stock` / `pre_order` + `po_days`)
- [ ] GET `/api/products` (Public, filter kategori, cari nama)
- [ ] GET `/api/products/:id` (Detail produk + varian + custom text request field)

### Modul 3: Booking Papan Ucapan (Soft-Lock)
- [ ] GET `/api/booking/calendar?month=` (Public, lihat tanggal available/booked)
- [ ] POST `/api/booking/lock` (Soft-lock 15 menit, transaction + unique constraint)
- [ ] GET `/api/booking/lock/:sessionId` (Restore countdown jika reload halaman)
- [ ] Cron job: auto-release lock expired (`@nestjs/schedule`, tiap 1 menit)

### Modul 4: Checkout, Ongkir & Pembayaran Manual
- [ ] POST `/api/checkout/ongkir` (Hitung ongkir via Google Distance Matrix, formula tiered KM)
- [ ] POST `/api/checkout` (Guest checkout, cek blacklist, cek 1 WA = 1 pending order, hitung DP 50%)
- [ ] POST `/api/checkout/:orderId/payment-proof` (Upload bukti bayar, validasi ekstensi & ukuran)
- [ ] Cron job: auto-cancel order pending lewat `dp_deadline` + release booking terkait

### Modul 5: Verifikasi Admin & Anti-Spam
- [ ] GET `/api/admin/orders?status=pending_payment` (Antrian verifikasi)
- [ ] POST `/api/admin/orders/:id/approve` (Approve → generate WA deep-link)
- [ ] POST `/api/admin/orders/:id/reject` (Reject → auto-insert blacklist WA+IP, release booking)
- [ ] CRUD `/api/admin/blacklist` (Lihat/hapus manual entry blacklist)

### Modul 6: Integrasi Web-to-WhatsApp
- [ ] Generate token terenkripsi berisi ringkasan order (`order_id`, produk, tanggal, alamat, harga+ongkir)
- [ ] GET `/o/:token` (Halaman ringkasan order untuk admin, dibuka dari link WA)
- [ ] Endpoint generate `wa.me` deep-link dengan draft pesan singkat + link `/o/:token`

### Modul 7: Keuangan & Panel Admin (Nilai Tambahan)
- [ ] CRUD `/api/admin/finance/capital` (Input modal masuk)
- [ ] CRUD `/api/admin/finance/expenses` (Input pengeluaran + kategori + upload nota)
- [ ] CRUD `/api/admin/finance/product-costs` (Kelola HPP per produk, histori by `effective_date`)
- [ ] GET `/api/admin/reports/summary?from=&to=` (Omzet, HPP, laba kotor, pengeluaran, laba bersih)
- [ ] GET `/api/admin/reports/chart-data?type=&from=&to=` (Data siap-render untuk `fl_chart`)
- [ ] GET `/api/admin/reports/export?type=profit_loss&from=&to=` (Generate & download `.xlsx` via ExcelJS)

---

## 11. Do Not (SANGAT PENTING)

- **JANGAN** membuat tabel database secara manual tanpa `prisma migrate`.
- **JANGAN** menulis connection string database langsung di dalam service/controller. Gunakan `.env` + `ConfigModule`.
- **JANGAN** mengembalikan password admin/staff di response JSON mana pun.
- **JANGAN** pernah bypass validasi DTO/class-validator untuk input dari customer maupun admin.
- **JANGAN** menghitung ongkir, laba, atau HPP di sisi Flutter client — semua kalkulasi finansial wajib di backend agar jadi single source of truth.
- **JANGAN** menghapus unique constraint `(board_id, booking_date)` atau partial unique index `one_pending_order_per_wa` — ini fondasi anti race-condition & anti-spam, bukan hanya validasi aplikasi biasa.
- **JANGAN** izinkan endpoint `/admin/finance/*` dan `/admin/reports/*` diakses role selain `owner`/`finance`.
- Jika ada prompt yang ambigu tentang arsitektur (misal: struktur booking multi-unit papan, kebijakan refund DP), **TANYA DULU**. Jangan berasumsi.

---

## 12. Environment Variables (.env)

Selalu minta nilai ini ke file `.env` dan gunakan `process.env.NAMA_VAR` (via `@nestjs/config`).

```
# Server & Environment
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Access (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/florist_db

# Redis (Soft-lock booking & rate-limit)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT (Admin/Staff only)
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d

# Google Distance Matrix API (Ongkir)
GOOGLE_MAPS_API_KEY=your_google_maps_key
TOKO_ORIGIN_LAT=-7.257472
TOKO_ORIGIN_LNG=112.752088

# Ongkir Formula
ONGKIR_BASE_KM=4
ONGKIR_BASE_FEE=10000
ONGKIR_PER_KM_FEE=2500

# WhatsApp Integration
WA_ADMIN_NUMBER=6281234567890
WA_ENCRYPTION_SECRET=your_aes_secret_key

# Object Storage (Bukti Bayar & Foto Produk)
STORAGE_PROVIDER=cloudflare_r2
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=florist-uploads
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com

# Upload Validation
MAX_UPLOAD_SIZE_MB=2
ALLOWED_UPLOAD_EXT=.jpg,.jpeg,.png

# Booking Lock
SOFT_LOCK_DURATION_MINUTES=15
```

---

## Referensi Silang

Dokumen ini adalah panduan teknis untuk Claude Code saat menulis kode. Untuk konteks arsitektur lengkap (diagram sistem, skema database detail, opsi tech stack alternatif, dan flowchart logika anti-spam/booking secara naratif), lihat `arsitektur-ecommerce-florist.md` di project yang sama — kedua dokumen ini saling melengkapi dan sebaiknya tetap disinkronkan setiap ada perubahan skema besar.



# Arsitektur Sistem — E-Commerce Florist, Sewa Papan Ucapan & Kado

## 1. Gambaran Arsitektur (High-Level)

```
┌─────────────────────────────────────────────────────────┐
│   FLUTTER WEB (Mobile-First)                             │
│   - Bloc/Cubit per feature (Catalog, Booking, Checkout)   │
│   - Repository Pattern → abstraksi API                   │
└───────────────────┬───────────────────────────────────────┘
                    │ REST/JSON (HTTPS)
┌───────────────────▼───────────────────────────────────────┐
│   API GATEWAY / BACKEND (NestJS atau Supabase Edge)       │
│   - Auth (opsional, guest-first)                          │
│   - Order Service                                         │
│   - Booking Lock Service (Redis TTL)                       │
│   - Ongkir Service → Google Distance Matrix API           │
│   - Anti-Spam/Blacklist Middleware                         │
│   - WA Deep-link Generator (token terenkripsi)             │
└─────┬───────────────┬───────────────┬──────────────────────┘
      │               │               │
┌─────▼─────┐   ┌─────▼─────┐   ┌────▼──────────┐
│ PostgreSQL │   │   Redis   │   │ Object Storage │
│ (data utama)│   │(lock TTL, │   │ (bukti bayar,  │
│            │   │ rate-limit)│   │  foto produk)  │
└────────────┘   └───────────┘   └────────────────┘
                                        │
                                 ┌──────▼───────┐
                                 │ Cron Worker   │
                                 │ (release lock,│
                                 │ expire pending)│
                                 └───────────────┘
```

**Kenapa struktur ini?** Poin krusial di brief Anda (soft-booking anti race-condition, anti-spam 1 WA = 1 pending order) itu murni masalah *state management di server*, bukan di client. Flutter Web bagus untuk UX, tapi logic penguncian tanggal **wajib** ada di backend + storage yang mendukung TTL (Redis) atau row-locking (Postgres), karena kalau hanya mengandalkan state Flutter/Bloc di client, dua user beda tab tetap bisa lolos checkout di tanggal yang sama.

---

## 2. Rekomendasi Arsitektur Database

Menggunakan **PostgreSQL** (relasional, cocok untuk data transaksional & butuh constraint ketat seperti "1 WA = 1 pending order").

### Tabel Inti

**`products`**
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| category | enum | `bunga`, `kado`, `papan_ucapan` |
| name, description | text | |
| base_price | numeric | |
| stock_type | enum | `ready_stock`, `pre_order` |
| po_days | int | nullable, jumlah hari jika PO |
| is_active | bool | |

**`product_variants`** (opsional, misal ukuran buket)
| id | variant_name | price_delta | product_id (FK) |

**`board_inventory`** (papan ucapan fisik yang disewakan — jika ada banyak unit papan)
| id | board_name/type | is_active |

**`board_bookings`** ⭐ (jantung sistem anti-double-booking)
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| board_id | FK | unit papan mana |
| booking_date | date | tanggal sewa |
| status | enum | `available`(implicit/no row), `soft_locked`, `confirmed`, `cancelled` |
| locked_by_session | text | session id / phone number sementara |
| locked_at | timestamp | |
| expires_at | timestamp | locked_at + 15 menit |
| order_id | FK | nullable, terisi saat confirmed |
| **UNIQUE constraint (board_id, booking_date) WHERE status IN ('soft_locked','confirmed')** | | ini yang mencegah race condition di level DB |

**`orders`**
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| wa_number | text | indexed |
| customer_name | text | |
| status | enum | `pending_payment`, `dp_verified`, `processing`, `completed`, `cancelled`, `rejected` |
| subtotal, ongkir_fee, dp_amount, total | numeric | |
| custom_text_request | text | (isi tulisan papan, request warna dll) |
| created_at, dp_deadline (created_at+15m) | timestamp | |

**`order_items`**
| id | order_id (FK) | product_id (FK) | qty | price_snapshot |

**`delivery_addresses`**
| id | order_id (FK) | full_address | lat | lng | distance_km | ongkir_calculated |

**`payment_proofs`**
| id | order_id (FK) | file_url | uploaded_at | file_size | mime_type | verification_status (`pending`,`approved`,`rejected`) | rejected_reason |

**`blacklist`**
| id | type (`wa_number`/`ip`) | value | reason | blacklisted_at | blacklisted_by_admin_id |

**`admin_users`** — untuk dashboard admin (verifikasi bukti bayar, kelola blacklist, kelola stok)

**`audit_logs`** — jejak semua perubahan status booking/order (penting untuk investigasi jika ada dispute)

### Tabel Keuangan (Modal, Pemasukan, Pengeluaran, Laba)

**`product_costs`** ⭐ (HPP — Harga Pokok Produksi, wajib ada agar laba bisa dihitung akurat, bukan sekadar omzet)
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| product_id | FK | |
| cost_price | numeric | modal bahan baku per unit (bunga, boneka, dll) |
| effective_date | date | HPP bisa berubah seiring waktu (harga bunga naik-turun), simpan histori bukan overwrite |

**`capital_injections`** (modal masuk — dari owner/investor)
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| amount | numeric | |
| source | text | misal "Modal Awal Owner", "Suntikan Dana" |
| injected_at | timestamp | |
| note | text | |
| created_by_admin_id | FK | |

**`expenses`** (pengeluaran operasional — di luar HPP produk)
| kolom | tipe | ket |
|---|---|---|
| id | uuid | PK |
| category | enum | `bahan_baku`, `operasional` (listrik/internet), `gaji`, `transport/bensin`, `marketing`, `lainnya` |
| amount | numeric | |
| description | text | |
| expense_date | date | |
| attachment_url | text | nullable, bukti struk/nota jika admin upload |
| created_by_admin_id | FK | |

**`revenue_ledger`** (opsional — view/materialized, atau tabel ringkasan harian hasil agregasi dari `orders`)
| kolom | tipe | ket |
|---|---|---|
| date | date | PK per hari |
| gross_revenue | numeric | total dari order `completed` |
| total_hpp | numeric | agregasi cost_price × qty dari `order_items` |
| total_ongkir_collected | numeric | |
| gross_profit | numeric | `gross_revenue - total_hpp` |

> **Catatan penting:** Laba **bersih** = Gross Profit − `expenses` (periode sama) − alokasi lain. Jangan hitung laba hanya dari `orders.total`, karena itu omzet kotor. HPP per produk (`product_costs`) adalah kunci supaya laporan tidak menyesatkan (misal buket harga jual 150rb tapi modal bunga 90rb → laba kotor sebenarnya cuma 60rb, bukan 150rb).

### Constraint Kunci untuk Anti-Spam
```sql
-- Hanya boleh 1 order pending per nomor WA (partial unique index)
CREATE UNIQUE INDEX one_pending_order_per_wa
ON orders (wa_number)
WHERE status = 'pending_payment';
```
Ini memastikan validasi tidak bisa "bocor" walau ada bug di level aplikasi — DB sendiri yang menolak insert kedua.

---

## 3. Rekomendasi Backend, Storage & Integrasi (dikawinkan dengan Flutter Web)

### Opsi A — Full Control (direkomendasikan untuk logic booking yang kompleks)
| Layer | Rekomendasi | Alasan |
|---|---|---|
| Backend framework | **NestJS (Node.js + TypeScript)** | Struktur modular (mirip Bloc di Flutter — konsisten pola), native support WebSocket untuk update kalender real-time, ekosistem matang untuk queue/cron (BullMQ) |
| Database | **PostgreSQL** (managed: Supabase/Neon/RDS) | Butuh constraint & transaction ketat untuk booking |
| Lock/TTL layer | **Redis** | `SETEX board:16-07-2026 900 "locked_by_session_x"` — TTL native 15 menit, auto-expire tanpa perlu cron rumit |
| Cron/Worker | **BullMQ (Node)** atau `pg_cron` | Backup safety-net untuk expire pending order/booking jika Redis event terlewat |
| Object Storage | **Cloudflare R2** atau **Supabase Storage** | S3-compatible, murah, tidak ada egress fee (R2), cocok untuk simpan bukti bayar & foto produk |
| Deploy | Railway / Fly.io / VPS (jika budget terbatas) | |

### Opsi B — Rapid Development (jika ingin lebih cepat MVP)
| Layer | Rekomendasi |
|---|---|
| Backend | **Supabase** (Postgres + Auto REST/GraphQL + Edge Functions untuk logic custom seperti hitung ongkir & generate WA link) |
| Realtime kalender | **Supabase Realtime** (built-in, Flutter punya package `supabase_flutter` resmi) |
| Storage bukti bayar | **Supabase Storage** (built-in, bisa set policy ukuran file & mime type langsung di level bucket) |
| Lock TTL | Gunakan kolom `expires_at` + Postgres Edge Function/cron (`pg_cron`) untuk auto-release, karena Supabase tidak native expose Redis |

> **Rekomendasi saya:** mulai dengan **Opsi B (Supabase)** untuk kecepatan MVP — terutama karena guest checkout, upload bukti bayar, dan realtime kalender semua sudah tersedia sebagai fitur bawaan. Migrasi ke Opsi A (NestJS+Redis) bisa dilakukan nanti kalau traffic booking sudah tinggi dan butuh presisi TTL yang lebih ketat dari sekadar polling `expires_at`.

### Tambahan untuk Panel Admin — Charting & Export
| Kebutuhan | Rekomendasi | Alasan |
|---|---|---|
| Chart di Flutter Web (admin dashboard) | **fl_chart** atau **syncfusion_flutter_charts** | `fl_chart` ringan & open-source untuk bar/line/pie sederhana; `syncfusion_flutter_charts` lebih kaya (drill-down, export gambar) jika butuh chart lebih kompleks — Syncfusion free untuk individu/UMKM kecil (community license) |
| Export ke XLSX | Generate di **backend** (bukan di Flutter client) pakai **ExcelJS** (Node/NestJS) atau **openpyxl** (jika backend Python) | Data finansial sebaiknya diformat & divalidasi di server sebelum jadi file, juga menghindari expose seluruh raw data ke client hanya untuk generate file |
| Alternatif ringan (Supabase/no dedicated backend) | Edge Function Supabase (Deno) + library **xlsx (SheetJS)** untuk generate file, upload sementara ke Storage, kirim signed URL download ke admin | Cocok jika pakai Opsi B (Supabase) |

### Integrasi Pendukung
- **Google Distance Matrix API** — dipanggil dari **backend**, bukan langsung dari Flutter Web, supaya API key tidak ter-expose di client. Hasil jarak di-cache per kombinasi origin-destination (rounding ke 100m) untuk hemat kuota API.
- **Rumus ongkir** dihitung di server saat checkout, lalu disimpan sebagai snapshot di `delivery_addresses.ongkir_calculated` (jangan hitung ulang di client, agar harga tidak berubah antara "lihat estimasi" dan "checkout final").
- **WA Deep-link** — backend generate token terenkripsi (misal JWT pendek atau AES) berisi `order_id`, lalu buat URL: `https://domain.com/o/{token}` yang saat diklik oleh admin membuka halaman ringkasan order (auth admin), *atau* langsung encode ringkasan singkat ke `https://wa.me/62812xxxx?text={encoded_summary}` untuk draft pesan otomatis. Kombinasi keduanya ideal: teks WA singkat + link ke halaman detail lengkap (menghindari batas panjang URL WA).
- **Rate limiting per IP** — middleware sederhana (Nest Guard / Supabase Edge Function) untuk membatasi jumlah request checkout per IP per menit, mencegah bot spam sebelum menyentuh DB.

### Frontend (Flutter Web + Bloc) — struktur folder singkat
```
lib/
 ├── features/
 │    ├── catalog/           (CatalogBloc)
 │    ├── booking/           (BookingCalendarBloc — pegang state soft-lock + countdown timer)
 │    ├── checkout/          (CheckoutBloc — alamat, ongkir, DP)
 │    ├── payment_proof/     (PaymentUploadBloc)
 │    ├── whatsapp_redirect/
 │    └── admin/
 │         ├── dashboard/       (AdminDashboardBloc — ringkasan omzet/laba/grafik)
 │         ├── order_verification/ (AdminOrderBloc — approve/reject bukti bayar)
 │         ├── finance/         (FinanceBloc — CRUD expenses, capital, laporan laba-rugi)
 │         ├── export/          (ExportBloc — trigger request export xlsx ke backend)
 │         ├── blacklist/       (BlacklistBloc)
 │         └── product_stock/   (StockBloc — kelola ready_stock/PO)
 ├── repositories/            (abstraksi API, easy untuk mock saat testing)
 └── core/
      ├── network/ (Dio + interceptor)
      └── theme/
```
Panel admin sebaiknya jadi **route/module terpisah** (`/admin/*`) dengan auth guard (admin_users login wajib pakai password, beda dengan guest checkout customer), dan idealnya di-build sebagai bagian dari aplikasi Flutter Web yang sama namun lazy-loaded, atau bahkan project Flutter terpisah jika ingin isolasi total dari bundle customer-facing (mengurangi ukuran bundle web publik).

`BookingCalendarBloc` sebaiknya juga subscribe ke realtime channel (Supabase Realtime/WebSocket) agar begitu user lain berhasil lock tanggal, kalender user lain otomatis update jadi "tidak tersedia" tanpa perlu refresh.

---

## 4. Panel Admin — Laporan Keuangan, Grafik & Export

### A. Modul yang Perlu Ada
1. **Dashboard Ringkasan** — kartu angka: Omzet (gross revenue), Total HPP, Laba Kotor, Total Pengeluaran, **Laba Bersih**, Modal masuk, filter by rentang tanggal (harian/mingguan/bulanan/custom range)
2. **Manajemen Order** — antrian verifikasi bukti bayar (approve/reject), status tracking
3. **Manajemen Keuangan**
   - Input **Modal** (`capital_injections`) — catat suntikan dana owner
   - Input **Pengeluaran** (`expenses`) — kategori bebas (bahan baku non-produk, gaji, transport, marketing dll), bisa upload nota
   - Kelola **HPP produk** (`product_costs`) — supaya perhitungan laba akurat per item terjual
4. **Grafik/Visualisasi**
   - Line chart: tren omzet vs pengeluaran per hari/bulan
   - Bar chart: perbandingan laba per kategori produk (bunga vs kado vs sewa papan)
   - Pie/donut chart: komposisi pengeluaran per kategori
   - Progress/gauge: modal terpakai vs modal masuk
5. **Export Laporan**
   - Tombol "Export ke XLSX" di setiap laporan (transaksi, laba-rugi, pengeluaran) dengan filter tanggal
   - Format sheet disarankan: `Ringkasan`, `Detail Transaksi`, `Detail Pengeluaran`, `Detail Modal` (multi-sheet dalam satu file agar tetap rapi untuk pembukuan manual/akuntan)

### B. Logika Perhitungan Laba (Formula)
```
Gross Revenue (Omzet)   = SUM(orders.total) WHERE status = 'completed' AND date IN range
Total HPP               = SUM(order_items.qty × product_costs.cost_price) untuk order yang sama
Gross Profit             = Gross Revenue − Total HPP
Total Expenses           = SUM(expenses.amount) WHERE expense_date IN range
Net Profit (Laba Bersih) = Gross Profit − Total Expenses
Modal Tersisa            = SUM(capital_injections.amount) − SUM(expenses.amount kategori bahan_baku/awal) [opsional, tergantung kebutuhan tracking modal riil vs P&L]
```
> Catatan: Ongkir yang dibayar customer sebaiknya dipisah dari omzet produk jika biaya BBM/operasional kurir juga dicatat di `expenses` kategori `transport`, supaya tidak dobel hitung atau malah tersembunyi selisihnya (ongkir masuk vs biaya bensin riil bisa surplus/minus, ini insight yang berguna buat owner).

### C. Alur Teknis Grafik & Export
- Backend menyediakan endpoint agregasi khusus laporan, contoh:
  - `GET /admin/reports/summary?from=2026-07-01&to=2026-07-31` → return angka-angka siap pakai (jangan kirim raw rows lalu dihitung di Flutter, supaya konsisten dan ringan di client)
  - `GET /admin/reports/export?type=profit_loss&from=...&to=...` → backend generate file xlsx on-the-fly, return sebagai file download / signed URL
- Perhitungan agregasi berat (SUM, JOIN besar) sebaiknya dilakukan via **materialized view** atau **scheduled aggregation job** (misal setiap malam, hitung ulang `revenue_ledger` harian) — jangan hitung real-time dari jutaan baris `orders` tiap kali admin buka dashboard, supaya dashboard tetap responsif seiring data bertambah
- `AdminDashboardBloc` (Flutter) cukup fetch angka & series data yang sudah diagregasi, lalu render lewat `fl_chart`/`syncfusion_flutter_charts` — tidak perlu logic kalkulasi laba di client sama sekali (single source of truth di backend, hindari selisih angka antara dashboard dan file export)

### D. Keamanan Panel Admin
- Wajib **login admin terpisah** (bukan guest) — gunakan Supabase Auth / JWT NestJS dengan role `admin`/`super_admin`
- **Role-based access**: misal staf gudang hanya bisa lihat stok, sedangkan data keuangan (modal, laba) hanya bisa diakses role `owner`/`finance` — penting kalau nanti ada beberapa staf admin
- Audit log khusus untuk aksi input pengeluaran/modal (siapa input, kapan, nilai berapa) — mencegah manipulasi angka laporan oleh staf

---

## 5. Flowchart Logika — Anti-Spam & Anti-Double-Booking

### A. Soft-Booking Papan Ucapan (Race Condition Prevention)
- User pilih tanggal di kalender → frontend kirim request `POST /booking/lock {board_id, date, session_id}`
- Backend, di dalam **satu transaction**:
  - Cek row `board_bookings` untuk `(board_id, date)` dengan status `soft_locked` atau `confirmed`
    - Jika **ada dan belum expired** → tolak, respon `409 Conflict: tanggal sedang diproses user lain`
    - Jika **ada tapi sudah expired** (expires_at < now) → update jadi lock baru untuk user ini
    - Jika **tidak ada** → insert row baru, status `soft_locked`, `expires_at = now + 15 menit`
  - Constraint unique index di DB jadi *safety net* terakhir kalau dua request masuk bersamaan (race condition murni) — salah satu pasti gagal insert
- Frontend tampilkan **countdown timer 15 menit** (dari `expires_at` yang dikembalikan backend, bukan dihitung ulang di client agar sinkron)
- Selama countdown:
  - Jika user submit bukti bayar sebelum expired → status booking jadi `confirmed`, linked ke `order_id`
  - Jika waktu habis tanpa upload bukti bayar → job cron (tiap 1 menit) scan `expires_at < now AND status='soft_locked'` → set balik ke *available* (hapus/soft-delete row lock)
- Jika user reload halaman/pindah tab lalu balik lagi → frontend re-check status lock by `session_id` untuk restore countdown (bukan mulai baru), supaya user tidak bisa "reset" lock terus-menerus untuk hold tanggal selamanya.

### B. Anti-Spam Order Fiktif (1 WA = 1 Pending Order)
- Saat user klik "Checkout" → backend jalankan urutan validasi **sebelum** insert order:
  1. Cek `blacklist` table: apakah `wa_number` atau `ip_address` request ini terdaftar? → jika ya, **tolak langsung**, tidak beri pesan detail (hindari beri tahu penipu alasan spesifik)
  2. Cek `orders` table: apakah ada row dengan `wa_number` sama dan `status = 'pending_payment'`? → jika ya, tolak dengan pesan: *"Anda memiliki pesanan yang belum diselesaikan, silakan selesaikan atau tunggu hingga kedaluwarsa."*
  3. Jika lolos kedua cek → insert order baru, status `pending_payment`, set `dp_deadline`
- Cron job juga expire order pending yang sudah lewat `dp_deadline` tanpa upload bukti bayar → status jadi `cancelled`, dan **release booking terkait** (kembali ke available) supaya slot tidak "tersandera" order fiktif.

### C. Validasi Upload Bukti Bayar
- **Client-side (Flutter)**: filter file picker hanya `.jpg/.jpeg/.png`, cek ukuran sebelum upload (quick feedback, UX saja — bukan security boundary)
- **Server-side (wajib, jangan percaya client)**:
  - Cek `Content-Type` header & **magic bytes** file (bukan hanya ekstensi nama file — orang bisa rename `.exe` jadi `.jpg`)
  - Tolak jika ukuran > 2MB (reject sebelum file selesai ter-upload penuh kalau bisa, pakai stream size check)
  - Simpan ke storage dengan nama file ter-randomize (UUID), bukan nama asli, untuk hindari path traversal/collision
  - Set status `payment_proofs.verification_status = pending`, order tetap `pending_payment` sampai admin verifikasi manual

### D. Blacklist Flow (Admin Action)
- Admin buka dashboard → lihat antrian bukti bayar pending
- Admin verifikasi:
  - **Approve** → order jadi `dp_verified` → generate WA deep-link → booking (jika ada) jadi `confirmed` permanen
  - **Reject** (bukti palsu/foto random) → admin isi alasan → sistem otomatis:
    - Insert ke `blacklist` (wa_number **dan** IP address yang terekam saat submit)
    - Order jadi `rejected`
    - Booking terkait (jika papan ucapan) di-release kembali ke *available*
- Request checkout/upload berikutnya dari WA/IP yang sama otomatis tertolak di layer validasi (poin B.1) tanpa perlu intervensi admin lagi.

---

## Catatan Implementasi Prioritas (Urutan Build yang Disarankan)
1. Skema database + constraint unique (fondasi anti-spam & anti-double-booking ada di level DB, bukan hanya kode aplikasi)
2. Booking lock service + cron expiry (fitur paling rawan bug jika di-skip testing race condition-nya)
3. Katalog + checkout guest + kalkulasi ongkir (Distance Matrix)
4. Upload bukti bayar + validasi + WA deep-link
5. Dashboard admin dasar (login, verifikasi bukti bayar, kelola blacklist, kelola stok)
6. Modul keuangan admin (input modal & pengeluaran, HPP produk, agregasi laporan)
7. Grafik dashboard + export XLSX (paling terakhir — bergantung data transaksi & keuangan poin 1-6 sudah berjalan & terisi)
