# 📡 Seli Florist E-Commerce - API Endpoints Documentation

> **Base URL:** `http://localhost:3000/api`  
> **Swagger Interactive Docs:** `http://localhost:3000/api/docs`  
> **Database GUI (Prisma Studio):** `http://localhost:5555`

---

## 🔐 1. Authentication Module (`/api/auth`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Pendaftaran customer baru | JSON Body: `fullName`, `email`, `phoneNumber`, `password` |
| `GET` | `/api/auth/verify` | Public | Verifikasi email via link token | Query Param: `?token=...` |
| `POST` | `/api/auth/resend-verification` | Public | Kirim ulang email verifikasi | JSON Body: `email` |
| `POST` | `/api/auth/login` | Public | Login Customer & Admin | JSON Body: `email`, `password` |
| `POST` | `/api/auth/refresh` | Public | Refresh Access Token via Cookie | HttpOnly Cookie: `refresh_token` |
| `POST` | `/api/auth/logout` | Auth | Revoke Refresh Token & Session | HttpOnly Cookie / Bearer Token |
| `GET` | `/api/auth/me` | Auth Customer/Admin | Profil akun pengguna aktif | Header: `Authorization: Bearer <token>` |
| `PUT` | `/api/auth/me` | Auth Customer/Admin | Update profil & nomor telepon | JSON Body: `fullName`, `phoneNumber`, `password` |
| `POST` | `/api/auth/forgot-password` | Public | Minta token reset password | JSON Body: `email` |
| `POST` | `/api/auth/reset-password` | Public | Eksekusi reset password baru | JSON Body: `token`, `newPassword` |

---

## 🌸 2. Katalog & Produk Module (`/api`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Daftar semua kategori | Response Array Kategori |
| `POST` | `/api/admin/categories` | Admin | Tambah kategori baru | JSON Body: `slug`, `name`, `description` |
| `PUT` | `/api/admin/categories/:id` | Admin | Edit kategori | JSON Body: `name`, `description` |
| `DELETE`| `/api/admin/categories/:id` | Admin | Hapus kategori | Path Param: `:id` |
| `GET` | `/api/products` | Public | Katalog produk (paginated) | Query: `?page=1&limit=10&category=bunga&search=mawar` |
| `GET` | `/api/products/:id` | Public | Detail 1 produk + foto + varian | Path Param: `:id` |
| `POST` | `/api/admin/products` | Admin | Tambah produk baru | JSON Body: `categoryId`, `name`, `basePrice`, `stockType` |
| `PUT` | `/api/admin/products/:id` | Admin | Update produk | Path Param: `:id` + JSON Body |
| `DELETE`| `/api/admin/products/:id` | Admin | Soft-delete produk | Path Param: `:id` |
| `POST` | `/api/admin/products/:id/images` | Admin | Upload foto produk | Form-Data: `file` (Max 2MB JPG/PNG) |
| `DELETE`| `/api/admin/products/:id/images/:imageId` | Admin | Hapus foto produk | Path Params: `:id`, `:imageId` |
| `PUT` | `/api/admin/products/:id/stock` | Admin | Update stok produk jual | JSON Body: `stockQty`, `stockType`, `poDays` |

---

## 🛒 3. Keranjang Belanja / Cart (`/api/cart`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Auth Customer | Ambil isi keranjang belanja | Header: `Authorization: Bearer <token>` |
| `POST` | `/api/cart/items` | Auth Customer | Tambah item ke keranjang | JSON Body: `productId`, `variantId`, `qty`, `bookingDate`, `customNote` |
| `PUT` | `/api/cart/items/:id` | Auth Customer | Ubah qty / catatan item | Path Param: `:id` + JSON Body: `qty`, `customNote` |
| `DELETE`| `/api/cart/items/:id` | Auth Customer | Hapus 1 item dari keranjang | Path Param: `:id` |
| `DELETE`| `/api/cart` | Auth Customer | Kosongkan seluruh keranjang | Header: `Authorization: Bearer <token>` |
| `POST` | `/api/cart/sync` | Auth Customer | Offline cart batch sync | JSON Body: `items: [...]` |

---

## 📅 4. Kalender Sewa Papan Ucapan (`/api/booking`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/booking/calendar` | Public | Kalender ketersediaan per bulan | Query: `?month=2026-07` |
| `GET` | `/api/booking/check-availability` | Auth Customer | Cek ketersediaan di tanggal tertentu | Query: `?date=2026-07-25` |

---

## 💳 5. Checkout & Transaksi Order (`/api/checkout`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/checkout/estimate-ongkir` | Auth Customer | Hitung ongkir (khusus delivery) | JSON Body: `deliveryType: "delivery"`, `address` |
| `POST` | `/api/checkout` | Auth Verified Customer | Buat order baru & kunci DP 50% | Header: `Idempotency-Key` + JSON Body |

---

## 📸 6. Bukti Pembayaran / Payment Proof (`/api/orders`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/:id/payment-proof/dp` | Auth Customer | Upload bukti bayar DP 50% | Form-Data: `file` (Max 2MB JPG/PNG) |
| `DELETE`| `/api/orders/:id/payment-proof/dp` | Auth Customer | Tarik ulang (retract) bukti DP | Path Param: `:id` (Jika status `pending`) |
| `POST` | `/api/orders/:id/payment-proof/final` | Auth Customer | Upload bukti bayar Pelunasan | Form-Data: `file` (Max 2MB JPG/PNG) |
| `DELETE`| `/api/orders/:id/payment-proof/final` | Auth Customer | Tarik ulang bukti Pelunasan | Path Param: `:id` (Jika status `pending`) |

---

## 📦 7. Riwayat Pesanan Customer (`/api/orders`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/my` | Auth Customer | Daftar riwayat pesanan sendiri | Query: `?page=1&limit=10&status=pending_dp` |
| `GET` | `/api/orders/my/:id` | Auth Customer | Detail timeline pesanan sendiri | Path Param: `:id` |
| `POST` | `/api/orders/my/:id/cancel` | Auth Customer | Pembatalan order & hitung refund | Path Param: `:id` |

---

## 👑 8. Panel Verifikasi Admin (`/api/admin`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | Public Admin | Login khusus Admin / Staff | JSON Body: `email`, `password` |
| `GET` | `/api/admin/orders` | Admin / Staff | Antrean pesanan masuk (filter) | Query: `?status=pending_dp&page=1` |
| `GET` | `/api/admin/orders/:id` | Admin / Staff | Detail pesanan lengkap | Path Param: `:id` |
| `POST` | `/api/admin/orders/:id/verify-dp` | Admin / Staff | Disetujui DP 50% ➔ Kirim WA | Path Param: `:id` |
| `POST` | `/api/admin/orders/:id/verify-final` | Admin / Staff | Disetujui Pelunasan ➔ Lock Papan | Path Param: `:id` |
| `POST` | `/api/admin/orders/:id/reject` | Admin / Staff | Tolak bukti bayar & lepas stok | Path Param: `:id` + JSON Body: `reason` |
| `POST` | `/api/admin/orders/:id/complete` | Admin / Staff | Tandai pesanan selesai terkirim | Path Param: `:id` |
| `POST` | `/api/admin/orders/:id/force-cancel` | Admin / Staff | Pembatalan sepihak (force majeure) | Path Param: `:id` + JSON Body: `adminCancelNote` |
| `PUT` | `/api/admin/orders/:id/refund-done` | Admin / Staff | Konfirmasi transfer refund selesai | Path Param: `:id` + JSON Body: `refundNote` |
| `GET` | `/api/admin/boards` | Admin / Staff | Daftar unit fisik papan sewa | Response Array `rental_units` (`PB-001` - `PB-005`) |
| `PUT` | `/api/admin/orders/:id/reassign-board` | Admin / Staff | Tukar unit papan sewa manual | Path Param: `:id` + JSON Body: `newBoardId` |

---

## 📈 9. Keuangan & Laporan (`/api/admin/reports` & `/api/admin/finance`)

| Method | Endpoint | Access Level | Deskripsi | Format Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/reports/summary` | Owner / Finance | Ringkasan omzet, HPP, & laba | Query: `?from=2026-07-01&to=2026-07-31` |
| `GET` | `/api/admin/reports/chart-data` | Owner / Finance | Data grafik statistik penjualan | Query: `?type=monthly` |
| `GET` | `/api/admin/reports/export` | Owner / Finance | Export laporan ke Excel (.xlsx) | Query: `?type=profit_loss&from=...` |
| `GET/POST` | `/api/admin/finance/capital` | Owner / Finance | Kelola data suntikan modal | JSON Body: `amount`, `description` |
| `GET/POST` | `/api/admin/finance/expenses` | Owner / Finance | Kelola pengeluaran operasional | JSON Body: `category`, `amount` |
