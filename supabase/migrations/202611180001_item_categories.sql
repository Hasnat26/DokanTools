-- Shop-scoped catalogue categories for the Draft Memo MVP.
-- This migration is intentionally independent of stock_items/baki_entries.
-- Requires public.shops and public.item_catalog with item_catalog.shop_id -> shops.id.
--
-- Tenant integrity:
--   item_categories has UNIQUE (shop_id, id).
--   item_catalog references (shop_id, category_id) -> (shop_id, id).
--   ON DELETE SET NULL targets category_id only, preserving item_catalog.shop_id.
--
-- Rollback (destructive to category assignments and category records):
--   ALTER TABLE public.item_catalog DROP CONSTRAINT IF EXISTS item_catalog_shop_category_fkey;
--   ALTER TABLE public.item_catalog DROP COLUMN IF EXISTS category_id;
--   DROP TABLE IF EXISTS public.item_categories;
-- Products in item_catalog remain; their category assignments are lost.

create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint item_categories_shop_id_id_key unique (shop_id, id),
  constraint item_categories_shop_id_name_key unique (shop_id, name)
);

-- Also support an existing category table created by an earlier draft of this migration.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.item_categories'::regclass
      and conname = 'item_categories_shop_id_id_key'
  ) then
    alter table public.item_categories
      add constraint item_categories_shop_id_id_key unique (shop_id, id);
  end if;
end
$$;

alter table public.item_catalog
  add column if not exists category_id uuid;

-- Refuse to install the composite FK if pre-existing data contains a
-- cross-shop category association. Do not silently rewrite tenant ownership.
do $$
begin
  if exists (
    select 1
    from public.item_catalog p
    left join public.item_categories c
      on c.id = p.category_id and c.shop_id = p.shop_id
    where p.category_id is not null and c.id is null
  ) then
    raise exception
      'CATEGORY_TENANT_MISMATCH: item_catalog contains a category from another shop or a missing category';
  end if;
end
$$;

-- Remove the earlier single-column FK, if present. The composite FK below
-- replaces it and enforces the tenant boundary at PostgreSQL level.
alter table public.item_catalog
  drop constraint if exists item_catalog_category_id_fkey;

alter table public.item_catalog
  drop constraint if exists item_catalog_shop_category_fkey;

alter table public.item_catalog
  add constraint item_catalog_shop_category_fkey
  foreign key (shop_id, category_id)
  references public.item_categories (shop_id, id)
  on delete set null (category_id);

alter table public.item_categories enable row level security;
drop policy if exists "owner manages item categories" on public.item_categories;
create policy "owner manages item categories" on public.item_categories
  for all to authenticated
  using (
    exists (
      select 1 from public.shops s
      where s.id = item_categories.shop_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops s
      where s.id = item_categories.shop_id and s.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.item_categories to authenticated;
