-- Shop-scoped catalogue categories (draft memo/catalogue foundation).
-- Apply after 20261019_inventory_catalog.sql.
create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (shop_id, name)
);

alter table public.item_catalog
  add column if not exists category_id uuid references public.item_categories(id) on delete set null;

alter table public.item_categories enable row level security;
drop policy if exists "owner manages item categories" on public.item_categories;
create policy "owner manages item categories" on public.item_categories
  for all to authenticated
  using (exists (
    select 1 from public.shops s where s.id = item_categories.shop_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shops s where s.id = item_categories.shop_id and s.user_id = auth.uid()
  ));

grant select, insert, update, delete on public.item_categories to authenticated;
