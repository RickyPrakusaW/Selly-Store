# CLAUDE.md — Florist, Papan Ucapan Rental & Kado E-Commerce API

> Important Note: This `CLAUDE.md` is written to guide Claude Code in building a Node.js + NestJS REST API project untuk platform e-commerce florist mobile-first (Flutter Web frontend). Always prioritize security, transaction-safety (anti race-condition), ORM best practices, dan semua kriteria wajib yang sudah didefinisikan.

---

## 1. Project Overview

- **Name** : Florist & Papan Ucapan Rental E-Commerce API
- **Description** : REST API untuk platform jual buket bunga, barang kado, dan sewa papan ucapan harian. Pengunjung bisa melihat katalog secara publik, namun wajib register/login dan verifikasi email saat checkout atau booking. Mendukung keranjang offline-resilient, pembayaran dua tahap (DP 50% + Pelunasan), soft-booking anti double-booking, kalkulasi ongkir otomatis, pengiriman atau pickup, real-time notifikasi admin, dan panel keuangan.
- **Goal** : Backend production-ready yang aman, scalable, dan memberikan pengalaman belanja yang nyaman termasuk saat koneksi tidak stabil.
- **Target Users** : Admin/Owner, Staff Verifikasi Pembayaran, Customer (wajib register + verifikasi email untuk transaksi).
- **Version** : v1.0.0
- **Status** : Active development

---

### Keputusan Arsitektur Kunci (Wajib Dipahami Sebelum Coding)

> Keputusan ini telah difinalisasi. Jangan mengubah logika ini tanpa konfirmasi dari owner proyek.

| # | Keputusan | Pilihan yang Diambil | Alasan |
|---|---|---|---|
| 1 | Mix kategori dalam 1 order? | **Boleh.** 1 order bisa berisi bunga + kado + papan ucapan. | Lebih praktis untuk customer. |
| 2 | Kapan soft-lock dipicu? | **Saat `POST /api/checkout` dikonfirmasi**, bukan saat tambah keranjang. | Mencegah lock dini hanya karena browsing. |
| 3 | Pelunasan sisa 50%? | **Ada.** Setelah DP diverifikasi admin, customer upload bukti pelunasan dalam batas waktu. | Kepastian pembayaran penuh sebelum produksi. |
| 4 | Batas waktu bayar DP? | **2 jam** via `DP_DEADLINE_HOURS=2`. | 15 menit terlalu singkat untuk transfer antarbank. |
| 5 | Refresh Token? | **Ada.** Access token 1 jam, refresh token 30 hari via `httpOnly cookie`. | Mencegah user ter-logout saat mengisi form checkout. |
| 6 | Notifikasi admin? | **WebSocket** (Socket.IO). | Admin tidak perlu polling manual ke dashboard. |
| 7 | Pemilihan board papan ucapan? | **Otomatis oleh sistem** (first available board). Admin bisa reassign manual jika perlu. | Menghindari error saat checkout jika admin tidak online. |
| 8 | Delivery type? | **Antar (`delivery`) atau Ambil Sendiri (`pickup`).** Jika pickup, ongkir = 0 dan Distance Matrix tidak dipanggil. | Fleksibilitas untuk customer yang mau hemat ongkir. |
| 9 | Kebijakan refund DP (jika customer cancel)? | **DP dikembalikan dengan potongan bertingkat** berdasarkan seberapa lama setelah order dibuat: ① Cancel < 12 jam → **full refund** (100% DP kembali). ② Cancel antara 12–24 jam → **refund 75%** (potongan 25%). ③ Cancel > 24 jam → **refund 50%** (potongan 50%). Refund dilakukan **manual oleh admin** (transfer balik) karena tidak ada payment gateway. Sistem hanya mencatat nominal refund & status-nya. Jika admin/sistem yang cancel (force majeure), customer mendapat **full refund**. | Adil untuk customer sekaligus melindungi bisnis dari kerugian bahan baku yang sudah disiapkan. |
| 10 | User kirim foto bukti bayar salah? | **Bisa cancel & kirim ulang**, selama bukti belum diverifikasi admin (`verification_status = pending`). | UX yang baik; user tidak perlu menghubungi admin hanya karena salah foto. |

---

## 2. Tech Stack

- **Runtime** : Node.js
- **Framework** : NestJS (modular, TypeScript)
- **Database** : PostgreSQL
- **ORM** : Prisma (Prisma CLI & Prisma Migrate)
- **Lock/TTL Layer** : Redis (booking lock, rate-limiting, refresh token revocation)
- **Authentication** : JWT Access Token (1 jam) + Refresh Token (30 hari, httpOnly cookie) — `@nestjs/jwt` & bcrypt
- **Email Service** : `@nestjs-modules/mailer` + Nodemailer (verifikasi email, notifikasi order, warning pelunasan)
- **WebSocket** : `@nestjs/websockets` + Socket.IO (notifikasi real-time ke panel admin)
- **Validation** : `class-validator` + `class-transformer` (DTO-based)
- **File Upload** : Multer (`@nestjs/platform-express`) — validasi mimetype & magic bytes (max 2MB)
- **3rd Party API** : Google Distance Matrix API (hanya dipanggil jika `delivery_type = delivery`)
- **Export Laporan** : ExcelJS (generate `.xlsx` di backend)
- **Extra Libs** : cors, helmet, morgan, `@nestjs/schedule` (cron), `bullmq` (job queue)
- **Package Manager** : npm

---

## 3. Commands

```bash
# Development
npm run start:dev        # Dev server (watch mode)
npm run build            # Build production
npm run start:prod       # Jalankan production build

# Database & ORM
npx prisma migrate dev --name [nama_migrasi]
npx prisma migrate deploy
npx prisma generate
npx prisma studio
npx prisma db seed
```

> Selalu gunakan `npm`/`npx`. Setiap ubah `schema.prisma`, WAJIB jalankan `prisma migrate dev`.

---

## 4. Project Structure

```text
[root]/
  src/
    modules/
      auth/               # Register, login, verif email, refresh token, logout
      catalog/            # CRUD produk, kategori, varian, foto, stok
      cart/               # Persistent cart + offline sync
      booking/            # Kalender & ketersediaan papan ucapan (read), auto-assign board
      checkout/           # Checkout, kalkulasi DP & ongkir, snapshot harga
      orders/             # Riwayat order customer, detail, cancel order, mark complete
      payment-proof/      # Upload/retract bukti DP & pelunasan, verifikasi admin
      notifications/      # WebSocket gateway notifikasi real-time admin
      blacklist/          # Kelola blacklist Email/WA
      whatsapp/           # Token terenkripsi & deep-link WA
      finance/            # Modal, pengeluaran, HPP produk
      reports/            # Agregasi dashboard & export XLSX
      admin/              # Dashboard, manajemen staff
    common/
      guards/             # AuthGuard, RolesGuard, VerifiedGuard
      interceptors/       # Response formatter, logging
      filters/            # Global exception filter
      decorators/         # @Roles(), @CurrentUser(), @VerifiedOnly()
      pipes/              # Custom validation pipes
    jobs/
      release-expired-lock.job.ts       # Cron: expire soft-lock booking
      release-expired-dp.job.ts         # Cron: cancel order lewat dp_deadline
      release-expired-pelunasan.job.ts  # Cron: warning + cancel lewat pelunasan_deadline
    prisma/
      prisma.service.ts
      schema.prisma
    main.ts               # Bootstrap (helmet, cors, WebSocket)
    app.module.ts
  prisma/
    migrations/
    seed.ts
```

**Aturan:**
- Setiap fitur = module terpisah.
- Business logic di **Service**, Controller hanya terima request & panggil service.
- Schema tabel lewat `prisma migrate`, tidak pernah manual.

---

## 5. Naming Conventions

```text
Controllers   : kebab-case → payment-proof.controller.ts
Services      : kebab-case → checkout.service.ts
DTO           : PascalCase → CreateOrderDto, UploadPaymentProofDto
Models Prisma : PascalCase → User, Order, BoardBooking
Tabel DB      : snake_case plural → orders, cart_items, board_bookings
Variabel      : camelCase → dpDeadline, waNumber
Konstanta     : UPPER_SNAKE → DP_DEADLINE_HOURS
Git branch    : feat/[nama] | fix/[nama]
```

---

## 6. Code Conventions

- Selalu gunakan try-catch atau global exception filter.
- Validasi input via DTO + `class-validator`, tidak pernah manual di Controller.
- Semua kalkulasi (ongkir, DP, pelunasan, laba, HPP) **wajib di Service backend**.
- Terapkan **soft delete** (`deleted_at`) di `products`, `users`, `expenses` — query default filter `WHERE deleted_at IS NULL`.
- **Pagination wajib** (`?page=1&limit=20`) di semua endpoint yang mengembalikan array.
- Ongkir hanya dikalkulasi via Google Distance Matrix jika `delivery_type = 'delivery'`. Jika `pickup`, ongkir langsung 0.

**HTTP Status Code Standar:**

| Kode | Kondisi |
|---|---|
| 200 | Berhasil ambil/update |
| 201 | Berhasil buat data baru |
| 400 | Validasi gagal / stok kurang |
| 401 | Token tidak ada, expired, email belum verif |
| 403 | Role salah / Email/WA di-blacklist |
| 404 | Data tidak ditemukan |
| 409 | Tanggal booking di-lock / order pending sudah ada |
| 500 | Server error |

---

## 7. API Response Format

```javascript
// Sukses (single)
{ success: true, message: "...", data: { ... } }

// Sukses (list/paginated)
{ success: true, data: [...], meta: { page, limit, total, totalPages } }

// Error
{ success: false, message: "...", errors: [...] }
```

---

## 8. Database & ORM Rules

1. **Wajib ORM** — raw SQL hanya untuk agregasi berat (`$queryRaw`) dan harus dikomentari alasannya.
2. **Migration** — setiap ubah schema, jalankan `prisma migrate dev`.
3. **Transaksi Booking** — saat checkout yang berisi papan ucapan: `prisma.$transaction()` + unique constraint `(board_id, booking_date)` di DB.
4. **Reservasi Stok** — checkout → `reserved_qty += qty`. Order `completed` → `stock_qty -= qty`, `reserved_qty -= qty`. Order `cancelled`/`rejected` → `reserved_qty -= qty` (dikembalikan).
5. **Validasi Stok** — cek `stock_qty - reserved_qty >= qty` sebelum insert order untuk `ready_stock`.
6. **Snapshot Harga** — setiap `order_item` wajib simpan `price_snapshot` & `cost_price_snapshot` saat order dibuat.
7. **Soft Delete** — kolom `deleted_at` nullable di entitas utama.
8. **Refresh Token Revocation** — token yang di-logout disimpan di Redis (TTL 30 hari) agar tidak bisa dipakai ulang.
9. **Auto-assign Board** — saat checkout dengan papan ucapan, backend otomatis pilih `board_id` dari `board_inventory` yang `is_active = true` dan tidak ada booking aktif di tanggal tersebut (first available).

---

## 9. Security & Validation Rules

### Autentikasi Customer
- Register → kirim email verifikasi → `is_verified = false` sampai link diklik.
- Checkout, booking, upload bukti bayar: wajib **JWT Guard + Verified Guard** (`is_verified == true`).
- **Access Token**: 1 jam, simpan di memori Flutter (bukan localStorage — hindari XSS).
- **Refresh Token**: 30 hari, via `httpOnly cookie` (`Secure`, `SameSite=Strict`).
- `Dio auth_interceptor.dart` menangkap `401` → otomatis panggil refresh → retry request.
- Rate limit ketat di `/auth/register` & `/auth/resend-verification` (1x/2 menit/IP).

### Autentikasi Admin
- JWT terpisah untuk semua `/admin/*` routes.
- Guard `@Roles('owner', 'finance', 'staff_verifikasi')` per endpoint.
- `/admin/finance/*` & `/admin/reports/*` hanya untuk role `owner`/`finance`.

### Validasi Upload Bukti Bayar
1. Cek **magic bytes** buffer — pastikan file benar-benar JPG/PNG asli.
2. Tolak jika > 2MB.
3. Simpan dengan nama **UUID random** ke object storage.
4. Hanya boleh upload jika belum ada bukti yang statusnya `pending` atau `approved` untuk tipe yang sama (DP/final).
5. **Retract diperbolehkan** selama `verification_status = 'pending'` (admin belum verifikasi).

### Validasi Keranjang
- Jika `product.category == 'papan_ucapan'`, maka `booking_date` di `cart_items` **wajib diisi** — validasi di level DTO & Service.
- `booking_date` tidak boleh di masa lalu.

---

## 10. Features & Task Breakdown (Checklist)

### Modul 1: Auth & User Management
- [ ] `POST /api/auth/register` — register, kirim token verif email
- [ ] `GET /api/auth/verify?token=` — konfirmasi email → `is_verified = true`
- [ ] `POST /api/auth/resend-verification` — kirim ulang, rate limit 1x/2mnt/IP
- [ ] `POST /api/auth/login` — return access token + set refresh token cookie
- [ ] `POST /api/auth/refresh-token` — tukar cookie → access token baru
- [ ] `POST /api/auth/logout` — revoke refresh token di Redis, hapus cookie
- [ ] `GET /api/auth/me` — profil customer aktif
- [ ] `PUT /api/auth/me` — update nama, telepon, password
- [ ] `POST /api/admin/auth/login` — return JWT + role
- [ ] `GET, PUT /api/admin/profile`
- [ ] `CRUD /api/admin/staff` — khusus owner
- [ ] `CRUD /api/categories`

### Modul 2: Katalog Produk & Stok
- [ ] `GET /api/products?page=&limit=&category=&search=` — public, pagination
- [ ] `GET /api/products/:id` — public, detail + foto + varian + stok available
- [ ] `POST, PUT, DELETE /api/admin/products` — CRUD produk (soft delete)
- [ ] `POST /api/admin/products/:id/images` — upload foto, simpan ke `product_images`
- [ ] `DELETE /api/admin/products/:id/images/:imageId`
- [ ] `PUT /api/admin/products/:id/stock` — set `stock_qty`, `stock_type`, `po_days`

### Modul 3: Keranjang Belanja (Persistent — Offline Resilient) ⭐
- [ ] `GET /api/cart` — ambil keranjang dari server
- [ ] `POST /api/cart/items` — tambah item; validasi `booking_date` wajib untuk papan ucapan, tidak boleh tanggal lalu
- [ ] `PUT /api/cart/items/:itemId` — ubah qty / note
- [ ] `DELETE /api/cart/items/:itemId` — hapus 1 item
- [ ] `DELETE /api/cart` — kosongkan keranjang
- [ ] `POST /api/cart/sync` — batch sync saat kembali online

### Modul 4: Kalender Ketersediaan Papan Ucapan
- [ ] `GET /api/booking/calendar?month=` — public, tampil tanggal available/booked per board
- [ ] `GET /api/booking/check-availability?date=` — auth customer, cek apakah tanggal masih aman sebelum checkout
- [ ] Cron: auto-release lock expired (tiap 1 menit)

### Modul 5: Checkout & Pembayaran DP
- [ ] `POST /api/checkout/estimate-ongkir` — auth customer, kalkulasi ongkir (hanya jika `delivery_type=delivery`)
- [ ] `POST /api/checkout` — auth+verified: blacklist check → pending order check → stok check → ketersediaan tanggal → reserve stok → buat order & lock board (dalam 1 transaction) → return `order_id`, `dp_amount`, `dp_deadline`
- [ ] `POST /api/orders/:orderId/payment-proof/dp` — upload bukti DP (validasi magic bytes, size, UUID rename)
- [ ] `DELETE /api/orders/:orderId/payment-proof/dp` — **retract bukti DP** jika salah kirim foto (hanya jika status `pending`)
- [ ] Cron: auto-cancel order lewat `dp_deadline` → release lock → kembalikan `reserved_qty`

### Modul 6: Pelunasan Sisa Pembayaran ⭐
- [ ] `GET /api/orders/:orderId/remaining-amount` — cek sisa tagihan
- [ ] `POST /api/orders/:orderId/payment-proof/final` — upload bukti pelunasan
- [ ] `DELETE /api/orders/:orderId/payment-proof/final` — **retract bukti pelunasan** jika salah (hanya jika status `pending`)
- [ ] Cron: kirim **warning email** ke customer H-1 sebelum `pelunasan_deadline`
- [ ] Cron: auto-cancel jika masih tidak bayar setelah `pelunasan_deadline`

### Modul 7: Riwayat & Detail Order Customer ⭐
- [ ] `GET /api/orders/my?page=&limit=&status=` — semua order milik sendiri
- [ ] `GET /api/orders/my/:orderId` — detail order: items, status, bukti bayar, timeline
- [ ] `POST /api/orders/my/:orderId/cancel` — **cancel order** oleh customer; jika DP belum dibayar → langsung cancel gratis; jika DP sudah diverifikasi → hitung refund bertingkat (< 12 jam = 100%, 12-24 jam = 75%, > 24 jam = 50%) → set `refund_status = pending_refund`

### Modul 8: Verifikasi Admin & Notifikasi Real-time
- [ ] `GET /api/admin/orders?status=&page=&limit=` — antrian verifikasi dengan filter & pagination
- [ ] `GET /api/admin/orders/:id` — detail order lengkap
- [ ] `POST /api/admin/orders/:id/verify-dp` → order jadi `dp_verified` → kirim email + WA ke customer (nominal sisa + deadline)
- [ ] `POST /api/admin/orders/:id/verify-final` → order jadi `fully_paid` → lock board jadi `confirmed` permanen → generate WA deep-link
- [ ] `POST /api/admin/orders/:id/reject` → blacklist Email+WA, release lock, kembalikan `reserved_qty`, catat alasan
- [ ] `POST /api/admin/orders/:id/complete` → tandai order selesai diantar/diterima → status `completed`, `stock_qty -= qty`, `reserved_qty -= qty`
- [ ] `POST /api/admin/orders/:id/force-cancel { admin_cancel_note }` → force-cancel (force majeure) → full refund (`refund_deduction_pct = 0`) → `refund_status = pending_refund` → email ke customer
- [ ] `PUT /api/admin/orders/:id/refund-done { refund_note }` → tandai refund sudah ditransfer manual → `refund_status = refunded` → email konfirmasi ke customer
- [ ] `GET /api/admin/orders?refund_status=pending_refund` → filter antrian order yang butuh proses refund manual
- [ ] WebSocket: emit `payment_proof_submitted` ke room admin saat customer upload bukti (DP/final)
- [ ] WebSocket: emit `proof_retracted` ke room admin saat customer tarik ulang bukti bayar
- [ ] `GET /api/admin/boards` — lihat semua unit papan ucapan
- [ ] `PUT /api/admin/orders/:id/reassign-board` — reassign board secara manual jika diperlukan
- [ ] `CRUD /api/admin/blacklist`

### Modul 9: Web-to-WhatsApp Integration
- [ ] Generate token terenkripsi berisi ringkasan order
- [ ] `GET /o/:token` — halaman ringkasan order (wajib cek JWT admin)
- [ ] Endpoint generate `wa.me` deep-link + draft pesan + link `/o/:token`

### Modul 10: Keuangan & Laporan (Owner/Finance Only)
- [ ] `CRUD /api/admin/finance/capital`
- [ ] `CRUD /api/admin/finance/expenses` (soft delete)
- [ ] `CRUD /api/admin/finance/product-costs` (histori `effective_date`)
- [ ] `GET /api/admin/reports/summary?from=&to=`
- [ ] `GET /api/admin/reports/chart-data?type=&from=&to=`
- [ ] `GET /api/admin/reports/export?type=profit_loss&from=&to=`

---

## 11. Do Not (SANGAT PENTING)

- **JANGAN** buat tabel manual tanpa `prisma migrate`.
- **JANGAN** tulis connection string di service/controller — gunakan `.env` + `ConfigModule`.
- **JANGAN** kembalikan `password_hash`, `refresh_token`, atau `verification_token` di response.
- **JANGAN** bypass validasi DTO/class-validator.
- **JANGAN** hitung ongkir, DP, pelunasan, atau laba di Flutter client.
- **JANGAN** panggil Google Maps API jika `delivery_type = 'pickup'`.
- **JANGAN** hapus unique constraint `(board_id, booking_date)` atau partial unique index `one_pending_order_per_user`.
- **JANGAN** beri akses `/admin/finance/*` dan `/admin/reports/*` selain role `owner`/`finance`.
- **JANGAN** simpan keranjang hanya di state Flutter — wajib sync ke server.
- **JANGAN** simpan access token di `localStorage` — simpan di memori aplikasi.
- **JANGAN** hard delete `products`, `users`, `expenses` — gunakan soft delete.
- **JANGAN** trigger soft-lock papan ucapan saat tambah ke keranjang.
- **JANGAN** izinkan upload bukti baru jika sudah ada bukti `approved` untuk tipe yang sama.
- **JANGAN** izinkan retract bukti jika `verification_status` sudah bukan `pending`.

---

## 12. Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/florist_db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT — Access Token
JWT_SECRET=supersecretkey_access
JWT_EXPIRES_IN=1h

# JWT — Refresh Token
JWT_REFRESH_SECRET=supersecretkey_refresh
JWT_REFRESH_EXPIRES_IN=30d

# Google Maps (Ongkir — hanya untuk delivery)
GOOGLE_MAPS_API_KEY=your_google_maps_key
TOKO_ORIGIN_LAT=-7.257472
TOKO_ORIGIN_LNG=112.752088

# Ongkir Formula
ONGKIR_BASE_KM=4
ONGKIR_BASE_FEE=10000
ONGKIR_PER_KM_FEE=2500

# WhatsApp
WA_ADMIN_NUMBER=6281234567890
WA_ENCRYPTION_SECRET=your_aes_secret_key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=no-reply@yourdomain.com

# Object Storage (Cloudflare R2)
STORAGE_PROVIDER=cloudflare_r2
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=florist-uploads
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com

# Upload
MAX_UPLOAD_SIZE_MB=2
ALLOWED_UPLOAD_EXT=.jpg,.jpeg,.png

# Batas Waktu Pembayaran
DP_DEADLINE_HOURS=2
PELUNASAN_DEADLINE_DAYS=3

# Kebijakan Refund DP (cancel oleh customer, potongan bertingkat)
# Jika cancel dalam X jam pertama: potongan sekian persen dari dp_amount
REFUND_TIER1_HOURS=12       # Cancel < 12 jam → potongan 0%
REFUND_TIER1_DEDUCTION=0
REFUND_TIER2_HOURS=24       # Cancel 12–24 jam → potongan 25%
REFUND_TIER2_DEDUCTION=25
REFUND_TIER3_DEDUCTION=50   # Cancel > 24 jam → potongan 50%
```

---

# Arsitektur Sistem

## 1. Diagram High-Level

```
┌───────────────────────────────────────────────────────────────┐
│  FLUTTER WEB (Mobile-First)                                    │
│  - Bloc/Cubit per feature                                      │
│  - Cart: localStorage buffer + auto-sync (ConnectivityService) │
│  - Auth: access token di memori, refresh via httpOnly cookie   │
│  - Dio interceptor: auto-refresh saat 401                      │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTPS + WebSocket
┌───────────────────────▼───────────────────────────────────────┐
│  BACKEND (NestJS)                                              │
│  Auth · Cart · Checkout · Orders · PaymentProof               │
│  Notification (WebSocket) · Ongkir · Blacklist · WA           │
│  Finance · Reports · Admin                                     │
└─────┬──────────────┬──────────────┬────────────────────────────┘
      │              │              │
┌─────▼──────┐  ┌────▼──────┐  ┌───▼─────────────┐
│ PostgreSQL  │  │  Redis    │  │  Object Storage  │
│ users       │  │ TTL lock  │  │  bukti bayar     │
│ orders      │  │ rate-limit│  │  foto produk     │
│ cart_items  │  │ token rev.│  └─────────────────┘
│ board_book. │  └───────────┘
│ product_img │        │
└─────────────┘  ┌─────▼──────────┐
                 │  Cron Workers   │
                 │ - release lock  │
                 │ - expire DP     │
                 │ - warn pelunasan│
                 │ - expire pelun. │
                 └────────────────┘
```

---

## 2. Schema Database Lengkap

### A. Autentikasi & Pengguna

**`users`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| email | text | unique |
| password_hash | text | bcrypt |
| full_name | text | |
| phone_number | text | |
| is_verified | bool | default: false |
| verification_token | text | nullable |
| token_expires_at | timestamp | nullable |
| deleted_at | timestamp | nullable — soft delete |
| created_at | timestamp | |

**`admin_users`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| email | text | unique |
| password_hash | text | bcrypt |
| role | enum | `owner`, `finance`, `staff_verifikasi` |
| full_name | text | |
| is_active | bool | default: true |
| created_at | timestamp | |

### B. Produk & Inventaris

**`products`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| category | enum | `bunga`, `kado`, `papan_ucapan` |
| name | text | |
| description | text | |
| base_price | numeric | |
| stock_type | enum | `ready_stock`, `pre_order` |
| stock_qty | int | stok fisik |
| reserved_qty | int | default: 0 — dikurangi saat checkout, dikembalikan saat cancel |
| po_days | int | nullable — estimasi hari jika pre_order |
| is_active | bool | |
| deleted_at | timestamp | nullable — soft delete |

**`product_images`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → `products` |
| image_url | text | URL object storage |
| is_primary | bool | satu produk hanya boleh 1 primary |
| sort_order | int | urutan tampil |
| uploaded_at | timestamp | |

**`product_variants`**
| id | variant_name | price_delta | product_id (FK) |

**`board_inventory`** (unit papan ucapan fisik)
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| board_name | text | misal "Papan A", "Papan B" |
| board_type | text | nullable — jenis papan (misal standing, wall) |
| is_active | bool | |

### C. Keranjang & Transaksi

**`cart_items`** ⭐
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → `users` |
| product_id | uuid | FK → `products` |
| variant_id | uuid | nullable — FK → `product_variants` |
| qty | int | |
| custom_note | text | nullable — warna, ucapan, request khusus |
| booking_date | date | nullable — WAJIB jika papan_ucapan; tidak boleh tanggal lalu |
| added_at | timestamp | |
| updated_at | timestamp | |

**`board_bookings`** ⭐ (anti-double-booking)
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| board_id | uuid | FK → `board_inventory` (auto-assign saat checkout) |
| booking_date | date | |
| status | enum | `soft_locked`, `confirmed`, `cancelled` |
| user_id | uuid | FK → `users` |
| order_id | uuid | nullable — FK → `orders` |
| locked_at | timestamp | |
| expires_at | timestamp | locked_at + 15 menit (dilepas cron jika order tidak selesai DP) |
| **UNIQUE (board_id, booking_date) WHERE status IN ('soft_locked','confirmed')** | | race condition prevention |

**`orders`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → `users` |
| wa_number | text | nomor WA pemesan (untuk notifikasi admin via WA) |
| customer_name | text | nama pemesan |
| recipient_name | text | nama penerima (bisa beda dengan pemesan) |
| recipient_phone | text | nomor telepon penerima |
| delivery_type | enum | `delivery`, `pickup` |
| status | enum | `pending_payment`, `dp_verified`, `pending_final_payment`, `fully_paid`, `processing`, `completed`, `cancelled`, `rejected` |
| subtotal | numeric | |
| ongkir_fee | numeric | 0 jika pickup |
| dp_amount | numeric | 50% dari (subtotal + ongkir_fee) |
| remaining_amount | numeric | sisa 50% |
| total | numeric | subtotal + ongkir_fee |
| custom_text_request | text | ucapan papan / request khusus |
| estimated_ready_date | date | nullable — diisi jika ada item pre_order (created_at + max po_days) |
| dp_deadline | timestamp | created_at + DP_DEADLINE_HOURS |
| dp_verified_at | timestamp | nullable — diisi saat admin verif DP |
| pelunasan_deadline | timestamp | dp_verified_at + PELUNASAN_DEADLINE_DAYS |
| cancelled_at | timestamp | nullable — waktu pembatalan |
| cancelled_by | enum | nullable — `customer`, `admin`, `system` |
| cancel_reason | text | nullable — alasan pembatalan (diisi admin atau sistem) |
| refund_amount | numeric | nullable — nominal DP yang dikembalikan ke customer (hasil hitung potongan bertingkat) |
| refund_deduction_pct | int | nullable — persen potongan yang dikenakan (0, 25, atau 50) |
| refund_status | enum | nullable — `pending_refund`, `refunded` — diupdate admin setelah transfer balik selesai |
| refund_note | text | nullable — catatan rekam jejak refund manual oleh admin (no. rekening, tanggal transfer, dll) |
| admin_cancel_note | text | nullable — catatan force-cancel oleh admin (force majeure, dll) |
| created_at | timestamp | |

**`order_items`**
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → `orders` |
| product_id | uuid | FK → `products` |
| variant_id | uuid | nullable |
| qty | int | |
| price_snapshot | numeric | harga jual saat transaksi |
| cost_price_snapshot | numeric | HPP saat transaksi (untuk kalkulasi laba historis) |
| estimated_ready_date | date | nullable — created_at + po_days jika pre_order |

**`delivery_addresses`**
| id | order_id (FK) | full_address | lat | lng | distance_km | ongkir_calculated |

> Jika `delivery_type = 'pickup'`, baris ini tidak dibuat dan ongkir_fee di `orders` = 0.

**`payment_proofs`** ⭐
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → `orders` |
| proof_type | enum | `dp`, `final` |
| file_url | text | URL object storage (UUID filename) |
| original_filename | text | nama asli untuk referensi admin (tidak diekspos publik) |
| uploaded_at | timestamp | |
| file_size | int | bytes |
| mime_type | text | |
| verification_status | enum | `pending`, `approved`, `rejected` |
| rejected_reason | text | nullable |
| verified_by_admin_id | uuid | nullable |
| verified_at | timestamp | nullable |
| retracted_at | timestamp | nullable — diisi saat user tarik ulang bukti salah |

**`blacklist`**
| id | type (`email`/`wa_number`) | value | reason | blacklisted_at | blacklisted_by_admin_id |

**`audit_logs`**
| id | action | entity_type | entity_id | performed_by | performed_by_role | details (jsonb) | created_at |

### D. Keuangan

**`product_costs`** (HPP historis)
| id | product_id (FK) | cost_price | effective_date |

**`capital_injections`** (modal masuk)
| id | amount | source | note | injected_at | created_by_admin_id (FK) |

**`expenses`** (pengeluaran operasional)
| kolom | tipe | keterangan |
|---|---|---|
| id | uuid | PK |
| category | enum | `bahan_baku`, `operasional`, `gaji`, `transport`, `marketing`, `lainnya` |
| amount | numeric | |
| description | text | |
| expense_date | date | |
| attachment_url | text | nullable |
| created_by_admin_id | uuid | FK |
| deleted_at | timestamp | nullable — soft delete |

**`revenue_ledger`** (ringkasan harian — materialized view atau tabel)
| date (PK) | gross_revenue | total_hpp | total_ongkir_collected | gross_profit |

### E. Constraint SQL Kritis

```sql
-- Max 1 order pending per user
CREATE UNIQUE INDEX one_pending_order_per_user
  ON orders (user_id)
  WHERE status = 'pending_payment';

-- Cegah duplikasi item di keranjang
CREATE UNIQUE INDEX unique_cart_item
  ON cart_items (
    user_id,
    product_id,
    COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(booking_date, '1970-01-01'::date)
  );

-- Cegah upload 2 bukti aktif untuk tipe yang sama
CREATE UNIQUE INDEX one_active_proof_per_type
  ON payment_proofs (order_id, proof_type)
  WHERE verification_status IN ('pending', 'approved');
```

---

## 3. Rekomendasi Stack & Integrasi

| Layer | Pilihan | Alasan |
|---|---|---|
| Backend | **NestJS + TypeScript** | Modular, WebSocket bawaan, BullMQ, Cron native |
| Database | **PostgreSQL** (Supabase/Neon/RDS) | Partial index, transaction, constraint ketat |
| Cache/Lock | **Redis** | TTL native, token revocation |
| Object Storage | **Cloudflare R2** | S3-compatible, tanpa egress fee |
| Deploy | Railway / Fly.io / VPS | |

### Frontend Flutter Web — Struktur Folder

```
lib/
 ├── features/
 │    ├── auth/
 │    │    ├── auth_bloc.dart
 │    │    └── token_manager.dart        # Access token di memori
 │    ├── catalog/
 │    ├── cart/
 │    │    ├── cart_bloc.dart            # Optimistic update + pending queue
 │    │    └── cart_local_storage.dart   # Buffer offline (IndexedDB)
 │    ├── booking/                        # Tampil kalender, cek ketersediaan
 │    ├── checkout/                       # Ongkir, delivery type, submit checkout
 │    ├── orders/
 │    │    ├── order_history_bloc.dart
 │    │    ├── order_detail_bloc.dart
 │    │    └── cancel_order_bloc.dart
 │    ├── payment_proof/
 │    │    ├── upload_proof_bloc.dart     # Upload DP & final
 │    │    └── retract_proof_bloc.dart    # Tarik ulang bukti salah
 │    └── admin/
 │         ├── dashboard/
 │         ├── order_verification/        # + WebSocket listener notifikasi
 │         ├── finance/
 │         ├── export/
 │         ├── blacklist/
 │         └── product_stock/
 ├── repositories/
 ├── services/
 │    └── connectivity_service.dart      # Monitor koneksi, trigger cart sync
 └── core/
      ├── network/
      │    ├── dio_client.dart
      │    └── auth_interceptor.dart     # Auto-refresh token saat 401
      └── theme/
```

---

## 4. Keranjang Offline-Resilient ⭐

**Prinsip: Offline-First, Sync Later**

| Storage | Tujuan |
|---|---|
| `localStorage`/`IndexedDB` (browser) | Buffer sementara saat offline |
| Tabel `cart_items` di PostgreSQL | Single source of truth |

**Alur Normal (online):**
```
User tambah item → POST /api/cart/items
  → Backend insert cart_items → return state terbaru
  → CartBloc update state + perbarui cache lokal
```

**Saat offline:**
```
API call gagal → simpan aksi ke "pending queue" di localStorage
  → UI update optimistik (item tampil)
  → Tampilkan badge kecil "Menyimpan..." di ikon keranjang
```

**Saat kembali online:**
```
ConnectivityService deteksi → CartBloc.syncPendingQueue()
  → POST /api/cart/sync (kirim seluruh state lokal)
  → Backend: hapus cart_items lama → insert batch baru → return final state
  → CartBloc update dari server, hapus pending queue lokal
```

**Aturan Keranjang:**
- Keranjang **TIDAK dihapus saat logout** — tetap ada saat login kembali.
- Keranjang dikosongkan backend setelah `POST /api/checkout` berhasil.
- Item papan ucapan wajib punya `booking_date` yang tidak di masa lalu.

---

## 5. Alur Retract & Kirim Ulang Bukti Bayar ⭐

> Fitur ini memungkinkan customer yang salah upload foto (misalnya foto selfie bukan foto bukti transfer) untuk menarik ulang dan mengunggah yang benar, **selama admin belum memverifikasi**.

```
[Customer upload bukti DP yang salah]
  → payment_proofs: { proof_type: 'dp', verification_status: 'pending' }
  → Customer sadar salah foto
  │
  ▼
[Customer klik "Ganti Foto Bukti Bayar"]
  → DELETE /api/orders/:orderId/payment-proof/dp
  → Backend: cek bahwa verification_status == 'pending' (bukan approved/rejected)
  → Jika ya: tandai proof lama dengan retracted_at = now, hapus file dari storage
  → Response: 200 OK, customer bisa upload ulang
  │
  ▼
[Customer upload ulang foto yang benar]
  → POST /api/orders/:orderId/payment-proof/dp (file baru)
  → WebSocket emit 'proof_retracted' + 'payment_proof_submitted' ke admin
  → Alur verifikasi berjalan normal
```

**Aturan Retract:**
- Hanya bisa dilakukan jika `verification_status = 'pending'`.
- Jika status sudah `approved` → **tidak bisa retract** → hubungi admin.
- Jika status sudah `rejected` → tidak perlu retract, langsung upload ulang (bukti rejected dianggap tidak aktif).
- Constraint SQL `one_active_proof_per_type` mencegah ada 2 bukti aktif untuk tipe yang sama.
- Admin mendapat notifikasi WebSocket (`proof_retracted`) agar tidak memverifikasi bukti yang sudah ditarik.

---

## 6. Alur Pembayaran Dua Tahap (DP + Pelunasan) ⭐

```
[Checkout] → Order: status=pending_payment, dp_deadline=+2jam
     ↓
[Customer upload bukti DP]
     ↓
[Admin verify-dp]
  → status: pending_final_payment
  → dp_verified_at = now
  → pelunasan_deadline = dp_verified_at + 3 hari
  → Email + WA ke customer: sisa tagihan + deadline pelunasan
     ↓
[H-1 sebelum pelunasan_deadline] → Cron kirim warning email ke customer
     ↓
[Customer upload bukti pelunasan]
     ↓
[Admin verify-final]
  → status: fully_paid
  → booking papan ucapan (jika ada) → confirmed permanen
  → Generate WA deep-link ringkasan final
     ↓
[Admin mark complete] → POST /api/admin/orders/:id/complete
  → status: completed
  → stock_qty -= qty (stok fisik resmi dikurangi)
  → reserved_qty -= qty

--- SKENARIO PEMBATALAN ---

[Customer cancel] (hanya saat status: pending_payment atau dp_verified/pending_final_payment)
  → POST /api/orders/my/:orderId/cancel { reason? }
  → release booking lock → reserved_qty dikembalikan
  → Hitung refund_amount berdasarkan usia order (waktu sejak created_at):

       Usia order saat cancel   │ Potongan  │ Refund ke customer
       ─────────────────────────┼───────────┼───────────────────
       < 12 jam                 │ 0%        │ 100% dari dp_amount
       12 jam – 24 jam          │ 25%       │ 75% dari dp_amount
       > 24 jam                 │ 50%       │ 50% dari dp_amount

  → Jika DP belum dibayar (status masih pending_payment): langsung cancel, tidak ada refund
  → Jika DP sudah diverifikasi: isi orders.refund_amount, refund_deduction_pct, refund_status='pending_refund'
  → Email ke customer: konfirmasi cancel + nominal yang akan dikembalikan + instruksi
  → Email ke admin: ada order dibatalkan customer, perlu proses refund manual

[Admin proses refund manual]
  → PUT /api/admin/orders/:id/refund-done
  → Isi refund_note (nomor rekening tujuan, tanggal transfer, bukti transfer)
  → refund_status → 'refunded'
  → Email ke customer: konfirmasi refund sudah dikirim

[Admin force-cancel] (force majeure / stok habis mendadak)
  → POST /api/admin/orders/:id/force-cancel { admin_cancel_note }
  → cancelled_by = 'admin', full refund (refund_deduction_pct = 0, refund_amount = dp_amount)
  → release booking lock → reserved_qty dikembalikan
  → refund_status = 'pending_refund'
  → Email ke customer: order dibatalkan pihak toko + alasan + instruksi klaim refund penuh

[DP tidak dibayar lewat dp_deadline]
  → Cron auto-cancel (cancelled_by='system') → release lock → reserved_qty kembali
  → Tidak ada refund (DP belum terbukti dibayar)

[Pelunasan tidak dibayar lewat pelunasan_deadline]
  → Cron auto-cancel (cancelled_by='system') → release lock → reserved_qty kembali
  → Hitung refund DP dengan potongan berdasarkan usia order (sama dengan aturan customer cancel di atas)
  → Email notifikasi ke customer: order dibatalkan + nominal refund DP
```

---

## 7. Alur Checkout (Semua Validasi Tergabung)

```
POST /api/checkout { items[], delivery_type, address?, wa_number, custom_text }
  → [Guard] JWT valid + is_verified = true
  → [Guard] Cek email & wa_number di blacklist → 403
  → [Service] Cek pending order user → 409
  → [Service] Validasi stok: stock_qty - reserved_qty >= qty (ready_stock)
  → [Service] Jika ada papan_ucapan: cek booking_date tersedia di semua board
  → [Service] Jika delivery: kalkulasi ongkir via Google Distance Matrix
  → [DB Transaction prisma.$transaction()]
      INSERT orders + order_items + delivery_address (jika delivery)
      UPDATE products: reserved_qty += qty (setiap item)
      INSERT board_bookings: auto-assign board yang available, soft_locked, expires_at = +15mnt
      (DB constraint sebagai safety net terakhir jika ada race condition)
  → Return { orderId, dpAmount, dpDeadline, remainingAmount }
```

---

## 8. Formula Laporan Keuangan

```
Gross Revenue  = SUM(orders.total) WHERE status IN ('fully_paid','processing','completed')
Total HPP      = SUM(order_items.qty × order_items.cost_price_snapshot)
Gross Profit   = Gross Revenue − Total HPP
Total Expenses = SUM(expenses.amount) WHERE expense_date IN range
Net Profit     = Gross Profit − Total Expenses
```

> Ongkir dipisah dari omzet produk. Biaya bensin/kurir dicatat di `expenses` kategori `transport`. Ini memberi insight apakah ongkir yang diterima surplus/defisit vs biaya pengiriman riil.

---

## 9. Anti-Spam — Defense in Depth

| Layer | Mekanisme |
|---|---|
| 1 | Email Verification Barrier — wajib verif email sebelum transaksi |
| 2 | Blacklist Check — cek email & WA di middleware sebelum checkout/auth |
| 3 | Single Pending Constraint — partial unique index di DB |
| 4 | Rate Limiting — `@nestjs/throttler` per IP di auth & checkout |
| 5 | DP Deadline — 2 jam; lewat → auto-cancel + release lock |

---

## 10. Urutan Implementasi

| # | Modul | Ketergantungan |
|---|---|---|
| 1 | Schema DB + semua constraint & index | — |
| 2 | Auth (register, verif email, login, refresh token) | Schema DB |
| 3 | Katalog produk (CRUD + foto + stok) | Auth |
| 4 | Cart (server-side + offline sync) | Auth + Katalog |
| 5 | Kalender ketersediaan papan (read-only) | Auth + DB |
| 6 | Checkout + DP flow + auto-assign board | Cart + Kalender |
| 7 | Upload & retract bukti DP + WebSocket notif admin | Checkout |
| 8 | Pelunasan + upload & retract bukti final | DP flow |
| 9 | Riwayat order customer + cancel order | Checkout |
| 10 | Dashboard admin (verifikasi, blacklist, stok, mark complete) | Semua transaksi |
| 11 | Force cancel admin + WA deep-link | Dashboard admin |
| 12 | Modul keuangan (modal, pengeluaran, HPP) | Auth admin |
| 13 | Laporan, grafik, export XLSX | Modul keuangan + transaksi |
