-- Database trigger regression for inventory-linked catalogue identity.
-- Disposable PostgreSQL 17 CI only; transaction is rolled back.
BEGIN;

INSERT INTO public.stock_items(shop_id,name,unit) VALUES
 ('10000000-0000-4000-8000-000000000011','Ｒice','pcs'),
 ('10000000-0000-4000-8000-000000000011','  Case   Rice  ','pcs'),
 ('20000000-0000-4000-8000-000000000022','Tenant Item','pcs');

INSERT INTO public.item_categories(shop_id,name,sort_order)
VALUES ('10000000-0000-4000-8000-000000000011','Guard QA Category',0);

INSERT INTO public.item_catalog(shop_id,name,unit,sale_price,category_id) VALUES
 ('10000000-0000-4000-8000-000000000011','Rice','pcs',10.00,
   (SELECT id FROM public.item_categories WHERE name='Guard QA Category' AND shop_id='10000000-0000-4000-8000-000000000011')),
 ('10000000-0000-4000-8000-000000000011','case rice','pcs',5.00,null),
 ('10000000-0000-4000-8000-000000000011','Tenant Item','pcs',2.00,null);

DO $$
DECLARE
  v_blocked boolean;
BEGIN
  IF public.normalize_inventory_product_name('Ｒice') <> public.normalize_inventory_product_name('Rice') THEN
    RAISE EXCEPTION 'FAIL: NFKC full-width identity differs';
  END IF;
  IF public.normalize_inventory_product_name('  RICE  ') <> public.normalize_inventory_product_name('rice') THEN
    RAISE EXCEPTION 'FAIL: case/outer whitespace identity differs';
  END IF;
  IF public.normalize_inventory_product_name('Case   Rice') <> public.normalize_inventory_product_name('case rice') THEN
    RAISE EXCEPTION 'FAIL: repeated whitespace identity differs';
  END IF;
  IF public.normalize_inventory_product_name(NULL) <> '' OR public.normalize_inventory_product_name('   ') <> '' THEN
    RAISE EXCEPTION 'FAIL: null/empty identity handling';
  END IF;

  -- A normalized-equivalent spelling preserves identity and remains safe.
  UPDATE public.item_catalog SET name = 'Ｒice' WHERE name = 'Rice' AND shop_id='10000000-0000-4000-8000-000000000011';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: Unicode-equivalent identity update unexpectedly missed row'; END IF;

  v_blocked := false;
  BEGIN
    UPDATE public.item_catalog SET name = 'Rice Flour' WHERE name = 'Ｒice' AND shop_id='10000000-0000-4000-8000-000000000011';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_RENAME_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: rename from Unicode-equivalent linked identity was not blocked'; END IF;

  v_blocked := false;
  BEGIN
    UPDATE public.item_catalog SET name = 'Case Rice New' WHERE name = 'case rice' AND shop_id='10000000-0000-4000-8000-000000000011';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_RENAME_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: whitespace/case-linked rename was not blocked'; END IF;

  v_blocked := false;
  BEGIN
    UPDATE public.item_catalog SET unit = 'kg' WHERE name = 'Ｒice' AND shop_id='10000000-0000-4000-8000-000000000011';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_UNIT_CHANGE_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: linked catalogue unit change was not blocked'; END IF;

  v_blocked := false;
  BEGIN
    DELETE FROM public.item_catalog WHERE name = 'Ｒice' AND shop_id='10000000-0000-4000-8000-000000000011';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'INVENTORY_LINKED_CATALOG_DELETE_BLOCKED' THEN v_blocked := true; ELSE RAISE; END IF;
  END;
  IF NOT v_blocked THEN RAISE EXCEPTION 'FAIL: linked catalogue deletion was not blocked'; END IF;

  UPDATE public.item_catalog SET sale_price = 19.99 WHERE name = 'Ｒice' AND shop_id='10000000-0000-4000-8000-000000000011';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: price-only update should remain allowed'; END IF;
  UPDATE public.item_catalog SET category_id = null WHERE name = 'Ｒice' AND shop_id='10000000-0000-4000-8000-000000000011';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: category-only update should remain allowed'; END IF;

  -- A stock row in another shop must not protect or block this tenant's catalogue row.
  UPDATE public.item_catalog SET name = 'Tenant Item Renamed'
   WHERE name = 'Tenant Item' AND shop_id='10000000-0000-4000-8000-000000000011';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: cross-tenant stock incorrectly blocked catalogue rename'; END IF;

  RAISE NOTICE 'PASS: NFKC/case/whitespace identity; linked rename/unit/delete blocked; price/category and tenant-isolated edit allowed';
END
$$;

ROLLBACK;
