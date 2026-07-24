-- AlterTable Check Constraint for Product Stock Types
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_valid_po_days";

ALTER TABLE "products" ADD CONSTRAINT "products_valid_po_days" CHECK (
  ("stock_type"::text = 'pre_order' AND "po_days" > 0) OR
  ("stock_type"::text IN ('ready_stock', 'rental_unit'))
);
