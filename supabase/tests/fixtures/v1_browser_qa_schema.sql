-- Disposable local-browser QA schema. Not a migration and not for hosted databases.
-- Contains only V1 Shop Profile, catalogue and category tables; no stock/ledger/invoice schema.
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

create table public.item_categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint item_categories_shop_id_id_key unique(shop_id,id),
  constraint item_categories_shop_id_name_key unique(shop_id,name)
);

create table public.item_catalog (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  category_id uuid,
  created_at timestamptz not null default now(),
  constraint item_catalog_shop_name_key unique(shop_id,name),
  constraint item_catalog_shop_category_fkey
    foreign key(shop_id,category_id)
    references public.item_categories(shop_id,id)
    on delete set null(category_id)
);

alter table public.shops enable row level security;
alter table public.item_catalog enable row level security;
alter table public.item_categories enable row level security;

create policy "owner reads own shops" on public.shops
  for select to authenticated using (user_id = (select auth.uid()));
create policy "owner creates own shop" on public.shops
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "owner updates own shop" on public.shops
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "owner manages item catalog" on public.item_catalog
  for all to authenticated
  using (exists(select 1 from public.shops s where s.id=item_catalog.shop_id and s.user_id=(select auth.uid())))
  with check (exists(select 1 from public.shops s where s.id=item_catalog.shop_id and s.user_id=(select auth.uid())));

create policy "owner manages item categories" on public.item_categories
  for all to authenticated
  using (exists(select 1 from public.shops s where s.id=item_categories.shop_id and s.user_id=(select auth.uid())))
  with check (exists(select 1 from public.shops s where s.id=item_categories.shop_id and s.user_id=(select auth.uid())));

grant select,insert,update,delete on public.shops to authenticated;
grant select,insert,update,delete on public.item_catalog to authenticated;
grant select,insert,update,delete on public.item_categories to authenticated;

-- The tables are created after Supabase/PostgREST starts; refresh its schema cache.
notify pgrst, 'reload schema';
select pg_sleep(1);
