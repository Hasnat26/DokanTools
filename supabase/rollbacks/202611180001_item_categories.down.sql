-- CH-3 category migration rollback.
-- DESTRUCTIVE: this removes every category and every product/category assignment.
-- Product rows in public.item_catalog remain; their category_id column is removed.
-- Review/backup category records and assignments before any future execution.
begin;

alter table public.item_catalog
  drop constraint if exists item_catalog_shop_category_fkey;
alter table public.item_catalog
  drop constraint if exists item_catalog_category_id_fkey;
alter table public.item_catalog
  drop column if exists category_id;
drop table if exists public.item_categories;

commit;
