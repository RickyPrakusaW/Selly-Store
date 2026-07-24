-- Synchronize models that were added to schema.prisma after the initial migration.

CREATE TYPE "payment_proof_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "principal_type" VARCHAR(16) NOT NULL,
    "principal_id" UUID NOT NULL,
    "token_family_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent_hash" TEXT,
    "ip_hash" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_inventory" (
    "id" UUID NOT NULL,
    "board_name" VARCHAR(100) NOT NULL,
    "board_type" VARCHAR(80),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "board_inventory_pkey" PRIMARY KEY ("id")
);

-- Preserve existing booking references when upgrading a populated database.
INSERT INTO "board_inventory" (
    "id",
    "board_name",
    "board_type",
    "is_active",
    "created_at"
)
SELECT
    "id",
    "unit_code",
    "display_name",
    "is_active",
    "created_at"
FROM "rental_units"
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "financial_reports" (
    "id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "gross_revenue" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "gross_profit" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE INDEX "admin_users_role_is_active_idx" ON "admin_users"("role", "is_active");
CREATE INDEX "auth_sessions_principal_type_principal_id_idx"
ON "auth_sessions"("principal_type", "principal_id");
CREATE INDEX "auth_sessions_token_family_id_idx"
ON "auth_sessions"("token_family_id");
CREATE INDEX "auth_sessions_expires_at_revoked_at_idx"
ON "auth_sessions"("expires_at", "revoked_at");
CREATE UNIQUE INDEX "board_inventory_board_name_key"
ON "board_inventory"("board_name");
CREATE UNIQUE INDEX "financial_reports_period_start_period_end_key"
ON "financial_reports"("period_start", "period_end");

ALTER TABLE "board_bookings"
DROP CONSTRAINT "board_bookings_board_id_fkey";

ALTER TABLE "board_bookings"
ADD CONSTRAINT "board_bookings_board_id_fkey"
FOREIGN KEY ("board_id") REFERENCES "board_inventory"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER INDEX "board_bookings_booking_range_status_idx"
RENAME TO "board_bookings_booking_date_booking_end_date_status_idx";
