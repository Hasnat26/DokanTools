-- Minimal Supabase-compatible PostgreSQL 17 fixture for CH-3 migration CI.
-- Disposable CI database only; never run against a shared or production project.
create schema auth;
create role authenticated nologin;
create role anon nologin;

grant usage on schema public, auth to authenticated;

create table auth.users (
  id uuid primary key
);

-- Supabase-compatible per-request identity source. Tests set the JWT subject
-- claim while executing as the non-owner authenticated role.
create function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant execute on function auth.uid() to authenticated;

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null
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
  created_at timestamptz not null default now(),
  unique (shop_id, name)
);

alter table public.shops enable row level security;
alter table public.item_catalog enable row level security;

create policy "owner reads own shops" on public.shops
  for select to authenticated using (auth.uid() = user_id);
create policy "owner creates own shop" on public.shops
  for insert to authenticated with check (auth.uid() = user_id);
create policy "owner updates own shop" on public.shops
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "owner manages item catalog" on public.item_catalog
  for all to authenticated
  using (exists (select 1 from public.shops s where s.id = item_catalog.shop_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = item_catalog.shop_id and s.user_id = auth.uid()));

grant select on public.shops to authenticated;

insert into auth.users(id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002');

insert into public.shops(id,user_id,shop_name) values
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001','CH3 Test Shop A'),
  ('20000000-0000-4000-8000-000000000022','20000000-0000-4000-8000-000000000002','CH3 Test Shop B');
