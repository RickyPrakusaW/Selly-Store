-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('owner', 'finance', 'staff_verifikasi', 'customer');

-- CreateEnum
CREATE TYPE "stock_type" AS ENUM ('ready_stock', 'pre_order');

-- CreateEnum
CREATE TYPE "delivery_type" AS ENUM ('delivery', 'pickup');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending_payment', 'dp_verified', 'pending_final_payment', 'fully_paid', 'processing', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('soft_locked', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "proof_type" AS ENUM ('dp', 'final');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('waiting_proof', 'proof_pending', 'verified', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "cancelled_by" AS ENUM ('customer', 'admin', 'system');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('pending_refund', 'refunded');

-- CreateEnum
CREATE TYPE "blacklist_type" AS ENUM ('email', 'wa_number');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('bahan_baku', 'operasional', 'gaji', 'transport', 'marketing', 'lainnya');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'customer',
    "full_name" VARCHAR(150) NOT NULL,
    "phone_number" VARCHAR(32),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "verification_token_hash" TEXT,
    "token_expires_at" TIMESTAMPTZ(3),
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "base_price" DECIMAL(15,2) NOT NULL,
    "stock_type" "stock_type" NOT NULL,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "po_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(3),
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_name" VARCHAR(120) NOT NULL,
    "price_delta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_inventory" (
    "id" UUID NOT NULL,
    "board_name" VARCHAR(100) NOT NULL,
    "board_type" VARCHAR(80),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "qty" INTEGER NOT NULL,
    "custom_note" TEXT,
    "booking_date" DATE,
    "added_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wa_number" VARCHAR(32) NOT NULL,
    "customer_name" VARCHAR(150) NOT NULL,
    "recipient_name" VARCHAR(150) NOT NULL,
    "recipient_phone" VARCHAR(32) NOT NULL,
    "delivery_type" "delivery_type" NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending_payment',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "ongkir_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dp_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "custom_text_request" TEXT,
    "estimated_ready_date" DATE,
    "dp_deadline" TIMESTAMPTZ(3) NOT NULL,
    "dp_verified_at" TIMESTAMPTZ(3),
    "pelunasan_deadline" TIMESTAMPTZ(3),
    "final_warning_sent_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "cancelled_by" "cancelled_by",
    "cancel_reason" TEXT,
    "refund_amount" DECIMAL(15,2),
    "refund_deduction_pct" INTEGER,
    "refund_status" "refund_status",
    "refund_note" TEXT,
    "admin_cancel_note" TEXT,
    "stock_reservation_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "qty" INTEGER NOT NULL,
    "product_name_snapshot" VARCHAR(180) NOT NULL,
    "variant_name_snapshot" VARCHAR(120),
    "custom_note_snapshot" TEXT,
    "price_snapshot" DECIMAL(15,2) NOT NULL,
    "cost_price_snapshot" DECIMAL(15,2) NOT NULL,
    "booking_date" DATE,
    "estimated_ready_date" DATE,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "full_address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "distance_km" DECIMAL(10,2) NOT NULL,
    "ongkir_calculated" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_bookings" (
    "id" UUID NOT NULL,
    "board_id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'soft_locked',
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "locked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),

    CONSTRAINT "board_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "down_payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'waiting_proof',
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "expired_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "down_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "proof_type" "proof_type" NOT NULL,
    "file_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(32) NOT NULL,
    "verification_status" "verification_status" NOT NULL DEFAULT 'pending',
    "rejected_reason" TEXT,
    "verified_by_admin_id" UUID,
    "verified_at" TIMESTAMPTZ(3),
    "retracted_at" TIMESTAMPTZ(3),

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" UUID NOT NULL,
    "type" "blacklist_type" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blacklisted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blacklisted_by_admin_id" UUID NOT NULL,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "performed_by" UUID,
    "performed_by_role" "user_role",
    "details" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_costs" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "cost_price" DECIMAL(15,2) NOT NULL,
    "effective_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_injections" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "source" VARCHAR(160) NOT NULL,
    "note" TEXT,
    "injected_at" DATE NOT NULL,
    "created_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capital_injections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "category" "expense_category" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "expense_date" DATE NOT NULL,
    "attachment_url" TEXT,
    "created_by_admin_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_ledger" (
    "date" DATE NOT NULL,
    "gross_revenue" DECIMAL(15,2) NOT NULL,
    "total_hpp" DECIMAL(15,2) NOT NULL,
    "total_ongkir_collected" DECIMAL(15,2) NOT NULL,
    "gross_profit" DECIMAL(15,2) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "revenue_ledger_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_is_active_deleted_at_idx" ON "products"("category_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images"("product_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_variant_name_key" ON "product_variants"("product_id", "variant_name");

-- CreateIndex
CREATE UNIQUE INDEX "board_inventory_board_name_key" ON "board_inventory"("board_name");

-- CreateIndex
CREATE INDEX "cart_items_user_id_idx" ON "cart_items"("user_id");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_addresses_order_id_key" ON "delivery_addresses"("order_id");

-- CreateIndex
CREATE INDEX "board_bookings_booking_date_status_idx" ON "board_bookings"("booking_date", "status");

-- CreateIndex
CREATE INDEX "board_bookings_order_id_idx" ON "board_bookings"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "down_payments_order_id_key" ON "down_payments"("order_id");

-- CreateIndex
CREATE INDEX "down_payments_status_deadline_idx" ON "down_payments"("status", "deadline");

-- CreateIndex
CREATE INDEX "payment_proofs_order_id_proof_type_verification_status_idx" ON "payment_proofs"("order_id", "proof_type", "verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_type_value_key" ON "blacklist"("type", "value");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "product_costs_product_id_effective_date_idx" ON "product_costs"("product_id", "effective_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "product_costs_product_id_effective_date_key" ON "product_costs"("product_id", "effective_date");

-- CreateIndex
CREATE INDEX "capital_injections_injected_at_idx" ON "capital_injections"("injected_at");

-- CreateIndex
CREATE INDEX "expenses_expense_date_deleted_at_idx" ON "expenses"("expense_date", "deleted_at");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_bookings" ADD CONSTRAINT "board_bookings_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "board_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_bookings" ADD CONSTRAINT "board_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_bookings" ADD CONSTRAINT "board_bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "down_payments" ADD CONSTRAINT "down_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_blacklisted_by_admin_id_fkey" FOREIGN KEY ("blacklisted_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_injections" ADD CONSTRAINT "capital_injections_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostgreSQL-only invariants that Prisma's schema DSL cannot express.
-- Only active locks block a physical board/date; cancelled history is retained.
CREATE UNIQUE INDEX "active_board_booking_per_date"
ON "board_bookings" ("board_id", "booking_date")
WHERE "status" IN ('soft_locked', 'confirmed');

CREATE UNIQUE INDEX "one_pending_order_per_user"
ON "orders" ("user_id")
WHERE "status" = 'pending_payment';

CREATE UNIQUE INDEX "unique_cart_item"
ON "cart_items" (
  "user_id",
  "product_id",
  COALESCE("variant_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("booking_date", '1970-01-01'::date)
);

CREATE UNIQUE INDEX "one_active_proof_per_type"
ON "payment_proofs" ("order_id", "proof_type")
WHERE "verification_status" IN ('pending', 'approved') AND "retracted_at" IS NULL;

CREATE UNIQUE INDEX "one_primary_image_per_product"
ON "product_images" ("product_id")
WHERE "is_primary" = true AND "deleted_at" IS NULL;

ALTER TABLE "products"
  ADD CONSTRAINT "products_nonnegative_stock" CHECK ("stock_qty" >= 0 AND "reserved_qty" >= 0 AND "reserved_qty" <= "stock_qty"),
  ADD CONSTRAINT "products_valid_po_days" CHECK (("stock_type" = 'pre_order' AND "po_days" > 0) OR ("stock_type" = 'ready_stock')),
  ADD CONSTRAINT "products_nonnegative_price" CHECK ("base_price" >= 0);

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_positive_qty" CHECK ("qty" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_positive_values" CHECK ("qty" > 0 AND "price_snapshot" >= 0 AND "cost_price_snapshot" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_valid_money" CHECK (
  "subtotal" >= 0 AND "ongkir_fee" >= 0 AND "dp_amount" >= 0 AND
  "remaining_amount" >= 0 AND "total" = "subtotal" + "ongkir_fee" AND
  "dp_amount" + "remaining_amount" = "total"
);
ALTER TABLE "down_payments" ADD CONSTRAINT "down_payments_positive_amount" CHECK ("amount" >= 0);
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "capital_injections" ADD CONSTRAINT "capital_injections_positive_amount" CHECK ("amount" > 0);

