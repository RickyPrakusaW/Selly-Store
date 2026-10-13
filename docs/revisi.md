Konsep kedua ini **lebih konservatif, matang, dan mudah dipelihara** dibandingkan kombinasi ElysiaJS + Bun sebelumnya. Untuk e-commerce buket bunga dan penyewaan produk, **NestJS + Next.js + PostgreSQL + Prisma + Redis** merupakan pilihan yang sangat masuk akal, terutama apabila aplikasinya akan dikembangkan dalam jangka panjang atau dikerjakan oleh tim.

Saya memberi penilaian:

| Aspek                       |      Nilai |
| --------------------------- | ---------: |
| Kematangan ekosistem        |       9/10 |
| Kemudahan maintenance       |       9/10 |
| Keamanan rancangan          |     7,5/10 |
| Kesesuaian untuk e-commerce |       9/10 |
| Kesiapan deployment         |     7,5/10 |
| Kompleksitas pengembangan   |       7/10 |
| Keseluruhan                 | **8,5/10** |

Namun, spesifikasi tersebut masih memiliki beberapa klaim yang perlu dikoreksi dan beberapa komponen penting yang belum dicantumkan.

## 1. Koreksi versi framework dan runtime

Bagian ini:

> Next.js 14+
> Node.js v18+/v20+

perlu diperbarui.

Pada Juli 2026, Next.js sudah berada pada generasi **Next.js 16**, dengan minimum Node.js 20.9. Node.js 18 dan Node.js 20 sendiri sudah berstatus end-of-life; Node.js 22 dan 24 masih berstatus LTS. Untuk proyek baru, pilihan paling aman adalah **Node.js 24 LTS**. ([Next.js][1])

Gunakan spesifikasi:

```text
Runtime:
- Node.js 24 LTS

Frontend:
- Next.js 16.x
- React 19.x
- TypeScript 5.x

Backend:
- NestJS versi stable yang kompatibel dengan Node.js 24
```

Hindari penulisan `14+` karena terlalu longgar. Pada proyek produksi, versi major perlu dikunci agar perubahan breaking tidak masuk tanpa pengawasan.

## 2. TypeScript tidak otomatis mencegah semua null dan undefined

Pernyataan:

> TypeScript memastikan type-safety dan mencegah error null/undefined

perlu diperhalus. TypeScript membantu mendeteksi banyak kesalahan saat kompilasi, tetapi tidak otomatis mencegah:

* data API yang bentuknya tidak sesuai;
* nilai dari database yang nullable;
* environment variable yang tidak tersedia;
* respons pihak ketiga yang berubah;
* input pengguna yang tidak valid;
* penggunaan `any`, type assertion, atau non-null assertion `!`.

Konfigurasi yang direkomendasikan:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

TypeScript harus tetap dikombinasikan dengan:

* `ValidationPipe`;
* DTO;
* validasi environment variable;
* database constraint;
* error handling;
* pengujian otomatis.

Nama bagian pertama juga lebih tepat ditulis **Languages, Markup, and Styling**, karena HTML dan CSS bukan bahasa pemrograman dalam pengertian yang sama dengan TypeScript.

## 3. NestJS + Express sudah tepat

Untuk proyek ini, saya setuju menggunakan NestJS dengan Express.

NestJS memang menggunakan Express sebagai HTTP adapter bawaan dan juga mendukung Fastify. Fastify berpotensi memberikan performa lebih tinggi, tetapi Express memiliki ekosistem middleware yang lebih luas dan umumnya lebih mudah untuk tim yang baru membangun aplikasi production. ([NestJS Documentation][2])

Karena aplikasi florist biasanya lebih banyak dibatasi oleh:

* query database;
* upload gambar;
* payment gateway;
* layanan WhatsApp;
* pengiriman email;
* proses checkout;

maka mengganti Express dengan Fastify belum menjadi prioritas.

Struktur backend sebaiknya modular:

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── inventory/
│   ├── carts/
│   ├── orders/
│   ├── rentals/
│   ├── payments/
│   ├── notifications/
│   ├── deliveries/
│   ├── promotions/
│   └── reviews/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
├── infrastructure/
└── config/
```

Mulailah sebagai **modular monolith**, bukan microservices.

## 4. Arsitektur autentikasi perlu diperjelas

Spesifikasi saat ini mencampurkan dua pola:

```text
httpOnly Cookie
Authorization: Bearer <token>
withCredentials: true
```

Axios tidak dapat membaca token yang berada dalam cookie `HttpOnly`. Karena itu, kamu harus menentukan mekanismenya secara jelas.

### Rekomendasi untuk web dan mobile

Gunakan pola berikut:

```text
Access Token:
- JWT berumur pendek, misalnya 10–15 menit
- Web: disimpan di memory, bukan localStorage
- Mobile: disimpan di secure storage
- Dikirim melalui Authorization Bearer

Refresh Token:
- Web: HttpOnly Secure Cookie
- Mobile: secure storage
- Dirotasi setiap kali refresh
- Session-nya dicatat di database atau Redis
```

Alurnya:

```text
Login
  ↓
Server mengirim access token dalam response body
  ↓
Server memasang refresh token dalam HttpOnly cookie
  ↓
Frontend menyimpan access token di memory
  ↓
Axios interceptor menambahkan Bearer access token
  ↓
Ketika access token kedaluwarsa, panggil /auth/refresh
  ↓
Browser otomatis mengirim refresh cookie
```

Refresh-token rotation penting untuk mengurangi risiko penggunaan ulang token yang dicuri. ([OWASP Cheat Sheet Series][3])

### SameSite Strict perlu dipertimbangkan ulang

`SameSite=Strict` sangat aman, tetapi dapat mengganggu pengguna yang membuka situs dari:

* link WhatsApp;
* email verifikasi;
* Instagram;
* marketplace;
* situs eksternal lainnya.

Dalam mode Strict, browser dapat tidak mengirim cookie ketika pengguna masuk melalui konteks lintas situs. ([OWASP Foundation][4])

Untuk e-commerce, umumnya lebih seimbang menggunakan:

```http
Set-Cookie: refresh_token=...;
HttpOnly;
Secure;
SameSite=Lax;
Path=/api/auth/refresh;
```

Kemudian tambahkan:

* CSRF token untuk operasi sensitif berbasis cookie;
* origin checking;
* CORS allowlist;
* refresh-token rotation;
* pembatasan path cookie.

OWASP juga merekomendasikan penggunaan CSRF token atau custom header pada aplikasi yang mengandalkan autentikasi cookie. ([OWASP Cheat Sheet Series][5])

## 5. Bcrypt 12 rounds cukup, tetapi Argon2id lebih baik

Bcrypt dengan cost factor 12 masih dapat digunakan. Namun, jangan menyatakan bahwa 12 rounds selalu merupakan konfigurasi terbaik untuk semua server. Work factor perlu diuji agar proses login tetap cukup cepat tanpa membuat brute-force menjadi murah.

Untuk proyek baru, saya lebih menyarankan:

```text
Password hashing: Argon2id
```

OWASP saat ini memprioritaskan Argon2id, sedangkan bcrypt lebih diposisikan sebagai pilihan ketika Argon2id tidak tersedia. Untuk bcrypt, OWASP menyarankan work factor minimal 10 dan juga mengingatkan batas input sekitar 72 byte. ([OWASP Cheat Sheet Series][6])

Spesifikasi yang lebih tepat:

```text
Password Hashing:
- Argon2id sebagai pilihan utama
- Bcrypt cost 12 sebagai alternatif
- Password tidak pernah dicatat di log
- Reset token dan OTP disimpan dalam bentuk hash
```

## 6. Helmet bukan perlindungan XSS yang lengkap

Helmet membantu memasang HTTP security headers, tetapi tidak sendirian mencegah seluruh serangan XSS.

Tambahkan:

```text
- Content Security Policy
- Output encoding
- Sanitasi konten HTML
- Pembatasan upload SVG
- Validasi URL eksternal
- HttpOnly cookie
- Dependency scanning
```

Selain authentication, backend juga harus memiliki authorization:

```text
Roles:
- CUSTOMER
- STAFF
- ADMIN
- SUPER_ADMIN

Permissions:
- products.read
- products.create
- products.update
- orders.manage
- rentals.manage
- users.manage
- reports.read
```

Jangan hanya mengandalkan frontend untuk menyembunyikan tombol admin. Setiap endpoint sensitif harus memiliki Guard dan authorization check di backend.

## 7. PostgreSQL dan Prisma merupakan pilihan yang tepat

Prisma cocok dengan NestJS dan PostgreSQL serta menyediakan type-safe database client, migrations, dan visual data editor. Prisma juga mempunyai panduan resmi integrasi NestJS. ([Prisma][7])

Namun, kalimat:

> skema migrasi otomatis

perlu diperbaiki. Migrasi production tidak seharusnya berjalan otomatis setiap aplikasi dinyalakan.

Gunakan:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

Pipeline production:

```text
Backup database
  ↓
Run migration
  ↓
Deploy backend
  ↓
Health check
  ↓
Smoke test
```

Untuk production, database jangan lagi disebut:

```text
localhost:5432/florist_db
```

Gunakan environment variable:

```env
DATABASE_URL=
DIRECT_DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
EMAIL_SMTP_PASSWORD=
WHATSAPP_API_TOKEN=
```

Alamat email, nomor WhatsApp, API token, dan kredensial SMTP tidak perlu dicantumkan langsung dalam spesifikasi publik atau source code.

## 8. Database rental harus dirancang berbeda dari penjualan

Ini bagian terpenting dari aplikasi kamu.

Jangan menyamakan produk jual dan produk sewa hanya dengan kolom:

```text
product.type = SALE | RENT
```

Minimal gunakan struktur:

```text
products
product_variants
inventory_items

rental_products
rental_units
rental_bookings
rental_booking_items
rental_returns
rental_inspections
rental_damages
rental_deposits
rental_penalties
```

Contoh:

```text
Rental Product:
Papan Bunga Premium

Physical Units:
PB-001
PB-002
PB-003
```

Setiap unit harus memiliki status:

```text
AVAILABLE
RESERVED
RENTED
CLEANING
MAINTENANCE
DAMAGED
LOST
RETIRED
```

### Pencegahan double booking

Jangan hanya memeriksa tanggal di aplikasi. Perlindungan harus dilakukan pada level database dan transaction.

Aturan bentrok:

```text
requestedStart < existingEnd
AND
requestedEnd > existingStart
```

Gunakan:

* database transaction;
* temporary reservation;
* expiration time;
* idempotency key;
* PostgreSQL exclusion constraint jika memungkinkan.

Prisma mungkin memerlukan raw SQL migration untuk membuat constraint PostgreSQL tertentu yang tidak tersedia langsung dalam Prisma Schema.

## 9. Redis sudah tepat, tetapi fungsinya perlu dibatasi

Redis cocok untuk:

```text
- OTP dengan TTL
- Rate-limiting counter
- Temporary rental hold
- Session metadata
- Refresh-token session
- Idempotency key
- Cache produk populer
- Distributed lock tertentu
```

Saya tidak menyarankan memasukkan setiap access token ke blacklist. Lebih sederhana:

```text
Access token:
- Berumur pendek
- Tidak disimpan di Redis

Refresh session:
- Disimpan di database atau Redis
- Bisa dicabut
- Memiliki session ID atau jti
```

Redis tidak boleh menjadi sumber data permanen untuk order, pembayaran, dan rental. Data tersebut tetap harus berada di PostgreSQL.

## 10. SSR tidak menjamin tampil nomor satu di Google

Kalimat:

> SSR untuk memastikan toko bunga tampil #1 di Google Search

harus diubah.

SSR membantu crawler memperoleh HTML yang sudah berisi konten, tetapi tidak menjamin peringkat pertama. Google menjelaskan bahwa crawling, rendering, indexing, kualitas konten, relevansi, canonical URL, struktur situs, dan faktor lainnya tetap menentukan performa pencarian. ([Google for Developers][8])

Kalimat yang lebih akurat:

> SSR, static rendering, dan metadata terstruktur digunakan untuk meningkatkan crawlability, indexability, performa halaman, dan kualitas tampilan hasil pencarian.

Strategi rendering yang saya sarankan:

```text
Homepage                 → Static/ISR
Category pages           → Static/ISR
Product detail           → Static/ISR
Article/blog             → Static/ISR
Search results           → Dynamic
Cart                     → Client/private
Checkout                 → Dynamic/private
Customer dashboard       → Dynamic/private
Admin dashboard          → Dynamic/private
```

Tambahkan:

* `Product` JSON-LD;
* `LocalBusiness` JSON-LD;
* `BreadcrumbList`;
* sitemap XML;
* canonical URL;
* robots.txt;
* metadata Open Graph;
* descriptive image alt text;
* Google Merchant Center feed;
* URL produk yang stabil.

Google juga memperingatkan bahwa data harga dan ketersediaan produk yang hanya dibuat secara dinamis melalui JavaScript dapat kurang konsisten untuk proses Shopping crawl. ([Google for Developers][9])

## 11. Data fetching sebaiknya tidak seluruhnya melalui Axios

Untuk Next.js App Router:

```text
Server Components:
- Native fetch
- Pemanggilan API server-side
- Caching/revalidation

Client Components:
- TanStack Query
- Axios atau typed fetch client

Global UI State:
- Zustand
```

Rekomendasi pembagian:

```text
TanStack Query:
- product search
- wishlist
- cart synchronization
- order status
- rental availability

Zustand:
- cart sementara
- UI filter
- drawer/modal state
- checkout progress

React Context:
- theme
- dependency ringan
```

Jangan menaruh seluruh data bisnis di Zustand. Setelah user login, keranjang sebaiknya disinkronkan ke database agar tetap tersedia pada perangkat lain.

## 12. Email dan WhatsApp jangan dikirim langsung dalam request checkout

Nodemailer dan WhatsApp gateway dapat digunakan, tetapi prosesnya jangan seperti:

```text
Create order
  ↓
Tunggu email terkirim
  ↓
Tunggu WhatsApp terkirim
  ↓
Kirim response ke user
```

Gunakan:

```text
Create order transaction
  ↓
Commit database
  ↓
Masukkan notification job ke queue
  ↓
Response ke user
  ↓
Worker mengirim email dan WhatsApp
```

Tambahkan:

* retry dengan exponential backoff;
* timeout;
* idempotency;
* status pengiriman;
* dead-letter mechanism;
* template versioning;
* masking data sensitif di log.

Untuk production, SMTP akun Gmail personal sebaiknya tidak dijadikan fondasi utama. Lebih baik memakai domain toko dan layanan transactional email agar deliverability, audit, dan pengelolaan kredensial lebih baik.

## 13. Testing perlu ditambah frontend E2E

Jest dan Supertest sudah tepat untuk NestJS. Postman bagus untuk pengujian manual, tetapi bukan pengganti automated test.

Gunakan:

```text
Backend:
- Jest
- Supertest
- Integration test dengan test database

Frontend:
- Vitest atau Jest
- React Testing Library
- Playwright

API manual:
- Postman

Load test:
- Grafana k6
```

Flow Playwright yang wajib:

```text
- Registrasi dan login
- Verifikasi email/OTP
- Menambahkan produk ke keranjang
- Checkout penjualan
- Memilih tanggal rental
- Pencegahan double booking
- Pembayaran berhasil
- Pembayaran kedaluwarsa
- Pembatalan dan pengembalian
- Admin memperbarui status pesanan
```

## 14. Deployment perlu dibuat lebih konsisten

Vercel untuk Next.js dan VPS/Railway/Render untuk NestJS dapat digunakan, tetapi perhatikan cross-origin authentication.

Gunakan struktur domain:

```text
www.namatoko.com
api.namatoko.com
cdn.namatoko.com
```

Konfigurasi backend:

```text
CORS origin:
https://www.namatoko.com

Credentials:
true

Allowed methods:
GET, POST, PUT, PATCH, DELETE

Allowed headers:
Content-Type, Authorization, X-CSRF-Token
```

Pastikan backend, database, dan Redis berada di region yang sama agar latency rendah.

Docker Compose cocok untuk local development:

```text
services:
- postgres
- redis
- api
- web
- worker
```

Untuk production:

```text
- Vercel: Next.js
- Managed container/VPS: NestJS API dan worker
- Managed PostgreSQL
- Managed Redis
- Cloudflare R2: media
- Cloudflare: DNS, CDN, WAF, dan rate limiting
```

## 15. Observability jangan dihilangkan sepenuhnya

Dibandingkan rancangan sebelumnya, konsep baru belum mencantumkan logging dan monitoring.

Minimal gunakan:

```text
Logging:
- nestjs-pino atau Pino
- Structured JSON log
- Request ID
- User ID dan order ID yang dimasking

Monitoring:
- Health endpoint
- Uptime monitoring
- Error tracking
- CPU, memory, request duration
- Database connection monitoring

Tracing, tahap lanjutan:
- OpenTelemetry
- Grafana/Tempo
```

Log sebaiknya memuat:

```json
{
  "requestId": "req_xxx",
  "module": "orders",
  "action": "order.created",
  "orderId": "ord_xxx",
  "durationMs": 123,
  "statusCode": 201
}
```

Jangan mencatat password, OTP, JWT utuh, alamat lengkap, API key, atau informasi pembayaran.

## Rekomendasi final stack

```text
LANGUAGE
- TypeScript 5.x dengan strict mode
- SQL PostgreSQL
- HTML5
- CSS3

WEB FRONTEND
- Next.js 16
- React 19
- Tailwind CSS
- Lucide React
- TanStack Query
- Zustand
- React Hook Form

BACKEND
- NestJS
- Express adapter
- REST API
- Swagger/OpenAPI
- Class Validator
- Class Transformer
- Helmet
- Throttler
- Pino logger

AUTHENTICATION
- JWT access token berumur pendek
- Rotating refresh token
- HttpOnly Secure SameSite=Lax cookie untuk web
- Secure storage untuk mobile
- Argon2id
- CSRF protection
- RBAC/permission guard

DATABASE
- PostgreSQL
- Prisma ORM
- Prisma Migrate
- Redis

BACKGROUND PROCESSING
- Queue dan worker
- Email notification
- WhatsApp notification
- Expired order processing
- Rental reminder

TESTING
- Jest
- Supertest
- Playwright
- Postman
- Grafana k6

INFRASTRUCTURE
- Docker
- Docker Compose
- GitHub Actions
- Vercel
- Managed NestJS hosting
- Managed PostgreSQL
- Managed Redis
- Cloudflare R2
- Cloudflare CDN/WAF

OBSERVABILITY
- Pino
- Health checks
- Error tracking
- OpenTelemetry pada tahap lanjutan
```

## Kesimpulan

Konsep ini **lebih cocok untuk bisnis nyata dan maintenance jangka panjang** daripada stack ElysiaJS + Bun sebelumnya. NestJS, Prisma, dan PostgreSQL akan membuat struktur proyek lebih disiplin, sedangkan Next.js sangat cocok untuk storefront dan SEO.

Perbaikan yang paling mendesak adalah:

1. mengganti Node.js 18/20 menjadi Node.js 24 LTS;
2. menggunakan Next.js 16, bukan sekadar “14+”;
3. memperjelas penyimpanan access dan refresh token;
4. mempertimbangkan `SameSite=Lax`, bukan selalu Strict;
5. menggunakan Argon2id atau mengevaluasi cost bcrypt;
6. menambahkan CSRF, RBAC, queue, worker, dan observability;
7. membuat proteksi double booking di level database;
8. menghapus kredensial, alamat email, dan nomor WhatsApp dari spesifikasi publik;
9. mengoreksi klaim bahwa SSR menjamin posisi pertama di Google.

Setelah koreksi tersebut, rancangan ini dapat dinilai sekitar **9/10 untuk aplikasi florist e-commerce dan rental berskala kecil sampai menengah**.

[1]: https://nextjs.org/docs/app/guides/upgrading/version-16?utm_source=chatgpt.com "Upgrading: Version 16 | Next.js"
[2]: https://docs.nestjs.com/techniques/performance?utm_source=chatgpt.com "Performance (Fastify) | NestJS - A progressive Node.js framework"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html?utm_source=chatgpt.com "OAuth2 - OWASP Cheat Sheet Series"
[4]: https://owasp.org/www-community/SameSite?utm_source=chatgpt.com "SameSite - OWASP Foundation"
[5]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com "Cross-Site Request Forgery Prevention Cheat Sheet - OWASP"
[6]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html?utm_source=chatgpt.com "Password Storage - OWASP Cheat Sheet Series"
[7]: https://www.prisma.io/docs/orm?utm_source=chatgpt.com "What is Prisma ORM? (Overview) | Prisma Documentation"
[8]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?utm_source=chatgpt.com "Understand JavaScript SEO Basics | Google Search Central ..."
[9]: https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?utm_source=chatgpt.com "Generate Structured Data with JavaScript | Google Search Central ..."
