DO $$
BEGIN
  IF to_regclass('public.shops') IS NULL
     OR to_regclass('public.item_catalog') IS NULL
     OR to_regclass('public.stock_items') IS NULL
     OR to_regclass('public.item_categories') IS NULL
     OR to_regclass('public.invoice_runtime_controls') IS NULL THEN
    RAISE EXCEPTION 'V1_MIGRATION_PARITY_FAIL: required V1 tables are missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='item_catalog' AND column_name='category_id'
  ) THEN
    RAISE EXCEPTION 'V1_MIGRATION_PARITY_FAIL: item_catalog.category_id missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.item_catalog'::regclass AND conname='item_catalog_shop_category_fkey'
  ) THEN
    RAISE EXCEPTION 'V1_MIGRATION_PARITY_FAIL: composite tenant category FK missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.item_catalog'::regclass AND tgname='item_catalog_guard_inventory_identity' AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'V1_MIGRATION_PARITY_FAIL: stock/catalogue identity trigger missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_runtime_controls
    WHERE control_key='invoice_issue' AND issue_enabled=false
  ) THEN
    RAISE EXCEPTION 'INVOICE_ISSUE_MUST_REMAIN_OFF';
  END IF;
END
$$;
