-- Runtime RLS isolation regression for item_categories.
-- Execute only against the disposable PostgreSQL 17 CI database after migration.
-- Runs as the non-owner authenticated role with two distinct JWT subject claims.
-- All writes are rolled back.
begin;

-- Seed no category as table owner; all category operations below use authenticated.
set local role authenticated;

do $$
declare
  v_user_a constant uuid := '10000000-0000-4000-8000-000000000001';
  v_user_b constant uuid := '20000000-0000-4000-8000-000000000002';
  v_shop_a constant uuid := '10000000-0000-4000-8000-000000000011';
  v_shop_b constant uuid := '20000000-0000-4000-8000-000000000022';
  v_category_a uuid;
  v_category_b uuid;
  v_count integer;
  v_rows integer;
  v_insert_denied boolean := false;
begin
  -- User A's legitimate category create/read.
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  insert into public.item_categories(shop_id, name)
  values (v_shop_a, '__rls_user_a_category")
  returning id into v_category_a;

  select count(*) into v_count from public.item_categories
  where id = v_category_a and shop_id = v_shop_a;
  if v_count <> 1 then raise exception 'FAIL: User A cannot read own category'; end if;

  -- Switch identity within the same authenticated role. User B must not see,
  -- insert into, update, or delete User A's category.
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);

  select count(*) into v_count from public.item_categories
  where id = v_category_a and shop_id = v_shop_a;
  if v_count <> 0 then raise exception 'FAIL: User B read User A category'; end if;

  begin
    insert into public.item_categories(shop_id, name)
    values (v_shop_a, '__rls_user_b_cross_tenant_insert');
    v_insert_denied := false;
  exception
    when insufficient_privilege then v_insert_denied := true;
  end;
  if not v_insert_denied then raise exception 'FAIL: User B inserted into User A shop'; end if;

  update public.item_categories set name = '__rls_user_b_modified_a'
  where id = v_category_a and shop_id = v_shop_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL: User B updated User A category'; end if;

  delete from public.item_categories
  where id = v_category_a and shop_id = v_shop_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL: User B deleted User A category'; end if;

  -- User B's legitimate owner CRUD must continue to work.
  insert into public.item_categories(shop_id, name)
  values (v_shop_b, '__rls_user_b_category')
  returning id into v_category_b;

  select count(*) into v_count from public.item_categories
  where id = v_category_b and shop_id = v_shop_b;
  if v_count <> 1 then raise exception 'FAIL: User B cannot read own category'; end if;

  update public.item_categories set name = '__rls_user_b_category_updated'
  where id = v_category_b and shop_id = v_shop_b;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL: User B cannot update own category'; end if;

  delete from public.item_categories
  where id = v_category_b and shop_id = v_shop_b;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL: User B cannot delete own category'; end if;

  -- Switch back and prove User A's update/delete still work.
  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  update public.item_categories set name = '__rls_user_a_category_updated'
  where id = v_category_a and shop_id = v_shop_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL: User A cannot update own category'; end if;

  delete from public.item_categories
  where id = v_category_a and shop_id = v_shop_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL: User A cannot delete own category'; end if;

  raise notice 'PASS: authenticated User B denied read/insert/update/delete against User A category; both owners retain legitimate category CRUD';
end
$$;

reset role;
rollback;
