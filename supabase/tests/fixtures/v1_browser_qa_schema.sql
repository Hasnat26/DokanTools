-- Disposable local-browser QA schema. Not a migration and not for hosted databases.
-- Contains V1 Shop Profile, base catalogue table, and a minimal stock_items linkage fixture.
-- No stock RPC/deduction, ledger or invoice schema is provisioned.
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null,
  shop_type text not null default 'grocery'
    check (shop_type in ('grocery','pharmacy','food','salon','general')),
  owner_name text,
  phone text,
  address text,
  map_link text,
  logo_url text,
  plan text not null default 'free' check (plan in ('free','pro')),
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  is_public boolean not null default false
);
create index shops_user_id_idx on public.shops(user_id);

-- Base catalogue table; category_id and category FK are created by the real migration.
create table public.item_catalog (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, name)
);

-- Minimal inventory rows are included only for catalogue/stock linkage checks.
-- No stock RPC, stock deduction, ledger or invoice schema is provisioned.
create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  qty numeric(14,3) not null default 0,
  expiry_date date,
  sort_order integer not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.stock_items enable row level security;
alter table public.item_catalog enable row level security;

create policy "owner reads own shops" on public.shops
  for select to authenticated using (user_id = (select auth.uid()));
create policy "owner creates own shop" on public.shops
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "owner updates own shop" on public.shops
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "owner manages stock items" on public.stock_items
  for all to authenticated
  using (exists(select 1 from public.shops s where s.id=stock_items.shop_id and s.user_id=(select auth.uid())))
  with check (exists(select 1 from public.shops s where s.id=stock_items.shop_id and s.user_id=(select auth.uid())));

create policy "owner manages item catalog" on public.item_catalog
  for all to authenticated
  using (exists(select 1 from public.shops s where s.id=item_catalog.shop_id and s.user_id=(select auth.uid())))
  with check (exists(select 1 from public.shops s where s.id=item_catalog.shop_id and s.user_id=(select auth.uid())));

grant select,insert,update,delete on public.shops to authenticated;
grant select,insert,update,delete on public.stock_items to authenticated;
create function public.create_stock_item(
  p_request_id uuid, p_shop_id uuid, p_name text, p_unit text,
  p_purchase_price numeric, p_sale_price numeric, p_initial_qty numeric,
  p_expiry_date date, p_sort_order integer
) returns table(result_stock_id uuid)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  insert into public.stock_items(shop_id,name,unit,purchase_price,sale_price,price,qty,expiry_date,sort_order)
  values(p_shop_id,p_name,p_unit,p_purchase_price,p_sale_price,p_sale_price,p_initial_qty,p_expiry_date,p_sort_order)
  returning id into v_id;
  return query select v_id;
end
$$;
grant execute on function public.create_stock_item(uuid,uuid,text,text,numeric,numeric,numeric,date,integer) to authenticated;

grant select,insert,update,delete on public.item_catalog to authenticated;
-- The tables are created after Supabase/PostgREST starts; refresh its schema cache.
notify pgrst, 'reload schema';
select pg_sleep(1);
