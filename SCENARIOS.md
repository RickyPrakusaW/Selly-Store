# 🎭 Panduan Pengujian & Skenario Bisnis E-Commerce Seli Florist

Dokumen ini memandu Anda melakukan pengujian end-to-end (uji fungsional) menggunakan database yang sudah terisi data seeder. Silakan gunakan payload di bawah ini untuk disalin ke Postman Anda.

---

## 📂 DAFTAR AKUN SEEDER UNTUK PENGUJIAN
| Peran (Role) | Email Akun | Password |
| :--- | :--- | :--- |
| **Owner (Super Admin)** | `owner@seliflorist.com` | `PasswordKuat123!` |
| **Staff Verifikasi** | `staff@seliflorist.com` | `PasswordKuat123!` |
| **Customer 1** | `budi.santoso@gmail.com` | `PasswordKuat123!` |
| **Customer 2** | `siti.aminah@gmail.com` | `PasswordKuat123!` |

---

## 🎬 SKENARIO 1: Siklus Sewa Papan Ucapan oleh Customer hingga Selesai

### Langkah 1: Customer Login
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/auth/login`
* **JSON Body:**
  ```json
  {
    "email": "budi.santoso@gmail.com",
    "password": "PasswordKuat123!"
  }
  ```
* *Salin `accessToken` dari hasil respon untuk digunakan pada langkah berikutnya.*

### Langkah 2: Cek Ketersediaan Tanggal Sewa Papan
* **Method:** `GET`
* **URL:** `{{BASE_URL}}/booking/check-availability?date=2026-07-25`
* **Headers:** `Authorization: Bearer <accessToken>`
* **Ekspektasi Respon:** `available: true` dengan jumlah unit papan sewa yang tersisa.

### Langkah 3: Tambah Papan Sewa ke Keranjang Belanja
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/cart/items`
* **Headers:** `Authorization: Bearer <accessToken>`
* **JSON Body:**
  ```json
  {
    "productId": "9c1a2e3b-d4e5-4f6a-8b9c-0a1b2c3d4e5f", 
    "qty": 1,
    "customNote": "Selamat Pernikahan Rian & Sinta. Dari: Rekan Kerja Budi.",
    "bookingDate": "2026-07-25"
  }
  ```
  *(Catatan: Ganti productId dengan UUID produk Kategori Papan Ucapan dari database).*

### Langkah 4: Hitung Estimasi Ongkir
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/checkout/estimate-ongkir`
* **Headers:** `Authorization: Bearer <accessToken>`
* **JSON Body:**
  ```json
  {
    "deliveryType": "delivery",
    "address": "Jl. Kertajaya No. 102, Surabaya"
  }
  ```

### Langkah 5: Checkout & Bayar DP 50%
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/checkout`
* **Headers:** 
  * `Authorization: Bearer <accessToken>`
  * `Idempotency-Key: checkout-budi-20260725`
* **JSON Body:**
  ```json
  {
    "deliveryType": "delivery",
    "customerName": "Budi Santoso",
    "waNumber": "081234567890",
    "recipientName": "Rian (Mempelai)",
    "recipientPhone": "089517880077",
    "deliveryAddress": "Jl. Kertajaya No. 102, Surabaya",
    "notes": "Papan ditaruh di dekat pintu masuk gedung resepsi."
  }
  ```
* *Salin `orderId` dari hasil respon.*

### Langkah 6: Upload Bukti Transfer DP 50%
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/orders/<orderId>/payment-proof/dp`
* **Headers:** `Authorization: Bearer <accessToken>`
* **Body:** form-data (Key: `file` type File, upload gambar struk transfer bank).

### Langkah 7: Staff Verifikasi Menyetujui DP
1. Login sebagai Staff (`staff@seliflorist.com`) untuk mendapatkan `accessToken` Staff.
2. Panggil endpoint verifikasi:
   * **Method:** `POST`
   * **URL:** `{{BASE_URL}}/admin/orders/<orderId>/verify-dp`
   * **Headers:** `Authorization: Bearer <accessToken_staff>`
* **Ekspektasi Respon:** Status pesanan berganti menjadi `pending_final_payment`.

### Langkah 8: Customer Upload Bukti Pelunasan 50%
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/orders/<orderId>/payment-proof/final`
* **Headers:** `Authorization: Bearer <accessToken_budi>`
* **Body:** form-data (Key: `file` type File, upload gambar transfer pelunasan).

### Langkah 9: Staff Menyetujui Pelunasan & Mengunci Unit Papan Ucapan
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/admin/orders/<orderId>/verify-final`
* **Headers:** `Authorization: Bearer <accessToken_staff>`
* **Ekspektasi Respon:** Status pesanan berganti menjadi `fully_paid` dan salah satu unit papan fisik (misal: `PB-001`) dikunci untuk tanggal tersebut.

### Langkah 10: Staff Menyelesaikan Pesanan (Terpasang & Selesai)
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/admin/orders/<orderId>/complete`
* **Headers:** `Authorization: Bearer <accessToken_staff>`
* **Ekspektasi Respon:** Status pesanan berganti menjadi `completed`. Stok unit papan dilepas kembali untuk disewakan pada hari berikutnya.

---

## 🎬 SKENARIO 2: Pembatalan & Refund Bertingkat (Customer Cancel)

Aplikasi memiliki sistem otomatis menghitung refund berdasarkan aturan waktu pembatalan:
* **< 12 jam:** Refund 100% dari dana DP yang telah diverifikasi.
* **12 - 24 jam:** Refund 75% dari dana DP.
* **> 24 jam:** Refund 50% dari dana DP.

### Langkah 1: Customer Meminta Pembatalan Pesanan
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/orders/my/<orderId>/cancel`
* **Headers:** `Authorization: Bearer <accessToken_customer>`
* **JSON Body:**
  ```json
  {
    "reason": "Acara pernikahan dibatalkan/ditunda oleh keluarga."
  }
  ```
* **Ekspektasi Respon:** Respon JSON menampilkan status `refundStatus: "pending_refund"`, persentase potongan refund, dan jumlah dana bersih yang harus dikembalikan oleh toko.

### Langkah 2: Finance Memproses & Mengonfirmasi Refund Selesai ditransfer
1. Login sebagai akun Finance (`finance@seliflorist.com` atau `owner@seliflorist.com`).
2. Panggil endpoint konfirmasi:
   * **Method:** `PUT`
   * **URL:** `{{BASE_URL}}/admin/orders/<orderId>/refund-done`
   * **Headers:** `Authorization: Bearer <accessToken_finance>`
   * **JSON Body:**
     ```json
     {
       "refundNote": "Refund sebesar Rp150.000 telah ditransfer ke Bank Mandiri No. Rekening 12345 a/n Budi Santoso."
     }
     ```
* **Ekspektasi Respon:** Status refund berganti menjadi `refunded` (lunas dikembalikan).

---

## 🎬 SKENARIO 3: Pencegahan Double-Booking Unit Papan Ucapan (Race Condition Guard)

Stok papan ucapan fisik di seeder kita berjumlah **5 unit** (`PB-001` s/d `PB-005`).

### Uji Coba:
1. Daftarkan dan checkout **5 pesanan berbeda** untuk menyewa papan ucapan pada tanggal yang sama, yaitu `2026-07-25`.
2. Saat pesanan ke-6 mencoba melakukan checkout pada tanggal `2026-07-25`:
   * **Ekspektasi Respon:** Sistem akan memblokir checkout dan melempar error **`400 Bad Request`** atau **`409 Conflict`**:
     ```json
     {
       "statusCode": 400,
       "message": "Unit papan ucapan tidak tersedia untuk tanggal 2026-07-25"
     }
     ```
3. Hal ini menjamin toko tidak pernah menerima pesanan melebihi jumlah unit fisik papan ucapan yang dimiliki!

---

## 🎬 SKENARIO 4: Penolakan Pembayaran Palsu & Pemblokiran Akun (Security Guard)

Skenario jika seorang oknum mengunggah struk transfer kosong atau palsu berulang kali.

### Langkah 1: Staff Menolak Bukti Pembayaran
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/admin/orders/<orderId>/reject`
* **Headers:** `Authorization: Bearer <accessToken_staff>`
* **JSON Body:**
  ```json
  {
    "reason": "Bukti transfer berupa foto kosong, bukan struk bank asli."
  }
  ```

### Langkah 2: Efek Sistem Pemblokiran Otomatis (Blacklist)
Begitu Staff mengeksekusi penolakan di atas:
1. Status pesanan langsung diubah menjadi `rejected`.
2. Sisa slot produk dilepaskan kembali ke publik.
3. Email (`budi.santoso@gmail.com`) dan nomor WA (`081234567890`) pelaku **secara otomatis masuk ke daftar Blacklist**.
4. Apabila pelaku mencoba melakukan login atau checkout kembali menggunakan nomor telepon/email tersebut:
   * **Ekspektasi Respon:** Server menolak request dengan status **`403 Forbidden`**:
     ```json
     {
       "statusCode": 403,
       "message": "Proses checkout diblokir untuk akun atau nomor WA ini"
     }
     ```

---

## 🎬 SKENARIO 5: Batal Sepihak Owner akibat Bencana (Force Majeure)

Digunakan apabila terjadi musibah (hujan badai, banjir, huru-hara) yang mengakibatkan pesanan tidak mungkin dikirimkan.

### Langkah 1: Owner Membatalkan Pesanan Secara Paksa
* **Method:** `POST`
* **URL:** `{{BASE_URL}}/admin/orders/<orderId>/force-cancel`
* **Headers:** `Authorization: Bearer <accessToken_owner>`
* **JSON Body:**
  ```json
  {
    "adminCancelNote": "Pembatalan akibat musibah banjir bandang di area rute pengiriman. Toko tutup sementara."
  }
  ```
* **Ekspektasi Respon:** Status pesanan langsung dibatalkan, unit papan dibebaskan, dan sistem menetapkan nilai **refund DP utuh sebesar 100%** tanpa potongan waktu.
