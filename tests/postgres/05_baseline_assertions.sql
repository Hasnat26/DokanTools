-- Assertions for the pinned consolidated schema before the remaining additive P0/invoice migrations.
do $$
begin
 if to_regclass('public.shops') is null or to_regclass('public.item_catalog') is null
  or to_regclass('public.transaction_requests') is null or to_regclass('public.stock_movements') is null
  or to_regclass('public.audit_events') is null then
  raise exception 'PINNED_SCHEMA_MISSING_INVENTORY_OR_RELIABILITY_OBJECTS';
 end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='shops' and column_name='is_public') then
  raise exception 'PINNED_SCHEMA_MISSING_SHOPS_IS_PUBLIC';
 end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='stock_items' and column_name='is_public') then
  raise exception 'PINNED_SCHEMA_MISSING_STOCK_IS_PUBLIC';
 end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='transaction_requests' and column_name='payload_json') then
  raise exception 'PINNED_SCHEMA_MISSING_P0_PAYLOAD_JSON';
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='owner reads customers')
  or not exists(select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='owner creates customers')
  or not exists(select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='owner updates customers') then
  raise exception 'PINNED_SCHEMA_MISSING_SPLIT_CUSTOMER_POLICIES';
 end if;
 if to_regclass('public.invoices') is not null then raise exception 'INVOICE_TABLE_ALREADY_PRESENT_IN_BASELINE'; end if;
end $$;
select 'PASS: pinned consolidated schema contains inventory/reliability/P0 baseline; invoice schema absent' as result;
