# 📘 DOKUMENTASI RESMI API CUSTOMER - SELI FLORIST

Dokumen ini berisi spesifikasi teknis dan contoh lengkap untuk seluruh endpoint aktivitas **Customer (Pelanggan)** pada aplikasi Seli Florist E-Commerce.

---

# 📂 MODUL 1: AUTENTIKASI & AKUN CUSTOMER

---

## 1.1 POST - Registrasi Customer Baru

### 2. Deskripsi Singkat
Mendaftarkan akun pelanggan baru ke dalam sistem dan memicu pengiriman email verifikasi otomatis.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/register`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `fullName` | String | Wajib | Nama lengkap pelanggan (2-150 karakter) | `"Ricky Customer"` |
| `email` | String | Wajib | Alamat email valid pelanggan | `"rickyprakusa28@gmail.com"` |
| `phoneNumber` | String | Wajib | Nomor HP/WhatsApp aktif | `"089517880077"` |
| `password` | String | Wajib | Password (min. 10 karakter, kombinasi besar, kecil, angka) | `"PasswordKuat123!"` |

### 7. Contoh Request
```json
{
  "fullName": "Ricky Customer",
  "email": "rickyprakusa28@gmail.com",
  "phoneNumber": "089517880077",
  "password": "PasswordKuat123!"
}
```

### 8. Contoh Response Success
**HTTP Status: `201 Created`**
```json
{
  "success": true,
  "message": "Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi akun.",
  "data": {
    "id": "c4b1589a-b8b1-4767-9128-cc573814767e",
    "email": "rickyprakusa28@gmail.com",
    "fullName": "Ricky Customer"
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `409 Conflict` (Email Sudah Terdaftar)**
```json
{
  "success": false,
  "message": "Email is already registered"
}
```

### 10. Catatan Validasi & Hak Akses
* Email harus unik dan berformat valid.
* Password wajib memenuhi kebijakan keamanan (minimal 10 karakter, mengandung huruf kapital, huruf kecil, dan angka).

---

## 1.2 POST - Kirim Ulang Email Verifikasi

### 2. Deskripsi Singkat
Mengirimkan ulang tautan verifikasi email baru apabila tautan lama sudah kadaluwarsa.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/resend-verification`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | Wajib | Alamat email akun yang belum terverifikasi | `"rickyprakusa28@gmail.com"` |

### 7. Contoh Request
```json
{
  "email": "rickyprakusa28@gmail.com"
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "message": "Email verifikasi telah dikirim ulang. Silakan periksa inbox Anda.",
  "data": null
}
```

### 9. Contoh Response Error
**HTTP Status: `429 Too Many Requests` (Rate Limit Exceeded)**
```json
{
  "success": false,
  "message": "ThrottlerException: Too Many Requests"
}
```

### 10. Catatan Validasi & Hak Akses
* Diberlakukan pembatasan laju request (Rate Limit max 1 request / 60 detik).

---

## 1.3 GET - Verifikasi Email Akun

### 2. Deskripsi Singkat
Mengonfirmasi token verifikasi email dan mengaktifkan status akun customer.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/auth/verify?token={{verificationToken}}`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter & Query Params
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `token` | String | Wajib | Token verifikasi 64 karakter dari email | `"b4bd5f59f610f1bb927b37e05df9afd2091f9c1e5064263a2c7281665e1ab099"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/auth/verify?token=b4bd5f59f610f1bb927b37e05df9afd2091f9c1e5064263a2c7281665e1ab099
```

### 8. Contoh Response Success
**HTTP Status: `200 OK` (Tampilan Halaman HTML)**
```html
<!DOCTYPE html>
<html lang="id">
<head><title>Verifikasi Akun - Seli Florist</title></head>
<body>
  <div class="card">
    <h1>Status Akun Seli Florist</h1>
    <p>Email Anda berhasil diverifikasi!</p>
    <a href="http://localhost:3001" class="btn">Masuk ke Seli Florist</a>
  </div>
</body>
</html>
```

### 9. Contoh Response Error
**HTTP Status: `400 Bad Request` (Token Invalid / Sudah Terverifikasi)**
```html
<!DOCTYPE html>
<html lang="id">
<body>
  <div class="card">
    <h1>Informasi Verifikasi</h1>
    <p>Akun Anda sudah terverifikasi sebelumnya atau token tidak valid.</p>
  </div>
</body>
</html>
```

### 10. Catatan Validasi & Hak Akses
* Token bersifat sekali pakai (*One-Time Token*). Begitu sukses digunakan, token langsung hangus.

---

## 1.4 POST - Login Customer

### 2. Deskripsi Singkat
Melakukan autentikasi akun customer dan menerbitkan `accessToken` (JWT) serta `refresh_token` (HttpOnly Cookie).

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/login`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | Wajib | Email terdaftar customer | `"budi.santoso@gmail.com"` |
| `password` | String | Wajib | Password akun | `"PasswordKuat123!"` |

### 7. Contoh Request
```json
{
  "email": "budi.santoso@gmail.com",
  "password": "PasswordKuat123!"
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c4b1589a-b8b1-4767-9128-cc573814767e",
      "email": "budi.santoso@gmail.com",
      "fullName": "Budi Santoso",
      "phoneNumber": "081234567890",
      "role": "CUSTOMER",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWI...",
    "expiresIn": 900
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `401 Unauthorized` (Password Salah)**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 10. Catatan Validasi & Hak Akses
* Akun harus ber-role `CUSTOMER` dan sudah melakukan verifikasi email (`isVerified: true`).

---

## 1.5 GET - Ambil Profil Customer Aktif

### 2. Deskripsi Singkat
Mengambil detail informasi profil customer yang sedang login.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/auth/me`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Request
Tidak memerlukan body. Header Authorization wajib diisi.

### 7. Contoh Request
```http
GET {{BASE_URL}}/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "c4b1589a-b8b1-4767-9128-cc573814767e",
    "email": "budi.santoso@gmail.com",
    "fullName": "Budi Santoso",
    "phoneNumber": "081234567890",
    "role": "CUSTOMER",
    "isVerified": true,
    "createdAt": "2026-07-21T07:37:54.280Z"
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `401 Unauthorized` (Tanpa Header Authorization)**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 10. Catatan Validasi & Hak Akses
* Membutuhkan JWT Token yang valid dan belum kadaluwarsa.

---

## 1.6 PUT - Update Profil & Telepon Customer

### 2. Deskripsi Singkat
Memperbarui nama lengkap dan nomor telepon/WhatsApp milik customer.

### 3. Method
`PUT`

### 4. URL
`{{BASE_URL}}/auth/me`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `fullName` | String | Opsional | Nama lengkap baru | `"Budi Santoso Pemuda"` |
| `phoneNumber` | String | Opsional | Nomor WhatsApp baru | `"081234567899"` |

### 7. Contoh Request
```json
{
  "fullName": "Budi Santoso Pemuda",
  "phoneNumber": "081234567899"
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "c4b1589a-b8b1-4767-9128-cc573814767e",
    "email": "budi.santoso@gmail.com",
    "fullName": "Budi Santoso Pemuda",
    "phoneNumber": "081234567899",
    "role": "CUSTOMER",
    "isVerified": true
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `400 Bad Request` (Format Nomor HP Salah)**
```json
{
  "success": false,
  "message": ["phoneNumber must be a string"]
}
```

### 10. Catatan Validasi & Hak Akses
* Hanya dapat memperbarui akun milik sendiri.

---

## 1.7 POST - Refresh Access Token

### 2. Deskripsi Singkat
Memperbarui `accessToken` yang telah kadaluwarsa menggunakan HttpOnly Cookie `refresh_token`.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/refresh-token`

### 5. Authorization
HttpOnly Cookie `refresh_token` (Otomatis disertakan oleh browser/Postman)

### 6. Parameter Request
Tidak memerlukan body. Cookie `refresh_token` dikirimkan secara otomatis dari browser/Postman Cookie Jar.

### 7. Contoh Request
```http
POST {{BASE_URL}}/auth/refresh-token
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWI...",
    "expiresIn": 900
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `401 Unauthorized` (Token Sudah Pernah Dipakai / Revoked)**
```json
{
  "success": false,
  "message": "Refresh token has been revoked"
}
```

### 10. Catatan Validasi & Hak Akses
* Menerapkan fitur keamanan *Rotating Refresh Token*. Satu token refresh hanya dapat digunakan 1 kali.

---

## 1.8 POST - Logout Customer

### 2. Deskripsi Singkat
Mengakhiri sesi login customer, mencabut token refresh dari Redis, dan menghapus cookie.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/logout`

### 5. Authorization
Bearer Token & HttpOnly Cookie

### 6. Parameter Request
Tidak memerlukan body request.

### 7. Contoh Request
```http
POST {{BASE_URL}}/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

### 9. Contoh Response Error
**HTTP Status: `200 OK` (Graceful Fallback walau token tidak ditemukan)**
```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

---

# 📂 MODUL 2: EKSPLORASI KATALOG & KALENDER SEWA

---

## 2.1 GET - Lihat Semua Kategori Produk

### 2. Deskripsi Singkat
Mengambil seluruh daftar kategori produk aktif (Bunga, Kado, Papan Ucapan).

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/categories`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter Request
Tidak memerlukan parameter.

### 7. Contoh Request
```http
GET {{BASE_URL}}/categories
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-001",
      "slug": "bunga",
      "name": "Bunga Fresh",
      "description": "Aneka buket bunga mawar dan bunga segar"
    },
    {
      "id": "cat-002",
      "slug": "papan_ucapan",
      "name": "Papan Ucapan Sewa",
      "description": "Sewa papan ucapan pernikahan dan duka cita"
    }
  ]
}
```

### 9. Contoh Response Error
**HTTP Status: `500 Internal Server Error`**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 2.2 GET - Lihat Katalog Produk (Pagination & Search)

### 2. Deskripsi Singkat
Mengambil daftar produk publik dengan dukungan pencarian nama produk dan filter kategori.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/products?page=1&limit=10&category=bunga&search=mawar`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter Query
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Number | Opsional | Halaman pagination (default: 1) | `1` |
| `limit` | Number | Opsional | Jumlah item per halaman (default: 10) | `10` |
| `category` | String | Opsional | Slug kategori (`bunga`, `papan_ucapan`, `kado`) | `"bunga"` |
| `search` | String | Opsional | Kata kunci pencarian nama produk | `"mawar"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/products?page=1&limit=10&category=bunga&search=mawar
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "9a9cfebc-b1a2-4129-a3b9-69590e995790",
      "name": "Buket Mawar Passionate Red",
      "basePrice": 250000,
      "stockType": "ready_stock",
      "availableQty": 15,
      "category": { "name": "Bunga Fresh" },
      "images": [{ "url": "https://images.unsplash.com/photo-1561181286-d3fee7d55364" }]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 2.3 GET - Lihat Detail 1 Produk

### 2. Deskripsi Singkat
Mengambil rincian produk, daftar galeri foto, varian ukuran/warna, dan stok tersedia.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/products/{{sampleProductId}}`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter Path
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Wajib | UUID unik produk | `"9a9cfebc-b1a2-4129-a3b9-69590e995790"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/products/9a9cfebc-b1a2-4129-a3b9-69590e995790
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "9a9cfebc-b1a2-4129-a3b9-69590e995790",
    "name": "Buket Mawar Passionate Red",
    "description": "Buket 20 tangkai mawar merah segar dengan pita satin pink mewah.",
    "basePrice": 250000,
    "stockType": "ready_stock",
    "stockQty": 20,
    "availableQty": 15,
    "category": { "id": "cat-001", "name": "Bunga Fresh" },
    "images": [{ "id": "img-01", "url": "https://images.unsplash.com/photo-1561181286" }],
    "variants": [{ "id": "var-01", "name": "Ukuran Jumbo", "priceDelta": 50000 }]
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `404 Not Found` (Produk Tidak Ada)**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## 2.4 GET - Cek Kalender Sewa Papan Ucapan

### 2. Deskripsi Singkat
Mengambil matriks ketersediaan unit sewa papan ucapan fisik untuk seluruh tanggal dalam 1 bulan.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/booking/calendar?month=2026-07`

### 5. Authorization
Tidak Ada (Public Endpoint)

### 6. Parameter Query
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `month` | String | Wajib | Format bulan `YYYY-MM` | `"2026-07"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/booking/calendar?month=2026-07
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "month": "2026-07",
    "totalUnits": 5,
    "days": [
      { "date": "2026-07-25", "bookedQty": 2, "availableQty": 3, "isFull": false },
      { "date": "2026-07-26", "bookedQty": 5, "availableQty": 0, "isFull": true }
    ]
  }
}
```

---

## 2.5 GET - Cek Ketersediaan Tanggal Sewa Spesifik

### 2. Deskripsi Singkat
Mengecek secara presisi apakah tanggal tertentu masih memiliki unit papan sewa yang dapat di-booking.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/booking/check-availability?date=2026-07-25`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Query
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `date` | String | Wajib | Tanggal sewa format `YYYY-MM-DD` | `"2026-07-25"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/booking/check-availability?date=2026-07-25
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "date": "2026-07-25",
    "available": true,
    "availableUnits": 3,
    "totalUnits": 5
  }
}
```

---

# 📂 MODUL 3: PENGELOLAAN KERANJANG BELANJA CUSTOMER

---

## 3.1 POST - Tambah Bunga / Kado ke Keranjang

### 2. Deskripsi Singkat
Menambahkan item produk siap jual (bunga/kado) ke dalam keranjang belanja customer.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/cart/items`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `productId` | String (UUID) | Wajib | UUID produk yang dibeli | `"9a9cfebc-b1a2-4129-a3b9-69590e995790"` |
| `variantId` | String (UUID) | Opsional | UUID varian produk | `"var-01"` |
| `qty` | Number | Wajib | Jumlah barang (min: 1) | `1` |
| `customNote` | String | Opsional | Catatan kartu ucapan/pesan | `"Kartu ucapan: Happy Birthday Siti!"` |

### 7. Contoh Request
```json
{
  "productId": "9a9cfebc-b1a2-4129-a3b9-69590e995790",
  "qty": 1,
  "customNote": "Kartu ucapan: Happy Birthday Siti!"
}
```

### 8. Contoh Response Success
**HTTP Status: `201 Created` / `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cart-item-101",
      "qty": 1,
      "customNote": "Kartu ucapan: Happy Birthday Siti!",
      "product": { "name": "Buket Mawar Passionate Red", "basePrice": 250000 }
    }
  ]
}
```

---

## 3.2 POST - Tambah Papan Sewa ke Keranjang (Ada Tanggal)

### 2. Deskripsi Singkat
Menambahkan item sewa papan ucapan ke keranjang dengan menyertakan `bookingDate` wajib.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/cart/items`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `productId` | String (UUID) | Wajib | UUID produk papan sewa | `"board-prod-uuid"` |
| `qty` | Number | Wajib | Jumlah unit sewa | `1` |
| `customNote` | String | Wajib | Ucapan tulisan di papan fisik | `"Happy Wedding Budi & Siti. Dari: PT Maju"` |
| `bookingDate` | String | Wajib | Tanggal sewa format `YYYY-MM-DD` | `"2026-07-25"` |

### 7. Contoh Request
```json
{
  "productId": "board-prod-uuid",
  "qty": 1,
  "customNote": "Happy Wedding Budi & Siti. Dari: PT Maju",
  "bookingDate": "2026-07-25"
}
```

### 8. Contoh Response Success
**HTTP Status: `201 Created`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cart-item-102",
      "qty": 1,
      "bookingDate": "2026-07-25T00:00:00.000Z",
      "customNote": "Happy Wedding Budi & Siti. Dari: PT Maju",
      "product": { "name": "Papan Ucapan Rustic Premium", "basePrice": 500000 }
    }
  ]
}
```

### 9. Contoh Response Error
**HTTP Status: `400 Bad Request` (Tanggal Sewa Kosong untuk Papan)**
```json
{
  "success": false,
  "message": "bookingDate is required for board products"
}
```

---

## 3.3 GET - Lihat Isi Keranjang Belanja

### 2. Deskripsi Singkat
Mengambil seluruh item yang tersimpan di dalam keranjang belanja customer.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/cart`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Request
Tidak memerlukan body.

### 7. Contoh Request
```http
GET {{BASE_URL}}/cart
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cart-item-101",
      "qty": 1,
      "customNote": "Kartu ucapan: Happy Birthday Siti!",
      "bookingDate": null,
      "product": {
        "id": "9a9cfebc-b1a2-4129-a3b9-69590e995790",
        "name": "Buket Mawar Passionate Red",
        "basePrice": 250000
      }
    }
  ]
}
```

---

## 3.4 PUT - Update Qty & Catatan di Keranjang

### 2. Deskripsi Singkat
Memperbarui jumlah barang atau ucapan pada item tertentu di keranjang.

### 3. Method
`PUT`

### 4. URL
`{{BASE_URL}}/cart/items/{{sampleCartItemId}}`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `qty` | Number | Opsional | Jumlah barang baru | `2` |
| `customNote` | String | Opsional | Catatan baru | `"Ganti warna pita jadi merah"` |

### 7. Contoh Request
```json
{
  "qty": 2,
  "customNote": "Ganti warna pita jadi merah"
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cart-item-101",
      "qty": 2,
      "customNote": "Ganti warna pita jadi merah"
    }
  ]
}
```

---

## 3.5 DELETE - Hapus 1 Item dari Keranjang

### 2. Deskripsi Singkat
Menghapus satu item dari keranjang belanja.

### 3. Method
`DELETE`

### 4. URL
`{{BASE_URL}}/cart/items/{{sampleCartItemId}}`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Path
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Wajib | UUID item keranjang | `"cart-item-101"` |

### 7. Contoh Request
```http
DELETE {{BASE_URL}}/cart/items/cart-item-101
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": []
}
```

---

## 3.6 POST - Batch Sync Keranjang Offline

### 2. Deskripsi Singkat
Menyinkronkan secara massal item keranjang lokal HP saat perangkat kembali terhubung internet.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/cart/sync`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `items` | Array | Wajib | Daftar objek item dari penyimpanan lokal | `[...]` |

### 7. Contoh Request
```json
{
  "items": [
    {
      "productId": "9a9cfebc-b1a2-4129-a3b9-69590e995790",
      "qty": 1,
      "customNote": "Draft dari HP offline"
    }
  ]
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cart-item-103",
      "qty": 1,
      "customNote": "Draft dari HP offline"
    }
  ]
}
```

---

## 3.7 DELETE - Kosongkan Seluruh Keranjang

### 2. Deskripsi Singkat
Menghapus seluruh barang yang berada di dalam keranjang customer.

### 3. Method
`DELETE`

### 4. URL
`{{BASE_URL}}/cart`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Request
Tidak memerlukan body.

### 7. Contoh Request
```http
DELETE {{BASE_URL}}/cart
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": []
}
```

---

# 📂 MODUL 4: ESTIMASI ONGKIR & CHECKOUT DP 50%

---

## 4.1 POST - Hitung Estimasi Ongkir Delivery

### 2. Deskripsi Singkat
Menghitung estimasi tarif biaya pengiriman kurir berdasarkan lokasi alamat tujuan.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/checkout/estimate-ongkir`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `deliveryType` | String | Wajib | Jenis pengiriman (`delivery` atau `pickup`) | `"delivery"` |
| `address` | String | Wajib | Alamat lengkap tujuan pengiriman | `"Jl. Pemuda No. 45, Surabaya"` |

### 7. Contoh Request
```json
{
  "deliveryType": "delivery",
  "address": "Jl. Pemuda No. 45, Surabaya"
}
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "deliveryType": "delivery",
    "estimatedDistanceKm": 4.5,
    "shippingFee": 25000
  }
}
```

---

## 4.2 POST - Checkout Order Baru (DP 50% & Anti Double-Booking)

### 2. Deskripsi Singkat
Memproses pesanan baru dari isi keranjang, menghitung kewajiban DP 50%, dan mengunci tanggal sewa papan.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/checkout`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Header, Parameter & Body Request
* **Header Wajib:** `Idempotency-Key` (String acak unik anti duplikat request).

| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `deliveryType` | String | Wajib | `delivery` atau `pickup` | `"delivery"` |
| `customerName` | String | Wajib | Nama pemesan | `"Budi Santoso"` |
| `waNumber` | String | Wajib | Nomor WA pemesan | `"081234567890"` |
| `recipientName` | String | Wajib | Nama penerima di lokasi | `"Siti Aminah"` |
| `recipientPhone` | String | Wajib | Nomor telepon penerima | `"089517880077"` |
| `deliveryAddress` | String | Wajib | Alamat lengkap pengiriman | `"Jl. Pemuda No. 45, Surabaya"` |
| `notes` | String | Opsional | Pesan instruksi pengiriman | `"Kirim sebelum jam 12 siang"` |

### 7. Contoh Request
```http
POST {{BASE_URL}}/checkout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
Idempotency-Key: checkout-key-sample-12345

{
  "deliveryType": "delivery",
  "customerName": "Budi Santoso",
  "waNumber": "081234567890",
  "recipientName": "Siti Aminah",
  "recipientPhone": "089517880077",
  "deliveryAddress": "Jl. Pemuda No. 45, Surabaya",
  "notes": "Kirim sebelum jam 12 siang"
}
```

### 8. Contoh Response Success
**HTTP Status: `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "ord-20260721-001",
    "invoiceNo": "INV/20260721/001",
    "status": "pending_dp",
    "totalAmount": 525000,
    "dpAmount": 262500,
    "remainingAmount": 262500,
    "dpDueDate": "2026-07-21T09:30:00.000Z",
    "paymentBank": "BCA 1234567890 a/n Seli Florist"
  }
}
```

### 9. Contoh Response Error
**HTTP Status: `400 Bad Request` (Tanggal Sewa Papan Penuh)**
```json
{
  "success": false,
  "message": "Board unit unavailable for date 2026-07-25"
}
```

### 10. Catatan Validasi & Hak Akses
* Membutuhkan header `Idempotency-Key` untuk mencegah pesanan ganda akibat klik berulang.

---

# 📂 MODUL 5: UPLOAD BUKTI BAYAR & PENGELOLAAN PESANAN

---

## 5.1 POST - Upload Bukti Bayar DP 50%

### 2. Deskripsi Singkat
Mengunggah berkas foto/gambar bukti transfer pembayaran DP 50%.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/orders/{{sampleOrderId}}/payment-proof/dp`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request (multipart/form-data)
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `file` | File | Wajib | Berkas gambar transfer (Max 2MB, JPG/PNG) | `bukti_transfer_dp.jpg` |

### 7. Contoh Request (Form Data)
```http
POST {{BASE_URL}}/orders/ord-20260721-001/payment-proof/dp
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

[file: bukti_transfer_dp.jpg]
```

### 8. Contoh Response Success
**HTTP Status: `201 Created`**
```json
{
  "success": true,
  "message": "Bukti pembayaran DP berhasil diunggah. Menunggu verifikasi admin.",
  "data": {
    "orderId": "ord-20260721-001",
    "paymentStatus": "waiting_verification"
  }
}
```

---

## 5.2 DELETE - Tarik Ulang (Retract) Bukti DP

### 2. Deskripsi Singkat
Menarik kembali berkas bukti DP jika customer salah mengunggah foto (hanya dapat dilakukan saat status masih `pending`).

### 3. Method
`DELETE`

### 4. URL
`{{BASE_URL}}/orders/{{sampleOrderId}}/payment-proof/dp`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Path
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Wajib | ID Pesanan | `"ord-20260721-001"` |

### 7. Contoh Request
```http
DELETE {{BASE_URL}}/orders/ord-20260721-001/payment-proof/dp
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "message": "Bukti pembayaran DP telah ditarik kembali.",
  "data": null
}
```

---

## 5.3 POST - Upload Bukti Bayar Pelunasan 50%

### 2. Deskripsi Singkat
Mengunggah bukti transfer pelunasan sisa pembayaran 50%.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/orders/{{sampleOrderId}}/payment-proof/final`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter & Body Request (multipart/form-data)
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `file` | File | Wajib | Berkas gambar pelunasan (Max 2MB) | `bukti_pelunasan.jpg` |

### 7. Contoh Request
```http
POST {{BASE_URL}}/orders/ord-20260721-001/payment-proof/final
Content-Type: multipart/form-data
```

### 8. Contoh Response Success
**HTTP Status: `201 Created`**
```json
{
  "success": true,
  "message": "Bukti pelunasan berhasil diunggah.",
  "data": {
    "orderId": "ord-20260721-001",
    "paymentStatus": "waiting_final_verification"
  }
}
```

---

## 5.4 GET - Lihat Daftar Pesanan Saya

### 2. Deskripsi Singkat
Mengambil riwayat seluruh transaksi pesanan milik customer terautentikasi.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/orders/my?page=1&limit=10`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Query
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Number | Opsional | Halaman pagination | `1` |
| `limit` | Number | Opsional | Jumlah item | `10` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/orders/my?page=1&limit=10
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": [
    {
      "id": "ord-20260721-001",
      "invoiceNo": "INV/20260721/001",
      "status": "pending_dp",
      "totalAmount": 525000,
      "createdAt": "2026-07-21T08:00:00.000Z"
    }
  ]
}
```

---

## 5.5 GET - Lihat Detail Timeline Pesanan

### 2. Deskripsi Singkat
Melihat rincian pesanan lengkap beserta invoice, status verifikasi DP, dan timeline pengerjaan.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/orders/my/{{sampleOrderId}}`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Path
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Wajib | ID Pesanan | `"ord-20260721-001"` |

### 7. Contoh Request
```http
GET {{BASE_URL}}/orders/my/ord-20260721-001
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "data": {
    "id": "ord-20260721-001",
    "invoiceNo": "INV/20260721/001",
    "status": "dp_verified",
    "totalAmount": 525000,
    "dpAmount": 262500,
    "items": [
      { "productName": "Buket Mawar Red", "qty": 1, "price": 250000 }
    ],
    "timeline": [
      { "status": "created", "timestamp": "2026-07-21T08:00:00.000Z" },
      { "status": "dp_verified", "timestamp": "2026-07-21T08:15:00.000Z" }
    ]
  }
}
```

---

## 5.6 POST - Batalkan Pesanan & Hitung Refund Bertingkat

### 2. Deskripsi Singkat
Membatalkan pesanan sendiri dan mendapatkan kalkulasi pengembalian dana (refund) berdasarkan persentase aturan waktu pembatalan.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/orders/my/{{sampleOrderId}}/cancel`

### 5. Authorization
Bearer Token (`Authorization: Bearer <accessToken>`)

### 6. Parameter Path
| Field | Tipe | Wajib/Opsional | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Wajib | ID Pesanan | `"ord-20260721-001"` |

### 7. Contoh Request
```http
POST {{BASE_URL}}/orders/my/ord-20260721-001/cancel
```

### 8. Contoh Response Success
**HTTP Status: `200 OK`**
```json
{
  "success": true,
  "message": "Pesanan berhasil dibatalkan.",
  "data": {
    "orderId": "ord-20260721-001",
    "status": "cancelled_by_customer",
    "refundPercentage": 100,
    "refundAmount": 262500,
    "refundNote": "Pembatalan dilakukan <12 jam dari waktu pemesanan (Refund 100%)."
  }
}
```

---

# 📂 MODUL 6: PENGUIJAN KASUS ERROR & KEAMANAN (TEST SUITES)

---

## 6.1 GET - Uji Error 401 Unauthorized

### 2. Deskripsi Singkat
Memastikan sistem menolak akses pengguna yang mencoba membuka rute privat tanpa menyertakan Header Authorization.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/auth/me`

### 5. Authorization
Tidak Ada (Sengaja Dikosongkan)

### 6. Contoh Request
```http
GET {{BASE_URL}}/auth/me
```

### 7. Contoh Response Error
**HTTP Status: `401 Unauthorized`**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 6.2 POST - Uji Error 400 Bad Request

### 2. Deskripsi Singkat
Memastikan Validation Pipe menolak payload request yang memiliki format email salah dan password terlalu pendek.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/register`

### 5. Authorization
Tidak Ada

### 6. Contoh Request
```json
{
  "email": "bukan-format-email",
  "password": "123"
}
```

### 7. Contoh Response Error
**HTTP Status: `400 Bad Request`**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 10 characters",
    "fullName must be longer than or equal to 2 characters"
  ],
  "error": "Bad Request"
}
```

---

## 6.3 GET - Uji Error 404 Not Found

### 2. Deskripsi Singkat
Memastikan sistem memberikan respons 404 Not Found saat pelanggan mencari produk dengan UUID acak yang tidak ada.

### 3. Method
`GET`

### 4. URL
`{{BASE_URL}}/products/00000000-0000-0000-0000-000000000000`

### 5. Authorization
Tidak Ada

### 6. Contoh Request
```http
GET {{BASE_URL}}/products/00000000-0000-0000-0000-000000000000
```

### 7. Contoh Response Error
**HTTP Status: `404 Not Found`**
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

## 6.4 POST - Uji Error 409 Conflict

### 2. Deskripsi Singkat
Memastikan sistem menolak pendaftaran akun baru yang menggunakan alamat email yang sudah terdaftar sebelumnya.

### 3. Method
`POST`

### 4. URL
`{{BASE_URL}}/auth/register`

### 5. Authorization
Tidak Ada

### 6. Contoh Request
```json
{
  "fullName": "Budi Santoso",
  "email": "budi.santoso@gmail.com",
  "phoneNumber": "081234567890",
  "password": "PasswordKuat123!"
}
```

### 7. Contoh Response Error
**HTTP Status: `409 Conflict`**
```json
{
  "statusCode": 409,
  "message": "Email is already registered",
  "error": "Conflict"
}
```
