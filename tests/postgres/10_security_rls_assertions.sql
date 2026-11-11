-- Runtime security and two-tenant assertions.
do $$
declare v_owner text; v_cfg text[]; v_secdef boolean; v_public_exec boolean; n integer;
begin
 if not (select relrowsecurity from pg_class where oid='public.invoices'::regclass) then raise exception 'RLS_NOT_ENABLED_INVOICES'; end if;
 if not (select relrowsecurity from pg_class where oid='public.invoice_lines'::regclass) then raise exception 'RLS_NOT_ENABLED_LINES'; end if;
 if has_table_privilege('anon','public.invoices','SELECT') then raise exception 'ANON_CAN_SELECT_INVOICES'; end if;
 if has_table_privilege('authenticated','public.invoices','INSERT') or has_table_privilege('authenticated','public.invoices','UPDATE') or has_table_privilege('authenticated','public.invoices','DELETE') then raise exception 'AUTH_CAN_MUTATE_INVOICES'; end if;
 if has_table_privilege('authenticated','public.invoice_lines','INSERT') or has_table_privilege('authenticated','public.invoice_lines','UPDATE') or has_table_privilege('authenticated','public.invoice_lines','DELETE') then raise exception 'AUTH_CAN_MUTATE_LINES'; end if;
 if has_table_privilege('authenticated','public.invoice_idempotency','SELECT') or has_table_privilege('authenticated','public.invoice_counters','SELECT') or has_table_privilege('authenticated','public.invoice_runtime_controls','SELECT') then raise exception 'PRIVATE_TABLE_GRANT'; end if;
 select p.prosecdef,pg_get_userbyid(p.proowner),p.proconfig into v_secdef,v_owner,v_cfg
 from pg_proc p where p.oid='public.create_invoice_transaction(uuid,text,uuid,jsonb)'::regprocedure;
 if not v_secdef then raise exception 'RPC_NOT_SECURITY_DEFINER'; end if;
 if v_owner<>current_user then raise exception 'RPC_OWNER_MISMATCH expected %, got %',current_user,v_owner; end if;
 if not exists(select 1 from pg_roles r where r.rolname=v_owner and r.rolsuper) then raise exception 'HARNESS_EXPECTS_SUPERUSER_MIGRATION_OWNER'; end if;
 if v_cfg is null or not ('search_path=pg_catalog'=any(v_cfg)) then raise exception 'RPC_SEARCH_PATH_NOT_LOCKED: %',v_cfg; end if;
 if not has_function_privilege('authenticated','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE') then raise exception 'AUTH_EXECUTE_MISSING'; end if;
 if has_function_privilege('anon','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE') then raise exception 'ANON_EXECUTE_GRANTED'; end if;
 select exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE')
 into v_public_exec from pg_proc p where p.oid='public.create_invoice_transaction(uuid,text,uuid,jsonb)'::regprocedure;
 if v_public_exec then raise exception 'PUBLIC_EXECUTE_GRANTED'; end if;
 if not has_table_privilege('authenticated','public.invoices','SELECT') then raise exception 'AUTH_SELECT_MISSING'; end if;
end $$;

set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ declare n integer; begin
 select count(*) into n from public.invoices; if n<>1 then raise exception 'TENANT_A_INVOICE_COUNT_%',n; end if;
 select count(*) into n from public.invoices where shop_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; if n<>0 then raise exception 'TENANT_A_READ_B'; end if;
 select count(*) into n from public.invoice_lines; if n<>1 then raise exception 'TENANT_A_LINE_COUNT_%',n; end if;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
do $$ declare n integer; begin
 select count(*) into n from public.invoices; if n<>1 then raise exception 'TENANT_B_INVOICE_COUNT_%',n; end if;
 select count(*) into n from public.invoices where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; if n<>0 then raise exception 'TENANT_B_READ_A'; end if;
 select count(*) into n from public.invoice_lines; if n<>1 then raise exception 'TENANT_B_LINE_COUNT_%',n; end if;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 begin
  perform * from public.create_invoice_transaction(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','invoice-create/v1','10000000-0000-4000-8000-000000000004',
   '{"header":{"shopName":"Shop B","shopAddress":"Address B","shopPhone":"+8801700000002","mapUrl":"https://maps.google.com/maps?q=shop-b"},"lines":[{"catalogItemId":null,"itemName":"Tea","unit":"cup","quantity":"1","unitPrice":"10.00"}]}'::jsonb);
  raise exception 'CROSS_TENANT_RPC_SHOULD_FAIL';
 exception when insufficient_privilege then
  if sqlerrm not like 'SHOP_NOT_FOUND_OR_ACCESS_DENIED%' then raise; end if;
 end;
end $$;
reset role;

do $$ declare v_id uuid; begin
 select id into v_id from public.invoices where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 begin update public.invoices set total_amount=total_amount where id=v_id; raise exception 'INVOICE_UPDATE_SHOULD_FAIL';
 exception when sqlstate '55000' then null; end;
 begin update public.invoice_lines set line_total=line_total where invoice_id=v_id; raise exception 'LINE_UPDATE_SHOULD_FAIL';
 exception when sqlstate '55000' then null; end;
end $$;
select 'PASS: security-definer ACL/search_path, two-tenant RLS, cross-tenant denial, immutable facts' as result;
