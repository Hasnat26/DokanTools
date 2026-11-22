-- Database trigger regression for inventory-linked catalogue identity.
-- Disposable PostgreSQL 17 CI only; no persistent/hosted writes.
BEGIN;

INSERT INTO public.stock_items(shop_id,name,unit)
VALUES ('10000000-0000-4000-8000-000000000011','__guard_linked_product','piece');
INSERT INTO public.item_catalog(shop_id,name,unit)
VALUES ('10000000-0000-4000-8000-000000000011','__guard_linked_product','pcs');

DO $$
DECLARE
  v_blocked boolean;
BEGIN
  v_blocked := false;
  BEGIN
    UPDATE public.item_catalog SET unit = 'kg' WHERE name = '__guard_linked_product';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_UNIT_CHANGE_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: linked catalogue unit change was not blocked'; END IF;

  v_blocked := false;
  BEGIN
    UPDATE public.item_catalog SET name = '__guard_renamed_product' WHERE name = '__guard_linked_product';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_RENAME_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: linked catalogue rename was not blocked'; END IF;

  v_blocked := false;
  BEGIN
    DELETE FROM public.item_catalog WHERE name = '__guard_linked_product';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_DELETE_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: linked catalogue deletion was not blocked'; END IF;

  UPDATE public.item_catalog SET sale_price = 19.99 WHERE name = '__guard_linked_product';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: price-only update should remain allowed'; END IF;
  RAISE NOTICE 'PASS: linked catalog rename/unit/delete blocked; price-only edit allowed';
END
$$;

ROLLBACK;
