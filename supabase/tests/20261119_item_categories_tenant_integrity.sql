-- CH-3 category tenant-integrity regression test.
-- Run only against a disposable isolated QA database AFTER the corrected migration.
-- All fixture writes are enclosed in a transaction and rolled back.
-- Requires at least two existing shops; it does not read or print their identifiers.
begin;

do $$
declare
  v_shop_a uuid;
  v_shop_b uuid;
  v_category_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_token text := replace(gen_random_uuid()::text, '-', '');
  v_cross_shop_rejected boolean := false;
  v_shop_id_after_delete uuid;
  v_category_after_delete uuid;
begin
  select id into v_shop_a from public.shops order by id limit 1;
  select id into v_shop_b from public.shops order by id offset 1 limit 1;

  if v_shop_a is null or v_shop_b is null or v_shop_a = v_shop_b then
    raise exception 'TEST_FIXTURE_REQUIRED: at least two isolated QA shops are required';
  end if;

  -- Positive path: create/read/update category and associate a product in the same shop.
  insert into public.item_categories(shop_id, name, sort_order)
  values (v_shop_a, '__ch3_category_' || v_token, 10)
  returning id into v_category_id;

  if not exists (
    select 1 from public.item_categories
    where id = v_category_id and shop_id = v_shop_a
  ) then
    raise exception 'FAIL: category create/read';
  end if;

  update public.item_categories
  set name = '__ch3_category_updated_' || v_token
  where id = v_category_id and shop_id = v_shop_a;

  if not exists (
    select 1 from public.item_categories
    where id = v_category_id and shop_id = v_shop_a
      and name = '__ch3_category_updated_' || v_token
  ) then
    raise exception 'FAIL: category update';
  end if;

  v_product_name := '__ch3_product_' || v_token;
  insert into public.item_catalog(shop_id, name, unit, purchase_price, sale_price, category_id)
  values (v_shop_a, v_product_name, 'pcs', 1, 2, null)
  returning id into v_product_id;

  update public.item_catalog
  set category_id = v_category_id
  where id = v_product_id and shop_id = v_shop_a;

  if not exists (
    select 1 from public.item_catalog
    where id = v_product_id and shop_id = v_shop_a and category_id = v_category_id
  ) then
    raise exception 'FAIL: same-shop product/category association';
  end if;

  -- Negative path: PostgreSQL must reject Shop B's product referencing Shop A's category.
  begin
    insert into public.item_catalog(shop_id, name, unit, purchase_price, sale_price, category_id)
    values (v_shop_b, '__ch3_cross_shop_' || v_token, 'pcs', 1, 2, v_category_id);
    raise exception 'FAIL: cross-shop category association was accepted';
  exception
    when foreign_key_violation then
      v_cross_shop_rejected := true;
  end;

  if not v_cross_shop_rejected then
    raise exception 'FAIL: cross-shop category association was not rejected';
  end if;

  -- Delete category: category_id becomes NULL, while product.shop_id is preserved.
  delete from public.item_categories
  where id = v_category_id and shop_id = v_shop_a;

  select shop_id, category_id
    into v_shop_id_after_delete, v_category_after_delete
  from public.item_catalog where id = v_product_id;

  if v_shop_id_after_delete is distinct from v_shop_a then
    raise exception 'FAIL: category deletion changed item_catalog.shop_id';
  end if;
  if v_category_after_delete is not null then
    raise exception 'FAIL: category deletion did not clear category_id';
  end if;

  delete from public.item_catalog where id = v_product_id;

  -- Confirm RLS remains enabled and the owner-scoped policy is present.
  if not (
    select c.relrowsecurity
    from pg_class c
    where c.oid = 'public.item_categories'::regclass
  ) then
    raise exception 'FAIL: item_categories RLS is not enabled';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'item_categories'
      and policyname = 'owner manages item categories'
      and 'authenticated' = any(roles)
      and cmd = 'ALL'
      and qual ilike '%auth.uid()%'
      and with_check ilike '%auth.uid()%'
  ) then
    raise exception 'FAIL: owner-scoped category RLS policy missing';
  end if;

  raise notice 'PASS: same-shop association; category create/read/update/delete; cross-shop FK rejection; shop_id preservation; RLS metadata';
end
$$;

rollback;
