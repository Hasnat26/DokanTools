-- Forward remediation for category tenant integrity and Google Maps URL safety.
-- PostgreSQL 15+ is required for column-targeted ON DELETE SET NULL.
-- This migration is additive/idempotent for databases that already applied
-- the earlier category migration; do not execute on hosted environments without PO approval.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_categories_shop_id_id_key' AND conrelid = 'public.item_categories'::regclass) THEN
    ALTER TABLE public.item_categories ADD CONSTRAINT item_categories_shop_id_id_key UNIQUE (shop_id, id);
  END IF;
END
$$;

ALTER TABLE public.item_catalog
  DROP CONSTRAINT IF EXISTS item_catalog_category_id_fkey;
ALTER TABLE public.item_catalog
  DROP CONSTRAINT IF EXISTS item_catalog_shop_category_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.item_catalog p
    LEFT JOIN public.item_categories c ON c.id = p.category_id AND c.shop_id = p.shop_id
    WHERE p.category_id IS NOT NULL AND c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'CATEGORY_TENANT_MISMATCH: resolve cross-shop or missing category references before migration';
  END IF;
END
$$;

ALTER TABLE public.item_catalog
  ADD CONSTRAINT item_catalog_shop_category_fkey
  FOREIGN KEY (shop_id, category_id)
  REFERENCES public.item_categories (shop_id, id)
  ON DELETE SET NULL (category_id);

-- Legacy map_link values are not silently rewritten. NOT VALID preserves legacy
-- rows but enforces the check on new inserts and updates; audit legacy rows separately.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shops_map_link_google_maps_check' AND conrelid = 'public.shops'::regclass) THEN
    ALTER TABLE public.shops ADD CONSTRAINT shops_map_link_google_maps_check
      CHECK (map_link IS NULL OR (length(map_link) <= 2048 AND map_link ~* '^https://(maps\.google\.(com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})|maps\.app\.goo\.gl|((www\.)?google\.(com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})))(/|[?#])')) NOT VALID;
  END IF;
END
$$;

-- Server-side guard: catalogue identity (name/unit) cannot change or be deleted
-- while a stock row is linked by normalized name. Price/category edits remain allowed.
CREATE OR REPLACE FUNCTION public.guard_inventory_linked_catalog_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_linked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.stock_items s
    WHERE s.shop_id = OLD.shop_id
      AND lower(regexp_replace(trim(s.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(OLD.name), '\s+', ' ', 'g'))
  ) INTO v_linked;
  IF NOT v_linked THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'INVENTORY_LINKED_CATALOG_DELETE_BLOCKED';
  END IF;
  IF lower(regexp_replace(trim(NEW.name), '\s+', ' ', 'g')) <> lower(regexp_replace(trim(OLD.name), '\s+', ' ', 'g')) THEN
    RAISE EXCEPTION 'INVENTORY_LINKED_CATALOG_RENAME_BLOCKED';
  END IF;
  IF NEW.unit IS DISTINCT FROM OLD.unit THEN
    RAISE EXCEPTION 'INVENTORY_LINKED_CATALOG_UNIT_CHANGE_BLOCKED';
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS item_catalog_guard_inventory_identity ON public.item_catalog;
CREATE TRIGGER item_catalog_guard_inventory_identity
  BEFORE UPDATE OF name, unit OR DELETE ON public.item_catalog
  FOR EACH ROW EXECUTE FUNCTION public.guard_inventory_linked_catalog_identity();

COMMIT;
