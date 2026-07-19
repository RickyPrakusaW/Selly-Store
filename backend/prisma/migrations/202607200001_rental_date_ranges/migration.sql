-- Model rental occupancy as half-open date ranges: [booking_date, booking_end_date).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "cart_items" ADD COLUMN "booking_end_date" DATE;
ALTER TABLE "order_items" ADD COLUMN "booking_end_date" DATE;
ALTER TABLE "board_bookings" ADD COLUMN "booking_end_date" DATE;

UPDATE "board_bookings"
SET "booking_end_date" = "booking_date" + INTERVAL '1 day'
WHERE "booking_end_date" IS NULL;

ALTER TABLE "board_bookings" ALTER COLUMN "booking_end_date" SET NOT NULL;
ALTER TABLE "board_bookings"
ADD CONSTRAINT "board_booking_valid_range"
CHECK ("booking_end_date" > "booking_date");

DROP INDEX IF EXISTS "active_board_booking_per_date";
DROP INDEX IF EXISTS "board_bookings_booking_date_status_idx";

CREATE INDEX "board_bookings_booking_range_status_idx"
ON "board_bookings" ("booking_date", "booking_end_date", "status");

ALTER TABLE "board_bookings"
ADD CONSTRAINT "board_booking_no_active_overlap"
EXCLUDE USING gist (
  "board_id" WITH =,
  daterange("booking_date", "booking_end_date", '[)') WITH &&
)
WHERE ("status" IN ('soft_locked', 'confirmed'));

DROP INDEX IF EXISTS "unique_cart_item";
CREATE UNIQUE INDEX "unique_cart_item"
ON "cart_items" (
  "user_id",
  "product_id",
  COALESCE("variant_id", '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE("booking_date", '1970-01-01'::date),
  COALESCE("booking_end_date", '1970-01-02'::date)
);
