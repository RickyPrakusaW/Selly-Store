# CLAUDE.md — Florist, Kado & Papan Ucapan Rental E-Commerce Platform

> Dokumen ini menjadi instruksi utama bagi Claude Code untuk membangun platform e-commerce florist berbasis **Next.js + NestJS + PostgreSQL**. Seluruh implementasi wajib mengutamakan keamanan, konsistensi transaksi, pencegahan race condition, auditability, pengalaman mobile-first, serta maintainability jangka panjang.
>
> **Baseline teknis dokumen:** 20 Juli 2026. Gunakan versi patch stabil terbaru dalam major version yang ditentukan, lalu kunci versi melalui lockfile. Jangan melakukan upgrade major tanpa migration plan dan regression test.

---

## 1. Project Overview

- **Nama proyek**: Florist, Kado & Papan Ucapan Rental E-Commerce Platform
- **Arsitektur**: Modular monolith dalam monorepo
- **Frontend utama**: Next.js web, mobile-first
- **Backend utama**: NestJS REST API
- **Database utama**: PostgreSQL
- **Deskripsi**: Platform untuk menjual buket bunga dan kado, serta menyewakan unit papan ucapan. Pengunjung dapat melihat katalog tanpa login, tetapi wajib register, login, dan memverifikasi email sebelum checkout, booking, atau mengunggah bukti pembayaran.
- **Fitur utama**:
  - Katalog produk publik dan SEO-friendly
  - Keranjang persistent dan offline-resilient
  - Penjualan barang ready stock dan pre-order
  - Penyewaan unit papan ucapan dengan pencegahan double booking
  - Pembayaran manual dua tahap: DP 50% dan pelunasan
  - Upload, retract, dan verifikasi bukti pembayaran
  - Delivery atau pickup
  - Kalkulasi ongkir server-side
  - Notifikasi email, WhatsApp, dan WebSocket
  - Dashboard admin, keuangan, audit log, dan laporan
- **Target pengguna**:
  - Customer
  - Staff verifikasi
  - Finance
  - Owner
- **Versi produk**: `v1.0.0`
- **Status**: Active development

---

## 2. Keputusan Bisnis dan Arsitektur yang Tidak Boleh Diubah Sembarangan

> Keputusan di bawah dianggap final. Perubahan hanya boleh dilakukan setelah mendapat persetujuan owner dan dicatat dalam Architecture Decision Record atau ADR.

| # | Keputusan | Pilihan final | Catatan implementasi |
|---|---|---|---|
| 1 | Campuran kategori dalam satu order | **Boleh** | Satu order dapat berisi bunga, kado, dan papan ucapan. |
| 2 | Pemicu reservation/soft-lock | **Saat `POST /api/checkout` berhasil** | Tidak ada lock ketika item baru dimasukkan ke keranjang. |
| 3 | Pembayaran | **DP 50% + pelunasan 50%** | Nominal dihitung server-side dari snapshot harga. |
| 4 | Deadline DP | **2 jam** | `DP_DEADLINE_HOURS=2`. |
| 5 | Durasi soft-lock papan | **Sama dengan deadline DP** | `hold_expires_at = dp_deadline`, bukan 15 menit. |
| 6 | Setelah DP disetujui | Booking berubah menjadi **`reserved`** | Booking tidak boleh kedaluwarsa saat customer menunggu pelunasan. |
| 7 | Setelah pelunasan disetujui | Booking berubah menjadi **`confirmed`** | Dipertahankan sampai order selesai atau dibatalkan. |
| 8 | Pemilihan unit papan | **Otomatis oleh sistem** | Pilih unit aktif dan tersedia; admin boleh reassign dengan audit log. |
| 9 | Pengiriman | **`delivery` atau `pickup`** | Pickup tidak memanggil API rute dan ongkir bernilai 0. |
| 10 | Refund pembatalan customer | **Bertingkat** | <12 jam: 100%; 12–24 jam: 75%; >24 jam: 50% dari DP. |
| 11 | Refund pembatalan toko | **100%** | Berlaku untuk force majeure atau kesalahan toko. |
| 12 | Proses refund | **Manual oleh admin** | Sistem mencatat nominal, status, bukti, dan audit trail. |
| 13 | Bukti bayar salah | **Boleh retract dan upload ulang** | Hanya selama bukti masih `pending`. |
| 14 | Payment gateway | **Belum digunakan pada v1** | Pembayaran diverifikasi manual oleh staff. |
| 15 | Arsitektur layanan | **Modular monolith** | Jangan membuat microservices pada fase awal. |
| 16 | Frontend | **Next.js web mobile-first** | Flutter Web tidak digunakan dalam baseline ini. |
| 17 | API style | **REST + OpenAPI** | GraphQL tidak diperlukan untuk v1. |

---

## 3. Prinsip Arsitektur

1. **PostgreSQL adalah source of truth** untuk order, pembayaran, stok, booking, refund, dan laporan.
2. **Redis bukan penyimpanan permanen**. Redis hanya untuk cache, rate limit, session metadata, idempotency, queue, dan distributed coordination.
3. **Semua harga, stok, ongkir, DP, refund, HPP, dan laba dihitung di backend**.
4. **Frontend tidak boleh dipercaya** untuk nominal, role, status transaksi, ketersediaan stok, atau ketersediaan rental.
5. **Business logic berada di Service atau domain layer**, bukan di Controller.
6. **Semua perubahan state penting harus transactional dan auditable**.
7. **Notifikasi tidak boleh menghambat transaksi utama**. Email dan WhatsApp dikirim melalui queue/worker setelah transaction commit.
8. **Concurrency control wajib berada di database**, bukan hanya pada pemeriksaan aplikasi.
9. **Endpoint mutasi kritis wajib mendukung idempotency**.
10. **Jangan melakukan premature microservices atau premature infrastructure complexity**.

---

## 4. Final Technical Stack

### 4.1 Languages, Runtime, and Standards

- **Node.js**: `24 LTS`
- **TypeScript**: `5.x`, strict mode
- **SQL**: PostgreSQL dialect
- **HTML5**: Semantic markup
- **CSS**: Tailwind CSS
- **Package manager**: npm
- **Workspace**: npm workspaces
- **Optional build orchestration**: Turborepo

### 4.2 Frontend Web

- **Framework**: Next.js `16.x`
- **UI runtime**: React `19.x`
- **Routing**: App Router
- **Rendering strategy**:
  - Static rendering/ISR untuk homepage, kategori, artikel, dan detail produk
  - Dynamic rendering untuk checkout, customer dashboard, dan admin dashboard
  - Client rendering hanya untuk interaksi yang memang membutuhkan browser state
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Server data**: Native `fetch` pada Server Components
- **Client server-state**: TanStack Query
- **UI/global client-state**: Zustand
- **Forms**: React Hook Form
- **Validation schema frontend**: Zod untuk UX; backend tetap menjadi validator final
- **Offline storage**: IndexedDB
- **SEO**:
  - Metadata API
  - Open Graph
  - Sitemap
  - Canonical URL
  - `Product`, `LocalBusiness`, dan `BreadcrumbList` JSON-LD

> SSR atau ISR membantu crawlability dan indexability, tetapi tidak menjamin peringkat pertama di Google.

### 4.3 Backend API

- **Framework**: NestJS stable release yang kompatibel dengan Node.js 24
- **HTTP adapter**: Express
- **API prefix**: `/api`
- **API versioning**: URI versioning ketika dibutuhkan, misalnya `/api/v1`
- **API documentation**: Swagger/OpenAPI
- **Validation**: `class-validator` + `class-transformer`
- **Configuration**: `@nestjs/config` + environment schema validation
- **Security headers**: Helmet
- **Rate limiting**: `@nestjs/throttler`, dengan Redis-backed storage di production
- **Logging**: Pino melalui `nestjs-pino`
- **WebSocket**: Socket.IO melalui `@nestjs/websockets`
- **Scheduled jobs**: `@nestjs/schedule`
- **Queue and workers**: BullMQ
- **File upload**: Multer + magic-byte validation
- **Export XLSX**: ExcelJS

### 4.4 Database, ORM, and Cache

- **Database**: PostgreSQL `16+`
- **Production database**: Managed PostgreSQL pada region yang sama dengan API
- **ORM**: Prisma ORM
- **Migration**: Prisma Migrate
- **Database GUI**: Prisma Studio dan pgAdmin untuk development
- **Cache/session/queue**: Redis managed di production
- **Money representation**: PostgreSQL `NUMERIC(18,0)` atau Prisma `Decimal`; dilarang menggunakan floating-point untuk uang

### 4.5 Authentication and Security

- **Access token**: JWT berumur pendek, default 15 menit
- **Refresh token**: 30 hari, rotating token
- **Password hashing**: Argon2id
- **Refresh token storage**:
  - Web: `HttpOnly`, `Secure`, `SameSite=Lax` cookie
  - Database/Redis: simpan hash token/session identifier, bukan raw token
- **CSRF protection**:
  - Origin/Referer validation
  - Custom CSRF header atau double-submit token untuk endpoint berbasis cookie
- **Authorization**: RBAC + permission guard
- **Admin authentication**: audience/issuer dan session namespace terpisah dari customer

### 4.6 Integrations

- **Email**: Provider abstraction berbasis SMTP/API transactional email
- **WhatsApp**: Provider abstraction; Fonnte dapat menjadi provider awal
- **Route calculation**: Google Maps Routes API `Compute Route Matrix`
- **Storage**: Cloudflare R2, S3-compatible
- **CDN/WAF**: Cloudflare

### 4.7 Testing and Quality

- **Backend unit/integration**: Jest
- **Backend HTTP E2E**: Supertest
- **Frontend component**: React Testing Library
- **Frontend E2E**: Playwright
- **Load and stress testing**: Grafana k6
- **Manual API exploration**: Postman
- **Static quality**: ESLint, Prettier, TypeScript type-check

### 4.8 Observability

#### MVP

- Pino structured JSON logs
- Correlation/request ID
- Health checks
- Uptime monitor
- Error tracking
- Database and Redis health monitoring

#### Scale-up phase

- OpenTelemetry
- Grafana Alloy
- Loki
- Tempo
- Prometheus atau Grafana Cloud Metrics
- Grafana dashboards and alerts

### 4.9 Infrastructure and Deployment

- **Frontend**: Vercel atau compatible Next.js Node deployment
- **Backend API**: Managed container, Railway, Render, Fly.io, atau VPS
- **Worker**: Process/container terpisah dari API
- **Database**: Managed PostgreSQL
- **Redis**: Managed Redis
- **Object storage**: Cloudflare R2
- **Containerization**: Docker dan Docker Compose
- **CI/CD**: GitHub Actions
- **DNS/CDN/WAF**: Cloudflare

---

## 5. Monorepo Structure

```text
[root]/
├── apps/
│   ├── web/                         # Next.js 16 storefront + customer/admin dashboard
│   │   ├── src/app/
│   │   ├── src/components/
│   │   ├── src/features/
│   │   ├── src/lib/
│   │   ├── src/stores/
│   │   └── src/types/
│   ├── api/                         # NestJS REST API
│   │   ├── src/modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── catalog/
│   │   │   ├── inventory/
│   │   │   ├── cart/
│   │   │   ├── rental/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── refunds/
│   │   │   ├── deliveries/
│   │   │   ├── notifications/
│   │   │   ├── finance/
│   │   │   ├── reports/
│   │   │   ├── blacklist/
│   │   │   └── admin/
│   │   ├── src/common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── middleware/
│   │   │   └── pipes/
│   │   ├── src/infrastructure/
│   │   │   ├── database/
│   │   │   ├── redis/
│   │   │   ├── storage/
│   │   │   ├── email/
│   │   │   ├── whatsapp/
│   │   │   └── maps/
│   │   ├── src/main.ts
│   │   └── src/app.module.ts
│   └── worker/                      # BullMQ processors and scheduled safety jobs
│       └── src/
├── packages/
│   ├── contracts/                   # Shared API contract types; no Prisma entities
│   ├── validation/                  # Shared safe validation helpers
│   ├── config/                      # Shared lint/build/TS config
│   ├── logger/                      # Pino configuration
│   └── observability/               # OpenTelemetry setup when enabled
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docker/
├── .github/workflows/
├── package.json
├── package-lock.json
├── turbo.json
└── CLAUDE.md
```

### Struktur module NestJS

```text
modules/orders/
├── dto/
├── entities/                        # Domain-facing types, not Prisma re-exports
├── orders.controller.ts
├── orders.service.ts
├── orders.repository.ts             # Optional abstraction when query complexity grows
├── orders.policy.ts                 # Authorization/business policy
├── orders.events.ts
├── orders.module.ts
└── __tests__/
```

### Aturan struktur

- Controller hanya menangani transport concern.
- Service menangani use case dan business rules.
- Prisma query tidak boleh tersebar acak di Controller.
- Shared API types tidak boleh langsung mengekspor Prisma model ke frontend.
- Worker tidak boleh menerima HTTP traffic publik.
- Satu codebase boleh memiliki API dan worker sebagai proses deployment terpisah.

---

## 6. Required Scripts and Commands

```bash
# Install
npm ci

# Development
npm run dev
npm run dev:web
npm run dev:api
npm run dev:worker

# Quality
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run test:load

# Build
npm run build
npm run build:web
npm run build:api
npm run build:worker

# Prisma
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
npx prisma studio
npx prisma db seed

# Docker local infrastructure
docker compose up -d postgres redis

docker compose down
```

### Migration rules

- Development: `prisma migrate dev`
- Production: `prisma migrate deploy`
- Jangan menjalankan `migrate dev` di production.
- Jangan menjalankan destructive migration tanpa backup dan migration plan.
- Raw SQL migration diperbolehkan hanya untuk kemampuan PostgreSQL yang belum diekspresikan Prisma, seperti partial index, exclusion constraint, extension, atau trigger yang benar-benar diperlukan.

---

## 7. TypeScript and Code Standards

### 7.1 Required `tsconfig` principles

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true
  }
}
```

### 7.2 Naming conventions

```text
Controllers        kebab-case       payment-proof.controller.ts
Services           kebab-case       checkout.service.ts
DTO classes        PascalCase       CreateOrderDto
Prisma models      PascalCase       RentalBooking
Database tables    snake_case       rental_bookings
Variables          camelCase        dpDeadline
Constants          UPPER_SNAKE      DP_DEADLINE_HOURS
Branches           feat/* fix/* chore/* refactor/*
Events             dot notation     payment.proof.submitted
Queue jobs         dot notation     notification.email.send
```

### 7.3 General coding rules

- Jangan menggunakan `any` tanpa alasan tertulis.
- Gunakan `unknown` untuk error atau payload eksternal, lalu validasi.
- Jangan menggunakan non-null assertion `!` kecuali invariant sudah dibuktikan.
- Jangan membuat utility generik berlebihan sebelum ada minimal dua use case nyata.
- Jangan menelan exception.
- Gunakan global exception filter untuk response konsisten.
- Gunakan domain-specific exceptions untuk conflict, stock shortage, dan booking conflict.
- Semua waktu disimpan dalam UTC menggunakan `timestamptz`.
- Tanggal rental yang bersifat kalender bisnis harus dinormalisasi terhadap timezone toko.
- Semua nominal uang harus menggunakan Decimal/integer representation, bukan `number` floating-point untuk kalkulasi.
- Semua endpoint list wajib paginated.
- Gunakan cursor pagination untuk dataset besar; page/limit boleh untuk dashboard kecil.

---

## 8. HTTP and API Contract

### 8.1 Standard response

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ],
  "requestId": "req_xxx"
}
```

### 8.2 HTTP status

| Status | Penggunaan |
|---|---|
| 200 | Read/update berhasil |
| 201 | Resource berhasil dibuat |
| 202 | Job asynchronous diterima |
| 204 | Delete/retract berhasil tanpa body |
| 400 | Payload/format tidak valid |
| 401 | Tidak terautentikasi atau token invalid/expired |
| 403 | Terautentikasi tetapi tidak memiliki izin, belum verifikasi, atau diblokir |
| 404 | Resource tidak ditemukan |
| 409 | Conflict: stok, booking, state transition, idempotency mismatch |
| 413 | File terlalu besar |
| 415 | Tipe file tidak didukung |
| 422 | Business validation tidak dapat diproses bila kebijakan API memilih status ini |
| 429 | Rate limit |
| 500 | Unexpected server error |
| 503 | Dependency penting tidak tersedia |

### 8.3 API rules

- Semua mutasi checkout dan pembayaran wajib menerima `Idempotency-Key`.
- Jangan menerima `userId`, `role`, `price`, `cost`, `subtotal`, `dpAmount`, atau `refundAmount` sebagai sumber kebenaran dari client.
- Gunakan OpenAPI schema dan generated/typed client bila praktis.
- Jangan expose internal Prisma errors ke client.
- Semua response error menyertakan `requestId`, tetapi tidak menyertakan stack trace di production.

---

## 9. Authentication and Session Design

### 9.1 Customer login flow

1. Customer mengirim email dan password.
2. Backend memverifikasi hash Argon2id.
3. Backend membuat access token berumur 15 menit.
4. Backend membuat refresh session dengan random opaque identifier atau JWT ber-`jti` unik.
5. Raw refresh token hanya dikirim melalui cookie; database/Redis hanya menyimpan hash atau session identifier.
6. Frontend menyimpan access token di memory, bukan `localStorage`.
7. Saat halaman reload, frontend memanggil `/api/auth/refresh` untuk memperoleh access token baru.
8. Setiap refresh melakukan token rotation dan mencabut token lama.
9. Reuse token lama setelah rotation dianggap indikasi pencurian session dan seluruh token family dicabut.

### 9.2 Cookie policy

```text
HttpOnly: true
Secure: true in production
SameSite: Lax
Path: /api/auth/refresh
MaxAge: 30 days
```

- Jangan menggunakan `SameSite=Strict` sebagai default karena dapat mengganggu alur dari email atau WhatsApp.
- Endpoint refresh wajib melakukan Origin/Referer validation dan CSRF protection.
- Cookie domain hanya diperluas ke parent domain jika benar-benar diperlukan.

### 9.3 Access token claims

```json
{
  "sub": "user_uuid",
  "sid": "session_uuid",
  "role": "customer",
  "iss": "florist-api",
  "aud": "florist-web",
  "iat": 0,
  "exp": 0
}
```

### 9.4 Admin authentication

- Admin menggunakan endpoint dan audience berbeda.
- Admin session tidak boleh dipakai untuk customer endpoints dan sebaliknya.
- Role:
  - `owner`
  - `finance`
  - `staff_verification`
- Permission examples:
  - `products.read`
  - `products.write`
  - `orders.read`
  - `orders.verify_payment`
  - `orders.cancel`
  - `refunds.process`
  - `finance.read`
  - `finance.write`
  - `reports.export`
  - `staff.manage`
- Owner account wajib mendukung MFA pada fase production hardening.

### 9.5 Password and verification security

- Gunakan Argon2id.
- Jangan menerapkan aturan password berbasis kombinasi karakter yang berlebihan.
- Minimum panjang password disesuaikan threat model; utamakan passphrase dan breached-password checking.
- Verification token, reset token, OTP, dan refresh token wajib disimpan dalam bentuk hash.
- OTP memiliki TTL dan attempt limit.
- Password, token, OTP, dan cookie tidak pernah dicatat di log.

---

## 10. Security Requirements

### 10.1 Global controls

- Helmet dengan Content Security Policy yang diuji.
- CORS allowlist; tidak pernah `origin: *` bersama credentials.
- HSTS di production.
- Rate limit per IP, endpoint, dan account identifier.
- Request body size limit.
- URL and redirect allowlist.
- Dependency scanning dan lockfile review.
- Secret scanning pada CI.
- No secrets in source control.
- Database user menggunakan least privilege.
- Object storage bucket private; gunakan signed URL bila perlu.
- Admin endpoints tidak boleh terindeks mesin pencari.

### 10.2 Authorization

- Semua admin endpoint memiliki authentication guard dan permission guard.
- Ownership check wajib untuk customer order, payment proof, address, dan refund.
- Menyembunyikan tombol frontend bukan authorization.
- Setiap perubahan status harus melewati state transition policy.

### 10.3 File upload

- Validasi extension, MIME type, dan magic bytes.
- Decode image untuk memastikan file valid.
- Reject polyglot atau malformed image jika terdeteksi.
- Maximum default 2 MB, dapat dikonfigurasi.
- Nama object menggunakan UUID/random key.
- Jangan gunakan original filename sebagai object key.
- Jangan izinkan SVG untuk bukti pembayaran.
- Metadata sensitif seperti EXIF sebaiknya dihapus.
- Signed access URL memiliki expiry pendek.
- File lama yang diretract dihapus secara asynchronous setelah metadata audit tersimpan.

### 10.4 WebSocket

- Socket wajib diautentikasi.
- Admin bergabung ke room berdasarkan role/permission.
- Jangan menerima perubahan order melalui event socket tanpa authorization yang sama dengan REST.
- Event hanya membawa data minimal; client fetch detail melalui API.

---

## 11. Frontend Architecture

### 11.1 Rendering strategy

| Halaman | Strategi |
|---|---|
| Homepage | Static/ISR |
| Category | Static/ISR |
| Product detail | Static/ISR |
| Search | Dynamic |
| Cart | Client-enhanced |
| Checkout | Dynamic/private |
| Customer dashboard | Dynamic/private |
| Admin dashboard | Dynamic/private |
| Blog/article | Static/ISR |

### 11.2 State ownership

- **Server Components/native fetch**:
  - public catalog
  - categories
  - product detail
  - SEO metadata
- **TanStack Query**:
  - cart synchronization
  - rental availability
  - order status
  - payment proof state
  - dashboard data
- **Zustand**:
  - modal/drawer state
  - checkout wizard state
  - local optimistic cart view
  - filters not suitable for URL state
- **URL search params**:
  - search
  - category
  - sort
  - pagination
- **IndexedDB**:
  - pending offline cart commands
  - non-sensitive cached cart view
- **Never store in localStorage/IndexedDB**:
  - access token
  - refresh token
  - password
  - OTP

### 11.3 Visual baseline

```text
Primary Pink : #A94065
Deep Rose    : #880E4F
Soft Blush   : #FFF0F4
Off White    : #FFF7F9
```

- Mobile-first
- Accessible color contrast
- Keyboard navigation
- Semantic forms
- Visible focus state
- Rounded cards boleh digunakan, tetapi glassmorphism tidak boleh mengorbankan readability
- Mobile bottom navigation hanya untuk item utama
- Desktop sticky header dengan cart counter

---

## 12. Backend Modules and Responsibilities

```text
auth             register, verify email, login, refresh, logout, sessions, password reset
users            customer profile and address book
catalog          products, categories, variants, public catalog
inventory        stock, reservations, adjustments, rental units
cart             persistent cart and offline sync
rental           availability, unit assignment, holds, booking lifecycle
checkout         price snapshot, stock reservation, delivery quote, order creation
orders           history, detail, status transitions, timeline, cancellation
payments         proof upload/retract/review and payment state
refunds          refund calculation, manual processing, evidence, audit
notifications    email, WhatsApp, WebSocket and delivery log
deliveries       addresses, route quote, pickup/delivery rules
blacklist        email/phone abuse blocking
finance          capital, expenses, product costs
reports          dashboard aggregate and XLSX export
admin            staff, permissions, admin profile
health           liveness and readiness
```

### Business logic placement

- Controller: request parsing and response mapping
- DTO/Pipe: structural validation
- Policy/Guard: authorization
- Service: business use case
- Repository/Prisma service: persistence
- Domain policy: state transition and calculation rules
- Queue producer: create async jobs after transaction commit
- Worker processor: email, WhatsApp, cleanup, export, reconciliation

---

## 13. Database Design Principles

1. Semua primary key menggunakan UUID.
2. Semua timestamp menggunakan `timestamptz`.
3. Semua uang menggunakan `NUMERIC(18,0)`/Prisma Decimal.
4. Semua quantity memiliki `CHECK >= 0`.
5. Semua state penting menggunakan enum atau constrained text.
6. Product definition dipisahkan dari physical rental unit.
7. Order item menyimpan snapshot nama, harga, HPP, varian, dan request penting.
8. Data lama tidak boleh berubah hanya karena produk di katalog di-edit.
9. Audit log append-only.
10. Payment proof tidak hard-delete dari database; gunakan `retracted_at`.
11. Soft delete hanya untuk entitas yang memang perlu dipulihkan atau dipertahankan historinya.
12. Query katalog secara default memfilter `deleted_at IS NULL` dan `is_active = true`.
13. Database constraint adalah safety net terakhir untuk race condition.

---

## 14. Core Database Schema

> Tabel berikut adalah logical schema. Implementasi final berada di `schema.prisma`, dengan raw SQL migration hanya untuk constraint PostgreSQL khusus.

### 14.1 Users and Sessions

#### `users`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| email | citext/text | unique, normalized |
| password_hash | text | Argon2id |
| full_name | text | |
| phone_number | text | normalized E.164 |
| is_verified | boolean | default false |
| is_active | boolean | default true |
| deleted_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `admin_users`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| email | citext/text | unique |
| password_hash | text | Argon2id |
| role | enum | owner, finance, staff_verification |
| full_name | text | |
| is_active | boolean | default true |
| mfa_enabled | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `auth_sessions`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK, menjadi `sid` |
| principal_type | enum | customer/admin |
| principal_id | uuid | user/admin id |
| token_family_id | uuid | rotation family |
| refresh_token_hash | text | tidak menyimpan raw token |
| user_agent_hash | text | nullable |
| ip_hash | text | nullable |
| expires_at | timestamptz | |
| revoked_at | timestamptz | nullable |
| last_used_at | timestamptz | |
| created_at | timestamptz | |

#### `email_verification_tokens`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| token_hash | text | unique |
| expires_at | timestamptz | |
| consumed_at | timestamptz | nullable |
| created_at | timestamptz | |

### 14.2 Catalog and Inventory

#### `categories`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| slug | text | unique |
| name | text | |
| type | enum | flower, gift, greeting_board |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `products`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| category_id | uuid | FK |
| slug | text | unique |
| name | text | |
| description | text | |
| product_mode | enum | sale, rental |
| stock_type | enum | ready_stock, pre_order, rental_unit |
| base_price | numeric(18,0) | |
| stock_qty | int | hanya barang jual |
| reserved_qty | int | hanya barang jual |
| po_days | int | nullable |
| is_active | boolean | |
| deleted_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `product_variants`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK |
| name | text | |
| sku | text | unique nullable |
| price_delta | numeric(18,0) | |
| is_active | boolean | |

#### `product_images`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK |
| storage_key | text | object key, bukan public URL permanen |
| alt_text | text | |
| is_primary | boolean | satu primary aktif per produk |
| sort_order | int | |
| created_at | timestamptz | |

#### `rental_units`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK ke produk rental |
| unit_code | text | unique, contoh PB-001 |
| display_name | text | |
| status | enum | available, reserved, rented, cleaning, maintenance, damaged, lost, retired |
| condition_note | text | nullable |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `inventory_adjustments`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK |
| quantity_delta | int | bisa positif/negatif |
| reason | enum | purchase, correction, damaged, completed_sale, cancellation_release |
| reference_type | text | nullable |
| reference_id | uuid | nullable |
| performed_by_admin_id | uuid | nullable |
| created_at | timestamptz | |

### 14.3 Cart

#### `cart_items`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| product_id | uuid | FK |
| variant_id | uuid | nullable |
| quantity | int | > 0 |
| custom_note | text | nullable |
| rental_start_at | timestamptz | wajib untuk rental |
| rental_end_at | timestamptz | wajib untuk rental |
| client_mutation_id | uuid | nullable, idempotency offline sync |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> Cart tidak menjamin stok atau unit rental. Validasi final dilakukan saat checkout.

### 14.4 Orders and Booking

#### `orders`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_number | text | unique, human-readable |
| user_id | uuid | FK |
| status | enum | lihat state machine |
| customer_name | text | snapshot |
| customer_phone | text | snapshot |
| recipient_name | text | nullable |
| recipient_phone | text | nullable |
| delivery_type | enum | delivery, pickup |
| subtotal | numeric(18,0) | |
| delivery_fee | numeric(18,0) | default 0 |
| total | numeric(18,0) | |
| dp_amount | numeric(18,0) | |
| remaining_amount | numeric(18,0) | |
| dp_deadline | timestamptz | |
| dp_verified_at | timestamptz | nullable |
| final_payment_deadline | timestamptz | nullable |
| fully_paid_at | timestamptz | nullable |
| estimated_ready_at | timestamptz | nullable |
| cancelled_at | timestamptz | nullable |
| cancelled_by | enum | customer, admin, system |
| cancel_reason | text | nullable |
| refund_status | enum | none, pending, processing, refunded, failed |
| policy_version | text | refund/terms snapshot version |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### Recommended order statuses

```text
pending_dp
pending_dp_review
pending_final_payment
pending_final_review
fully_paid
processing
ready
out_for_delivery
completed
cancelled
rejected
```

#### `order_items`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK |
| product_id | uuid | FK |
| variant_id | uuid | nullable |
| product_name_snapshot | text | |
| variant_name_snapshot | text | nullable |
| quantity | int | |
| unit_price_snapshot | numeric(18,0) | |
| cost_price_snapshot | numeric(18,0) | |
| custom_note_snapshot | text | nullable |
| rental_start_at | timestamptz | nullable |
| rental_end_at | timestamptz | nullable |
| estimated_ready_at | timestamptz | nullable |

#### `rental_bookings`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| rental_unit_id | uuid | FK |
| order_id | uuid | FK |
| order_item_id | uuid | FK |
| user_id | uuid | FK |
| rental_start_at | timestamptz | |
| rental_end_at | timestamptz | |
| status | enum | soft_locked, reserved, confirmed, active, returned, cancelled |
| hold_expires_at | timestamptz | nullable; sama dengan dp_deadline saat soft lock |
| assigned_at | timestamptz | |
| cancelled_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `delivery_addresses`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | unique FK |
| full_address | text | |
| district | text | nullable |
| city | text | |
| postal_code | text | nullable |
| latitude | decimal | |
| longitude | decimal | |
| distance_meters | int | |
| route_duration_seconds | int | nullable |
| delivery_fee_snapshot | numeric(18,0) | |
| route_provider | text | |
| route_quote_raw | jsonb | sanitized subset only |

> Baris delivery address tidak dibuat untuk pickup.

#### `order_status_history`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK |
| from_status | text | nullable |
| to_status | text | |
| actor_type | enum | customer, admin, system |
| actor_id | uuid | nullable |
| reason | text | nullable |
| metadata | jsonb | sanitized |
| created_at | timestamptz | |

### 14.5 Payments and Refunds

#### `payment_proofs`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK |
| proof_type | enum | dp, final |
| storage_key | text | private object key |
| original_filename | text | admin-only |
| file_size | int | |
| mime_type | text | |
| verification_status | enum | pending, approved, rejected |
| rejected_reason | text | nullable |
| verified_by_admin_id | uuid | nullable |
| verified_at | timestamptz | nullable |
| retracted_at | timestamptz | nullable |
| created_at | timestamptz | |

#### `refunds`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK |
| amount | numeric(18,0) | |
| deduction_percent | int | 0, 25, 50 |
| reason | text | |
| status | enum | pending, processing, refunded, failed |
| processed_by_admin_id | uuid | nullable |
| destination_account_masked | text | nullable |
| transfer_proof_storage_key | text | nullable |
| processed_at | timestamptz | nullable |
| note | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 14.6 Abuse Prevention and Audit

#### `blacklist_entries`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| type | enum | email, phone |
| normalized_value_hash | text | indexed; pertimbangkan enkripsi untuk raw value |
| encrypted_value | text | bila perlu ditampilkan admin |
| reason | text | |
| created_by_admin_id | uuid | FK |
| created_at | timestamptz | |
| revoked_at | timestamptz | nullable |

#### `audit_logs`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| action | text | contoh order.payment.approved |
| entity_type | text | |
| entity_id | uuid | nullable |
| actor_type | enum | customer, admin, system |
| actor_id | uuid | nullable |
| request_id | text | |
| metadata | jsonb | redacted/sanitized |
| created_at | timestamptz | append-only |

#### `idempotency_keys`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| principal_id | uuid | |
| key | text | unique per principal + operation |
| operation | text | checkout, upload proof, refund |
| request_hash | text | detect mismatched reuse |
| response_status | int | |
| response_body | jsonb | sanitized |
| expires_at | timestamptz | |
| created_at | timestamptz | |

#### `outbox_events`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| topic | text | |
| aggregate_type | text | |
| aggregate_id | uuid | |
| payload | jsonb | no secrets |
| available_at | timestamptz | |
| processed_at | timestamptz | nullable |
| attempts | int | |
| last_error | text | nullable, sanitized |
| created_at | timestamptz | |

### 14.7 Finance

#### `product_costs`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK |
| variant_id | uuid | nullable |
| cost_price | numeric(18,0) | |
| effective_at | timestamptz | |
| created_by_admin_id | uuid | |

#### `capital_injections`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| amount | numeric(18,0) | |
| source | text | |
| note | text | nullable |
| injected_at | timestamptz | |
| created_by_admin_id | uuid | |
| created_at | timestamptz | |

#### `expenses`

| Kolom | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| category | enum | raw_material, operational, salary, transport, marketing, other |
| amount | numeric(18,0) | |
| description | text | |
| expense_date | date | |
| attachment_storage_key | text | nullable |
| created_by_admin_id | uuid | |
| deleted_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 15. Critical PostgreSQL Constraints

> SQL berikut adalah contoh intent. Sesuaikan nama enum dan kolom dengan migration final.

### 15.1 One pending DP order per user

```sql
CREATE UNIQUE INDEX one_pending_dp_order_per_user
ON orders (user_id)
WHERE status IN ('pending_dp', 'pending_dp_review');
```

### 15.2 One active payment proof per type

```sql
CREATE UNIQUE INDEX one_active_payment_proof_per_type
ON payment_proofs (order_id, proof_type)
WHERE retracted_at IS NULL
  AND verification_status IN ('pending', 'approved');
```

> Kondisi `retracted_at IS NULL` wajib ada. Tanpa kondisi tersebut, bukti yang sudah diretract tetapi masih memiliki status `pending` dapat memblokir upload baru.

### 15.3 One primary image per product

```sql
CREATE UNIQUE INDEX one_primary_image_per_product
ON product_images (product_id)
WHERE is_primary = true;
```

### 15.4 Non-negative inventory

```sql
ALTER TABLE products
ADD CONSTRAINT stock_non_negative CHECK (stock_qty >= 0),
ADD CONSTRAINT reserved_non_negative CHECK (reserved_qty >= 0),
ADD CONSTRAINT reserved_not_above_stock CHECK (
  stock_type <> 'ready_stock' OR reserved_qty <= stock_qty
);
```

### 15.5 Prevent overlapping rental bookings

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE rental_bookings
ADD CONSTRAINT rental_unit_no_overlap
EXCLUDE USING gist (
  rental_unit_id WITH =,
  tstzrange(rental_start_at, rental_end_at, '[)') WITH &&
)
WHERE (status IN ('soft_locked', 'reserved', 'confirmed', 'active'));
```

- Gunakan interval `[start, end)` agar booking yang selesai tepat saat booking lain dimulai tidak dianggap overlap.
- Prisma belum tentu dapat mengekspresikan exclusion constraint secara langsung; gunakan raw SQL migration yang terdokumentasi.

### 15.6 Cart uniqueness

```sql
CREATE UNIQUE INDEX unique_cart_item_signature
ON cart_items (
  user_id,
  product_id,
  COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(rental_start_at, '1970-01-01 00:00:00+00'::timestamptz),
  COALESCE(rental_end_at, '1970-01-01 00:00:00+00'::timestamptz)
);
```

---

## 16. Transaction and Concurrency Rules

### 16.1 Stock reservation

Jangan gunakan pola check-then-update biasa tanpa isolation/atomic guard.

Gunakan salah satu pendekatan berikut:

1. Serializable transaction dengan retry pada serialization conflict.
2. Conditional atomic update:

```sql
UPDATE products
SET reserved_qty = reserved_qty + :quantity
WHERE id = :product_id
  AND stock_type = 'ready_stock'
  AND stock_qty - reserved_qty >= :quantity;
```

Jika affected row = 0, return stock conflict.

### 16.2 Checkout transaction

Semua operasi berikut harus terjadi dalam satu transaction:

1. Validasi idempotency key.
2. Lock/read product rows yang relevan.
3. Recompute price dari database.
4. Reserve ready-stock secara atomic.
5. Pilih rental unit yang tersedia.
6. Insert order.
7. Insert order items dan price/cost snapshots.
8. Insert delivery snapshot bila delivery.
9. Insert rental booking dengan status `soft_locked`.
10. Set `hold_expires_at = order.dp_deadline`.
11. Insert order status history.
12. Insert outbox events.
13. Clear cart setelah transaction berhasil.

Jika rental constraint conflict atau stok gagal, rollback seluruh transaction.

### 16.3 Prisma transaction policy

- Untuk transaksi checkout, gunakan isolation level `Serializable` jika provider dan Prisma version mendukung.
- Retry conflict terbatas, misalnya maksimum 3 kali dengan jitter.
- Jangan retry validation error atau deterministic business conflict.
- Jangan menjalankan external HTTP call di dalam database transaction.
- Quote ongkir diperoleh sebelum transaction, lalu divalidasi freshness-nya saat membuat order.

---

## 17. Order and Booking State Machines

### 17.1 Order transitions

```text
pending_dp
  ├── customer uploads DP proof ──> pending_dp_review
  ├── deadline passes, no active proof ──> cancelled
  └── customer cancel ──> cancelled

pending_dp_review
  ├── admin approves ──> pending_final_payment
  ├── admin rejects ──> pending_dp with new resubmit deadline
  └── admin rejects order ──> rejected

pending_final_payment
  ├── customer uploads final proof ──> pending_final_review
  ├── deadline passes, no active proof ──> cancelled + refund calculation
  └── customer cancel ──> cancelled + refund calculation

pending_final_review
  ├── admin approves ──> fully_paid
  ├── admin rejects proof ──> pending_final_payment with new deadline
  └── admin rejects order ──> rejected

fully_paid ──> processing ──> ready ──> out_for_delivery/completed
```

### 17.2 Rental booking transitions

```text
soft_locked
  ├── DP approved ──> reserved
  ├── DP deadline expires without active proof ──> cancelled
  └── order cancelled/rejected ──> cancelled

reserved
  ├── final payment approved ──> confirmed
  └── order cancelled/rejected ──> cancelled

confirmed
  ├── rental starts ──> active
  ├── order cancelled ──> cancelled
  └── rental completed/returned ──> returned
```

### 17.3 Deadline safety rule

- Cron/worker tidak boleh membatalkan order bila customer telah mengunggah bukti valid sebelum deadline dan bukti masih menunggu review.
- Jika bukti ditolak, backend menetapkan resubmission deadline baru.
- Semua job expiration harus idempotent dan memeriksa state terbaru sebelum melakukan perubahan.

---

## 18. Checkout Flow

```text
POST /api/checkout
Headers:
  Authorization: Bearer <access-token>
  Idempotency-Key: <uuid>

Body:
  deliveryType
  addressId or address payload
  recipient
  customer notes

Server:
  1. Authenticate customer
  2. Require verified email
  3. Check blacklist/abuse restrictions
  4. Validate idempotency key
  5. Load server cart; ignore client price
  6. Revalidate product/variant availability
  7. Validate rental periods
  8. Calculate subtotal and snapshots
  9. If delivery, obtain route quote through Routes API
  10. Execute serializable database transaction
  11. Reserve sale stock atomically
  12. Auto-assign physical rental unit
  13. Create order and bookings
  14. Set DP deadline +2 hours
  15. Create outbox notification event
  16. Clear server cart

Return:
  orderId
  orderNumber
  dpAmount
  remainingAmount
  dpDeadline
```

### Important rules

- Client tidak mengirim daftar harga final.
- Backend boleh menerima cart item references, tetapi server cart/database tetap authoritative.
- Ongkir di-snapshot pada order.
- Jika Routes API gagal, jangan diam-diam menggunakan angka acak. Return dependency error atau gunakan fallback tariff yang telah disetujui owner.
- Untuk pickup, jangan memanggil Routes API.

---

## 19. Payment Proof Flow

### 19.1 Upload

```text
POST /api/orders/:orderId/payment-proofs/dp
POST /api/orders/:orderId/payment-proofs/final
```

Rules:

- Customer harus memiliki order tersebut.
- State order harus sesuai.
- File harus lolos size, MIME, magic-byte, and decode validation.
- Upload object terlebih dahulu ke temporary key.
- Buat DB record dalam transaction.
- Setelah commit, promote/move object ke final key bila storage strategy mendukung.
- Emit outbox event `payment.proof.submitted`.
- Worker mengirim WebSocket event dan notifikasi admin.
- Order berpindah ke review status.

### 19.2 Retract

```text
DELETE /api/orders/:orderId/payment-proofs/:proofType
```

Rules:

- Hanya proof `pending` dan `retracted_at IS NULL`.
- Update `retracted_at` secara transactional.
- Emit `payment.proof.retracted`.
- Delete object melalui cleanup job setelah commit.
- Customer dapat upload ulang setelah retract.
- Proof approved tidak boleh diretract.
- Proof rejected tidak aktif dan boleh diganti tanpa retract.

### 19.3 Admin verification

```text
POST /api/admin/orders/:orderId/payments/dp/approve
POST /api/admin/orders/:orderId/payments/dp/reject
POST /api/admin/orders/:orderId/payments/final/approve
POST /api/admin/orders/:orderId/payments/final/reject
```

- State transition, proof update, booking update, status history, audit log, dan outbox event dilakukan dalam satu transaction.
- Notifikasi dilakukan setelah commit.

---

## 20. Refund Rules

### 20.1 Customer cancellation

```text
Age since order.created_at:
< 12 hours       deduction 0%    refund 100% of verified DP
12–24 hours      deduction 25%   refund 75% of verified DP
> 24 hours       deduction 50%   refund 50% of verified DP
```

### 20.2 Admin/system cancellation

- Admin force-cancel karena kesalahan toko/force majeure: refund 100%.
- System cancel karena DP tidak pernah dibayar: tidak ada refund.
- System cancel karena pelunasan tidak dibayar: gunakan kebijakan yang telah disetujui owner dan snapshot policy order.

### 20.3 Refund implementation

- Policy version disimpan pada order.
- Nominal dihitung backend.
- Buat record `refunds`.
- Admin memproses transfer manual.
- Simpan bukti transfer ke private storage.
- Customer hanya melihat rekening tujuan yang dimasking dan status refund.
- Semua perubahan refund memiliki audit log.

---

## 21. Offline-Resilient Cart

### 21.1 Source of truth

- Online authenticated state: PostgreSQL server cart.
- Offline buffer: IndexedDB.
- Zustand hanya menyimpan in-memory UI state.

### 21.2 Offline command format

```json
{
  "clientMutationId": "uuid",
  "operation": "upsert|remove",
  "productId": "uuid",
  "variantId": null,
  "quantity": 1,
  "rentalStartAt": null,
  "rentalEndAt": null,
  "customNote": null,
  "clientCreatedAt": "ISO-8601"
}
```

### 21.3 Sync rules

- Jangan menghapus seluruh cart server dan menggantinya buta dengan cart client.
- Kirim batch commands dengan `clientMutationId`.
- Backend memproses setiap command secara idempotent.
- Backend memvalidasi ulang product, variant, quantity, rental period, dan active status.
- Backend tidak menerima price dari client.
- Response selalu mengembalikan canonical server cart.
- Conflict ditampilkan jelas pada frontend, misalnya produk nonaktif atau jumlah melebihi stok.
- Saat logout, hapus local token dan local sensitive cache; server cart tetap tersimpan.
- Setelah login kembali, fetch server cart dan merge hanya pending commands yang valid.

---

## 22. Notification, Queue, and Outbox

### 22.1 Do not send notifications inside request transaction

```text
DB transaction commits
  -> outbox event saved
  -> dispatcher enqueues BullMQ job
  -> worker sends email/WhatsApp/WebSocket
  -> delivery result recorded
```

### 22.2 Queue examples

```text
notification.email.send
notification.whatsapp.send
notification.websocket.emit
order.dp.expire
order.final-payment.warn
order.final-payment.expire
storage.object.delete
report.xlsx.generate
outbox.dispatch
```

### 22.3 Worker rules

- Job harus idempotent.
- Retry dengan exponential backoff.
- Set timeout.
- Simpan attempt count dan final failure.
- Gunakan dead-letter handling atau failed-job dashboard.
- Jangan log email body penuh, token, atau data sensitif.
- Provider-specific code berada di adapter, bukan service domain.

### 22.4 Email and WhatsApp configuration

- Jangan hardcode email pribadi, nomor pribadi, token, atau credential dalam source code.
- Gunakan verified domain email untuk production.
- WhatsApp provider harus dapat diganti melalui interface.
- Deep-link `wa.me` boleh digunakan sebagai fallback manual admin.

---

## 23. Delivery and Route Calculation

- Gunakan Google Maps Routes API `Compute Route Matrix`.
- API hanya dipanggil dari backend.
- API key dibatasi berdasarkan API, environment, dan server identity bila provider mendukung.
- Simpan distance dan fee snapshot, bukan seluruh response provider tanpa kebutuhan.
- Cache quote pendek bila origin/destination dan parameter identik.
- Tetapkan quote expiry.
- Pickup selalu memiliki delivery fee 0.
- Delivery fee formula berada dalam versioned service/config.

Example formula:

```text
if distanceKm <= baseKm:
  fee = baseFee
else:
  fee = baseFee + ceil(distanceKm - baseKm) * perKmFee
```

---

## 24. Key API Endpoints

### 24.1 Customer auth

```text
POST   /api/auth/register
GET    /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PATCH  /api/auth/me
```

### 24.2 Catalog

```text
GET    /api/categories
GET    /api/products
GET    /api/products/:slug
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/images
DELETE /api/admin/products/:id/images/:imageId
PATCH  /api/admin/products/:id/inventory
```

### 24.3 Rental

```text
GET    /api/rentals/availability
GET    /api/rentals/calendar
GET    /api/admin/rental-units
POST   /api/admin/rental-units
PATCH  /api/admin/rental-units/:id
PATCH  /api/admin/orders/:orderId/reassign-rental-unit
```

### 24.4 Cart

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart
POST   /api/cart/sync
```

### 24.5 Checkout and orders

```text
POST   /api/checkout/delivery-quote
POST   /api/checkout
GET    /api/orders/my
GET    /api/orders/my/:orderId
POST   /api/orders/my/:orderId/cancel
```

### 24.6 Payment proofs

```text
POST   /api/orders/:orderId/payment-proofs/dp
DELETE /api/orders/:orderId/payment-proofs/dp
POST   /api/orders/:orderId/payment-proofs/final
DELETE /api/orders/:orderId/payment-proofs/final
```

### 24.7 Admin order management

```text
GET    /api/admin/orders
GET    /api/admin/orders/:id
POST   /api/admin/orders/:id/payments/dp/approve
POST   /api/admin/orders/:id/payments/dp/reject
POST   /api/admin/orders/:id/payments/final/approve
POST   /api/admin/orders/:id/payments/final/reject
POST   /api/admin/orders/:id/process
POST   /api/admin/orders/:id/ready
POST   /api/admin/orders/:id/complete
POST   /api/admin/orders/:id/force-cancel
PATCH  /api/admin/refunds/:refundId/process
PATCH  /api/admin/refunds/:refundId/complete
```

### 24.8 Finance and reports

```text
CRUD   /api/admin/finance/capital
CRUD   /api/admin/finance/expenses
CRUD   /api/admin/finance/product-costs
GET    /api/admin/reports/summary
GET    /api/admin/reports/chart-data
POST   /api/admin/reports/exports
GET    /api/admin/reports/exports/:jobId
```

---

## 25. Financial Calculation Rules

```text
Product Revenue = SUM(order_items.quantity × unit_price_snapshot)
Delivery Revenue = SUM(orders.delivery_fee)
Gross Revenue = Product Revenue + Delivery Revenue
Total HPP = SUM(order_items.quantity × cost_price_snapshot)
Gross Product Profit = Product Revenue − Total HPP
Total Expenses = SUM(active expenses in period)
Net Profit = Gross Product Profit + Delivery Revenue − Total Expenses
```

- Jangan menghitung revenue dari order yang belum fully paid.
- Tentukan accounting recognition rule secara eksplisit: saat fully paid atau completed.
- Refund mengurangi recognized revenue sesuai tanggal dan kebijakan akuntansi yang dipilih.
- Ongkir dipisahkan agar surplus/defisit delivery dapat dianalisis.
- Materialized view boleh digunakan untuk laporan berat, tetapi transactional tables tetap source of truth.

---

## 26. Testing Requirements

### 26.1 Unit tests

- Refund tiers
- DP and remaining amount calculation
- Delivery fee formula
- Order state transition
- Rental overlap logic
- Permission policy
- Token rotation and reuse detection
- File validation helper

### 26.2 Integration tests

- Prisma repositories against test PostgreSQL
- Redis session/revocation behavior
- Checkout transaction rollback
- Atomic stock reservation
- Rental exclusion constraint
- Idempotency replay
- Outbox creation

### 26.3 API E2E tests

- Register, verify, login, refresh, logout
- Unverified user cannot checkout
- Blacklisted user cannot checkout
- Mixed category checkout
- Ready stock conflict under concurrent checkout
- Rental unit conflict under concurrent checkout
- Upload/retract/re-upload proof
- Admin approve/reject DP
- Admin approve/reject final payment
- Deadline job does not cancel a proof awaiting review
- Refund tier calculation
- Admin force-cancel full refund

### 26.4 Frontend Playwright flows

- Public browsing and product SEO rendering
- Login and session restoration after page reload
- Offline cart queue and reconnect sync
- Delivery/pickup checkout
- Rental date selection
- Payment proof upload and retract
- Customer order timeline
- Admin payment verification

### 26.5 k6 scenarios

- Catalog read baseline
- Login rate-limit behavior
- Concurrent checkout on last stock item
- Concurrent rental booking for one unit/time range
- Admin dashboard read load
- Spike test on promotional campaign

---

## 27. Logging and Observability

### 27.1 Required log fields

```json
{
  "level": "info",
  "service": "api",
  "environment": "production",
  "requestId": "req_xxx",
  "traceId": "trace_xxx",
  "module": "checkout",
  "action": "order.created",
  "orderId": "ord_xxx",
  "userIdHash": "hash_xxx",
  "statusCode": 201,
  "durationMs": 120
}
```

### 27.2 Never log

- Password
- Password hash
- Access token
- Refresh token
- OTP
- Verification/reset token
- Full payment proof URL
- API key
- SMTP password
- Full address unless strictly required and protected
- Full phone number/email in general application logs

### 27.3 Health endpoints

```text
GET /health/live
GET /health/ready
```

Readiness checks:

- PostgreSQL
- Redis
- Worker/queue availability where relevant
- Object storage connectivity optionally as degraded dependency

---

## 28. Deployment Architecture

```text
Browser
  |
  v
Cloudflare DNS/CDN/WAF
  |
  +--> www.example.com  -> Next.js/Vercel
  |
  +--> api.example.com  -> NestJS API containers
                             |
                             +--> Managed PostgreSQL
                             +--> Managed Redis
                             +--> Cloudflare R2
                             +--> Routes API
                             +--> Email/WhatsApp providers
                             |
                             +--> BullMQ Worker containers
```

### Production requirements

- Frontend, API, PostgreSQL, and Redis berada di region yang berdekatan.
- TLS wajib.
- Database tidak diekspos publik tanpa IP/network restriction.
- Automated backup dan point-in-time recovery bila tersedia.
- Separate environment untuk development, staging, dan production.
- Separate database credentials per environment.
- Deploy worker terpisah dari API.
- Cloudflare rate limiting/WAF menjadi lapisan tambahan, bukan pengganti backend control.

### Domain and CORS example

```text
Web: https://www.example.com
API: https://api.example.com
CDN: https://cdn.example.com
```

```text
Allowed origin: https://www.example.com
Credentials: true
Allowed headers: Content-Type, Authorization, Idempotency-Key, X-CSRF-Token
```

---

## 29. CI/CD Pipeline

### Pull request

```text
npm ci
  -> prisma format/validate
  -> lint
  -> typecheck
  -> unit tests
  -> integration tests
  -> Next.js typegen/typecheck
  -> build web/api/worker
  -> dependency and secret scan
```

### Merge to main

```text
Build immutable artifacts/images
  -> deploy staging
  -> run prisma migrate deploy
  -> smoke tests
  -> Playwright critical path
  -> manual/automatic approval
  -> deploy production
  -> health check
  -> post-deploy smoke tests
```

### Migration safety

- Backup before high-risk migration.
- Prefer expand-and-contract migration.
- Do not remove columns in the same deployment that stops writing them.
- Rollback plan wajib untuk production migration berisiko.

---

## 30. Environment Variables

```env
# Runtime
NODE_ENV=development
PORT=3001
PUBLIC_WEB_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/florist_db
DIRECT_DATABASE_URL=postgresql://user:password@localhost:5432/florist_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT / Session
JWT_ACCESS_SECRET=replace_with_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=30
SESSION_HASH_SECRET=replace_with_long_random_secret
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
CSRF_SECRET=replace_with_long_random_secret

# Argon2id
ARGON2_MEMORY_COST_KIB=19456
ARGON2_TIME_COST=2
ARGON2_PARALLELISM=1

# Email provider
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=replace_me
EMAIL_PASSWORD=replace_me
EMAIL_FROM=no-reply@example.com

# WhatsApp provider
WHATSAPP_PROVIDER=fonnte
WHATSAPP_API_TOKEN=replace_me
WHATSAPP_SENDER_ID=replace_me
WHATSAPP_ADMIN_NUMBER=replace_me

# Google Maps Routes API
GOOGLE_MAPS_ROUTES_API_KEY=replace_me
STORE_ORIGIN_LAT=0
STORE_ORIGIN_LNG=0
ROUTE_QUOTE_TTL_MINUTES=10

# Delivery pricing
DELIVERY_BASE_KM=4
DELIVERY_BASE_FEE=10000
DELIVERY_PER_KM_FEE=2500

# Cloudflare R2
R2_ACCESS_KEY_ID=replace_me
R2_SECRET_ACCESS_KEY=replace_me
R2_BUCKET_NAME=florist-private
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=

# Upload
MAX_UPLOAD_SIZE_MB=2
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png
SIGNED_URL_TTL_SECONDS=300

# Payment deadlines
DP_DEADLINE_HOURS=2
PAYMENT_RESUBMIT_HOURS=2
FINAL_PAYMENT_DEADLINE_DAYS=3
FINAL_PAYMENT_WARNING_HOURS=24

# Refund policy
REFUND_POLICY_VERSION=2026-01
REFUND_TIER1_MAX_HOURS=12
REFUND_TIER1_DEDUCTION_PERCENT=0
REFUND_TIER2_MAX_HOURS=24
REFUND_TIER2_DEDUCTION_PERCENT=25
REFUND_TIER3_DEDUCTION_PERCENT=50

# Idempotency
IDEMPOTENCY_TTL_HOURS=24

# Observability
LOG_LEVEL=debug
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=
```

### Environment rules

- Validate all variables at startup.
- Application harus gagal start jika secret atau connection string penting tidak tersedia.
- Jangan commit `.env`.
- Sediakan `.env.example` tanpa credential nyata.
- Production secret disimpan di provider secret manager/environment manager.

---

## 31. Implementation Order

| Fase | Modul | Hasil utama |
|---|---|---|
| 1 | Monorepo, config, Docker local | Web/API/worker dapat berjalan lokal |
| 2 | Prisma schema, migrations, critical constraints | Database aman terhadap conflict dasar |
| 3 | Auth, sessions, email verification, RBAC | Customer/admin auth lengkap |
| 4 | Catalog, variants, images, inventory | Katalog publik dan admin CRUD |
| 5 | Next.js public storefront and SEO | Homepage/category/product pages |
| 6 | Persistent/offline cart | Cart server + IndexedDB command queue |
| 7 | Rental availability and physical units | Kalender dan anti-overlap |
| 8 | Delivery quote | Routes API + fee snapshot |
| 9 | Checkout transaction | Stock/rental reservation + idempotency |
| 10 | Payment proof and DP verification | Upload/retract/review DP |
| 11 | Final payment flow | Pelunasan dan booking confirmation |
| 12 | Customer order history and cancellation | Timeline + refund creation |
| 13 | Admin dashboard and WebSocket | Review queue dan live notification |
| 14 | Queue, worker, outbox hardening | Reliable async notifications |
| 15 | Finance and reports | HPP, expenses, XLSX |
| 16 | Observability and security hardening | Monitoring, alerts, MFA, load tests |
| 17 | Staging and production deployment | CI/CD and backup readiness |

---

## 32. Definition of Done

Sebuah fitur dianggap selesai jika:

- DTO dan backend validation tersedia.
- Authorization dan ownership check tersedia.
- Business rules berada di service/policy.
- Transaction/concurrency behavior sudah diuji.
- Audit log dibuat untuk perubahan sensitif.
- Unit/integration/E2E tests yang relevan lulus.
- API documentation diperbarui.
- Error response mengikuti contract.
- Log tidak membocorkan data sensitif.
- Migration tersedia dan dapat dijalankan di database kosong.
- Feature bekerja pada mobile viewport.
- Accessibility dasar telah diuji.
- Failure dependency eksternal memiliki handling yang jelas.

---

## 33. Do Not — Mandatory Prohibitions

- **JANGAN** menggunakan Node.js 18 atau 20 untuk proyek baru ini.
- **JANGAN** menggunakan Flutter Web dalam baseline arsitektur ini.
- **JANGAN** menggunakan `localStorage` untuk access/refresh token.
- **JANGAN** menyimpan raw refresh token di database atau Redis.
- **JANGAN** menggunakan bcrypt untuk implementasi baru kecuali Argon2id benar-benar tidak tersedia.
- **JANGAN** hardcode email, nomor telepon, API key, atau credential.
- **JANGAN** menggunakan `SameSite=Strict` secara default tanpa pengujian alur email/WhatsApp.
- **JANGAN** menganggap Helmet sendirian menyelesaikan XSS/CSRF.
- **JANGAN** melakukan authorization hanya di frontend.
- **JANGAN** menghitung harga, DP, ongkir, refund, HPP, atau laba di client.
- **JANGAN** menerima price atau role dari client sebagai sumber kebenaran.
- **JANGAN** memanggil Routes API untuk pickup.
- **JANGAN** melakukan external HTTP call di dalam database transaction.
- **JANGAN** menggunakan check-then-update stok tanpa atomic guard atau serializable transaction.
- **JANGAN** mengandalkan Redis lock sebagai satu-satunya pencegah double booking.
- **JANGAN** menghapus rental exclusion constraint atau stock constraints.
- **JANGAN** membuat soft-lock 15 menit ketika deadline DP adalah 2 jam.
- **JANGAN** membatalkan order yang memiliki bukti pembayaran `pending` dan diunggah sebelum deadline.
- **JANGAN** mengirim email/WhatsApp secara synchronous di dalam checkout request.
- **JANGAN** hard-delete order, payment proof, refund, atau audit log.
- **JANGAN** expose private storage URL permanen.
- **JANGAN** expose Prisma model langsung ke frontend.
- **JANGAN** menjalankan `prisma migrate dev` di production.
- **JANGAN** membuat tabel manual di production di luar migration.
- **JANGAN** menggunakan raw SQL tanpa alasan dan test.
- **JANGAN** menyimpan seluruh cart hanya di Zustand atau browser storage.
- **JANGAN** mengganti seluruh server cart secara buta saat offline sync.
- **JANGAN** memproses checkout tanpa idempotency key.
- **JANGAN** mengklaim SSR menjamin ranking nomor satu di Google.
- **JANGAN** membangun microservices sebelum modular monolith terbukti menjadi bottleneck.

---

## 34. Final Instruction to Claude Code

Ketika mengimplementasikan fitur:

1. Baca keputusan bisnis dan state machine terlebih dahulu.
2. Identifikasi data yang berubah dan boundary transaction.
3. Identifikasi kemungkinan race condition dan duplicate request.
4. Buat migration dan constraint sebelum mengandalkan service validation.
5. Buat DTO, authorization policy, service, dan tests.
6. Gunakan outbox/queue untuk side effect eksternal.
7. Pastikan error yang dikembalikan aman dan dapat ditindaklanjuti.
8. Jangan mengubah keputusan final tanpa menjelaskan dampak dan meminta persetujuan owner.
9. Bila terdapat konflik antara kenyamanan coding dan integritas transaksi, prioritaskan integritas transaksi.
10. Bila terdapat ketidakjelasan kecil, pilih implementasi paling aman dan dokumentasikan asumsi; jangan membuat perubahan bisnis besar secara diam-diam.
