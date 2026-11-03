-- DokanTools existing-project migration (run only if you already applied the original schema).
alter table public.shops
  add column if not exists shop_type text not null default 'grocery';
alter table public.shops
  drop constraint if exists shops_shop_type_check;
alter table public.shops
  add constraint shops_shop_type_check check (shop_type in ('grocery','pharmacy','food','salon','general'));

alter table public.baki_entries
  add column if not exists items_json jsonb not null default '[]'::jsonb;

alter table public.stock_items
  add column if not exists unit text not null default 'পিস',
  add column if not exists purchase_price numeric(12,2) not null default 0,
  add column if not exists sale_price numeric(12,2) not null default 0,
  add column if not exists sort_order integer not null default 0;

create table if not exists public.item_catalog (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  unit text not null default 'পিস',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, name)
);
alter table public.item_catalog enable row level security;
drop policy if exists "owner manages item catalog" on public.item_catalog;
create policy "owner manages item catalog" on public.item_catalog for all to authenticated
using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()))
with check (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));
drop policy if exists "public reads item catalog" on public.item_catalog;
create policy "public reads item catalog" on public.item_catalog for select to anon, authenticated using (is_active = true);
