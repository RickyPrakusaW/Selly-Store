# Seli Florist API

Production-oriented NestJS REST API for flowers, gifts, and physical greeting-board rentals. The API follows the decisions in `../note.md`: persistent carts, server-side pricing, two-stage payment, transactional stock reservation, automatic board assignment, manual tiered refunds, real-time admin events, and finance reporting.

## Runtime services

- Node.js 20+ and npm
- PostgreSQL
- Redis (refresh-token revocation; auth refresh/logout intentionally fail closed if unavailable)
- SMTP credentials for email delivery
- Google Distance Matrix API for delivery orders only

Copy `.env.example` to `.env` and replace every production secret. `JWT_SECRET` and `JWT_REFRESH_SECRET` must be independent high-entropy values. Secure refresh cookies are always marked `httpOnly`, `Secure`, and `SameSite=Strict`, so local browser testing should use HTTPS.

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

The seed is safe by default: it creates categories and board inventory but does not create a privileged account unless `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` are explicitly set.

## Verification

```bash
npx prisma validate
npm run lint
npm run build
npm test -- --runInBand
```

## API structure

All HTTP routes use the `/api` prefix. Public routes are limited to health, product/category reads, the booking calendar, email/auth flows, and public product images. Other routes require a bearer access token.

- `auth`: registration, verification, login, refresh rotation, logout/revocation, password reset, profile
- `catalog`: categories, products, variants/images, stock and soft deletion
- `cart`: persistent item CRUD and atomic offline reconciliation
- `booking`: calendar, availability, board inventory, transactional auto-assignment
- `checkout`: pickup/delivery estimation and `SERIALIZABLE` order creation
- `orders`: customer history/cancellation and admin verification/lifecycle/refunds
- `payment-proof`: validated DP/final image submission and pending-proof retraction
- `finance`, `reports`, `blacklist`, `admin`: role-restricted operations
- `notifications`: authenticated Socket.IO namespace `/admin-notifications`
- `jobs`: minute-level expiry and hourly final-payment reminders

List endpoints use `page` and `limit` (maximum 100). Responses have the common `{ success, data, meta? }` shape; errors have `{ success: false, message, errors? }`.

## Database safety

The initial migration contains PostgreSQL partial indexes that Prisma cannot describe in `schema.prisma`:

- one active board booking per `(board_id, booking_date)`
- one pending-payment order per customer
- one active proof per order/payment stage
- one logical cart row per product/variant/date
- one active primary image per product

Checkout and board reassignment also use `SERIALIZABLE` transactions with conflict retries. Application writes use Prisma's parameterized query API; no user input is interpolated into SQL.

## Upload boundary

Uploads are held in memory up to 2 MB, checked against PNG/JPEG start and terminal signatures, checked against the declared MIME type, and stored under server-generated UUID names. Original names are metadata only and never become paths. Product images are public; payment proofs require an admin role and are returned with `Cache-Control: private, no-store`.

For multi-instance production deployment, replace the included local filesystem storage adapter with the planned R2/S3 adapter while preserving the same UUID-key contract.
