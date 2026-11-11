create temp table invoice_state_before as
select (select count(*) from public.invoices where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as invoice_count,
 (select count(*) from public.invoice_idempotency where request_id='20000000-0000-4000-8000-000000000001') as claim_count,
 (select count(*) from public.invoice_lines where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as line_count,
 (select count(*) from public.invoice_status_events where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as status_count,
 (select count(*) from public.invoice_audit_events where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as audit_count,
 coalesce((select next_number from public.invoice_counters where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0) as next_number;
create or replace function public.test_fail_invoice_line()
returns trigger language plpgsql set search_path=pg_catalog
as $$ begin raise exception 'INJECTED_LINE_WRITE_FAILURE' using errcode='P0001'; end $$;
create trigger test_fail_invoice_line before insert on public.invoice_lines
for each row execute function public.test_fail_invoice_line();

set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 begin
  perform * from public.create_invoice_transaction(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','invoice-create/v1','20000000-0000-4000-8000-000000000001',
   '{"header":{"shopName":"Shop A","shopAddress":"Address A","shopPhone":"+8801700000001","mapUrl":"https://maps.google.com/maps?q=shop-a"},"lines":[{"catalogItemId":null,"itemName":"Fault Tea","unit":"cup","quantity":"1","unitPrice":"12.00"}]}'::jsonb);
  raise exception 'FAULT_INJECTION_NOT_TRIGGERED';
 exception when sqlstate 'P0001' then
  if sqlerrm<>'INJECTED_LINE_WRITE_FAILURE' then raise; end if;
 end;
end $$;
reset role;
drop trigger test_fail_invoice_line on public.invoice_lines;
drop function public.test_fail_invoice_line();

do $ declare b record; n_invoice integer; n_claim integer; n_line integer; n_status integer; n_audit integer; n_next bigint; begin
 select * into b from invoice_state_before;
 select count(*) into n_invoice from public.invoices where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 select count(*) into n_claim from public.invoice_idempotency where request_id='20000000-0000-4000-8000-000000000001';
 select count(*) into n_line from public.invoice_lines where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 select count(*) into n_status from public.invoice_status_events where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 select count(*) into n_audit from public.invoice_audit_events where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 select coalesce((select next_number from public.invoice_counters where shop_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0) into n_next;
 if n_invoice<>b.invoice_count then raise exception 'PARTIAL_HEADER_COMMITTED'; end if;
 if n_claim<>b.claim_count then raise exception 'PARTIAL_CLAIM_COMMITTED'; end if;
 if n_line<>b.line_count then raise exception 'PARTIAL_LINE_COMMITTED'; end if;
 if n_status<>b.status_count then raise exception 'PARTIAL_STATUS_EVENT_COMMITTED'; end if;
 if n_audit<>b.audit_count then raise exception 'PARTIAL_AUDIT_EVENT_COMMITTED'; end if;
 if n_next<>b.next_number then raise exception 'COUNTER_NOT_ROLLED_BACK'; end if;
end $$;
select 'PASS: injected line failure rolled back header, registry and number allocation' as result;
