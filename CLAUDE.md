# 🌸 Seli Florist (Selly-Store) — Claude Code Guidelines

Welcome to the **Seli Florist Atelier** e-commerce and rental platform codebase. This file guides Claude Code to understand the architecture, business rules, and technical conventions of this project.

---

## 🏛️ 1. Architecture Overview

* **Fullstack Monorepo Structure:**
  * `backend/` : **NestJS 10+** (TypeScript, Prisma ORM, PostgreSQL, Redis, DOKU/QRIS payment gateway).
  * `frontend/` : **Next.js 14+ App Router** (React 18/19, TypeScript, Vanilla CSS Luxury Design System).
  * `docs/` : Architecture specifications, Postman collections, and MCP specification (`docs/MCP_SPEC.md`).
  * `.claude/skills/` : Dedicated agent skills for UI, testing, NestJS API, Redis caching, and checkout security.

* **Key Ports & URLs:**
  * **Backend API Base:** `http://localhost:3000/api`
  * **Swagger Docs:** `http://localhost:3000/api/docs`
  * **Frontend Storefront:** `http://localhost:3001`
  * **Admin Operations Portal:** `http://localhost:3001/admin/login`

---

## 📜 2. Core Business Rules (Crucial for AI Agent)

1. **Two-Stage Payment (DP 50%):**
   * Customer orders start at `PENDING_PAYMENT`.
   * Down Payment (DP) is **50% of total order** (including shipping fee).
   * Remaining 50% must be settled before shipment/pickup (`PENDING_FINAL_PAYMENT` -> `FULLY_PAID`).
2. **Rental Board Booking (Papan Ucapan):**
   * Inventory is strictly limited (3–5 physical units).
   * **Always verify availability** against `bookingDate` and `bookingEndDate` before confirming checkout.
3. **Cancellation & Refund Policy:**
   * `< 12 hours` after order: 100% DP refund (0% penalty).
   * `12 – 24 hours`: 75% DP refund (25% penalty).
   * `> 24 hours`: 50% DP refund (50% penalty).
4. **Delivery & Shipping:**
   * `DELIVERY`: Requires full address, recipient phone number, and distance-based shipping calculation.
   * `PICKUP`: Zero shipping cost, customer picks up at workshop.

---

## 🛠️ 3. Development Commands

### Backend (`cd backend`)
* `npm run start:dev` — Start NestJS dev server with hot reload (Port 3000).
* `npx prisma migrate dev` — Apply database schema migrations.
* `npm run prisma:seed` — Seed initial florist categories, products, and admin credentials.
* `npm run test` — Run unit tests.

### Frontend (`cd frontend`)
* `npm run dev` — Start Next.js development server (Port 3001).
* `npm run build` — Build production bundle.
* `npm run lint` — Lint code quality.

---

## 🎨 4. Frontend & Styling Conventions

* **Design Philosophy:** Luxury, atelier, modern aesthetic for high-end florist and gift boutique.
* **Styling Technology:** **Vanilla CSS** with modular stylesheets located in `frontend/app/styles/`:
  * `header.css`, `storefront.css`, `product.css`, `rental-calendar.css`, `cart-checkout.css`, `orders.css`, `admin.css`, `footer.css`.
* **Important:** Do NOT inject default Tailwind utility classes into components that use custom Vanilla CSS classes. Adhere to existing class conventions.

---

## 🔒 5. API & Backend Conventions

* **Controller Pattern:** RESTful routing prefixed with `/api`.
* **Validation:** All incoming request bodies MUST be validated with `class-validator` DTOs and `ValidationPipe`.
* **Idempotency:** Sensitive transactional endpoints (e.g. `POST /checkout`) MUST use header `X-Idempotency-Key` to prevent double-charging or duplicate order creation.
* **Caching:** Use `RedisService` for session cart items and rapid availability checks. Invalidate cache on inventory mutation.

---

## 🧰 6. Available Claude Skills in `.claude/skills/`

* `frontend-design`: Crafting luxurious, responsive UI components without generic AI-slop.
* `browser-qa`: Validating UI states, responsive layout, cart drawer, and booking calendar.
* `codebase-onboarding`: Mapping relationships between frontend components and backend services.
* `nestjs-api-patterns`: Best practices for controllers, services, DTOs, and Prisma queries.
* `redis-cache-strategy`: Redis caching for cart sessions and rental date locking.
* `checkout-security-idempotency`: Security for DOKU/QRIS payments, signatures, and idempotency.
* `ecommerce-testing`: Unit & integration tests for DP calculations and rental conflict prevention.
* `continuous-learning`: Capturing project learnings and memory across sessions.
