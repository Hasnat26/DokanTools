\set ON_ERROR_STOP on
do $$
declare
  v_count integer;
  v_issue boolean;
  v_cfg text[];
  v_owner_select integer;
  v_bad integer;
begin
  select count(*) into v_count from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname in('invoices','invoice_lines') and c.relrowsecurity;
  if v_count<>2 then raise exception 'LS01: invoice RLS is not enabled on both tables'; end if;
  select count(*) into v_owner_select from pg_policies
   where schemaname='public' and tablename in('invoices','invoice_lines')
     and cmd='SELECT' and roles @> array['authenticated']::name[]
     and coalesce(qual,'') ilike '%shops%' and coalesce(qual,'') ilike '%auth.uid%';
  if v_owner_select<>2 then raise exception 'LS01: expected owner SELECT policies missing'; end if;
  select count(*) into v_bad from (
    select (
      has_table_privilege('anon','public.invoices','SELECT') or
      has_table_privilege('anon','public.invoice_lines','SELECT') or
      has_table_privilege('anon','public.invoices','INSERT') or
      has_table_privilege('anon','public.invoice_lines','INSERT') or
      has_table_privilege('anon','public.invoices','UPDATE') or
      has_table_privilege('anon','public.invoice_lines','UPDATE') or
      has_table_privilege('anon','public.invoices','DELETE') or
      has_table_privilege('anon','public.invoice_lines','DELETE') or
      has_table_privilege('authenticated','public.invoices','INSERT') or
      has_table_privilege('authenticated','public.invoice_lines','INSERT') or
      has_table_privilege('authenticated','public.invoices','UPDATE') or
      has_table_privilege('authenticated','public.invoice_lines','UPDATE') or
      has_table_privilege('authenticated','public.invoices','DELETE') or
      has_table_privilege('authenticated','public.invoice_lines','DELETE')
    ) as unexpected
  ) q where unexpected;
  if v_bad<>0 then raise exception 'LS01: unexpected invoice client privileges'; end if;
  select count(*) into v_bad from unnest(array['invoice_counters','invoice_idempotency','invoice_status_events','invoice_audit_events','invoice_runtime_controls']) as x(table_name)
   where has_table_privilege('anon','public.'||table_name,'SELECT')
      or has_table_privilege('authenticated','public.'||table_name,'SELECT');
  if v_bad<>0 then raise exception 'LS01: internal invoice table SELECT grant detected'; end if;
  select prosecdef, proconfig into v_issue, v_cfg from pg_proc
   where oid='public.create_invoice_transaction(uuid,text,uuid,jsonb)'::regprocedure;
  if not coalesce(v_issue,false) or not ('search_path=pg_catalog'=any(coalesce(v_cfg,array[]::text[]))) then
    raise exception 'LS01: RPC must remain SECURITY DEFINER with search_path=pg_catalog';
  end if;
  if has_function_privilege('anon','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE')
     or has_function_privilege('anon','public.reject_invoice_fact_mutation()','EXECUTE')
     or has_function_privilege('authenticated','public.reject_invoice_fact_mutation()','EXECUTE')
     or not has_function_privilege('authenticated','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE')
     or exists (
       select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
       where p.oid='public.create_invoice_transaction(uuid,text,uuid,jsonb)'::regprocedure
         and a.grantee=0 and a.privilege_type='EXECUTE'
     ) then
    raise exception 'LS01: RPC EXECUTE ACL mismatch (anon/PUBLIC must be denied; authenticated must be granted)';
  end if;
  select issue_enabled into v_issue from public.invoice_runtime_controls where control_key='invoice_issue';
  if v_issue is distinct from false then raise exception 'LS01: invoice issue flag must be OFF'; end if;
  select count(*) into v_count from pg_trigger t
   join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname in('invoices','invoice_lines') and not t.tgisinternal
    and t.tgname in('invoices_immutable','invoice_lines_immutable');
  if v_count<>2 then raise exception 'LS01: immutable invoice triggers missing'; end if;
  raise notice 'LS01 PASS: real Supabase Postgres catalog, grants, RLS, RPC, triggers and issue flag.';
end $$;
