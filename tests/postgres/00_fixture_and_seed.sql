-- Synthetic two-tenant fixture. Local disposable database only.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
insert into public.shops(id,user_id,shop_name,phone,address,map_link) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Shop A','+8801700000001','Address A','https://maps.google.com/maps?q=shop-a'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Shop B','+8801700000002','Address B','https://maps.google.com/maps?q=shop-b'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Shop C',null,null,null),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Shop D','+8801700000004','Address D',null),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Shop E','+8801700000005','Address E','https://evil.example/path');
-- Verify the production-default gate rejects direct RPC calls before any write.
set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 begin
  perform * from public.create_invoice_transaction(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','invoice-create/v1','10000000-0000-4000-8000-000000000009',
   '{"header":{"shopName":"Shop A","shopAddress":"Address A","shopPhone":"+8801700000001","mapUrl":"https://maps.google.com/maps?q=shop-a"},"lines":[{"catalogItemId":null,"itemName":"Tea","unit":"cup","quantity":"1","unitPrice":"10.00"}]}'::jsonb);
  raise exception 'ISSUE_GATE_SHOULD_REJECT';
 exception when sqlstate '55000' then
  if sqlerrm<>'INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL' then raise; end if;
 end;
end $$;
reset role;
-- Privileged test-only override. The committed migration default remains false.
update public.invoice_runtime_controls set issue_enabled=true where control_key='invoice_issue';

set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select * from public.create_invoice_transaction(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','invoice-create/v1','10000000-0000-4000-8000-000000000001',
 '{"header":{"shopName":"Shop A","shopAddress":"Address A","shopPhone":"+8801700000001","mapUrl":"https://maps.google.com/maps?q=shop-a"},"lines":[{"catalogItemId":null,"itemName":"Tea","unit":"cup","quantity":"1","unitPrice":"10.00"}]}'::jsonb);
reset role;

set role authenticated;
set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select * from public.create_invoice_transaction(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','invoice-create/v1','10000000-0000-4000-8000-000000000002',
 '{"header":{"shopName":"Shop B","shopAddress":"Address B","shopPhone":"+8801700000002","mapUrl":"https://maps.google.com/maps?q=shop-b"},"lines":[{"catalogItemId":null,"itemName":"Coffee","unit":"cup","quantity":"1","unitPrice":"15.00"}]}'::jsonb);
reset role;

-- The baseline permits nullable phone/address/map_link; issue RPC fails closed for such a row.
set role authenticated;
set request.jwt.claim.sub='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$
begin
 begin
  perform * from public.create_invoice_transaction(
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc','invoice-create/v1','10000000-0000-4000-8000-000000000003',
   '{"header":{"shopName":"Shop C","shopAddress":null,"shopPhone":null,"mapUrl":null},"lines":[{"catalogItemId":null,"itemName":"Water","unit":"bottle","quantity":"1","unitPrice":"5.00"}]}'::jsonb);
  raise exception 'INCOMPLETE_PROFILE_SHOULD_FAIL';
 exception when invalid_parameter_value then
  if sqlerrm not like 'SHOP_PROFILE_INCOMPLETE_OR_INVALID%' then raise; end if;
 end;
end $$;
reset role;
select 'PASS: nullable baseline profile row is valid; invoice RPC fails closed' as result;

-- Valid required profile with no map URL: invoice succeeds and snapshot stores NULL.
set role authenticated;
set request.jwt.claim.sub='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select * from public.create_invoice_transaction(
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd','invoice-create/v1','10000000-0000-4000-8000-000000000004',
 '{"header":{"shopName":"Shop D","shopAddress":"Address D","shopPhone":"+8801700000004","mapUrl":""},"lines":[{"catalogItemId":null,"itemName":"Water","unit":"bottle","quantity":"1","unitPrice":"5.00"}]}'::jsonb);
reset role;
do $$ begin
 if (select map_url_snapshot from public.invoices where shop_id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') is not null then raise exception 'ABSENT_MAP_NOT_NULL'; end if;
end $$;

-- A non-allow-listed HTTPS host is normalized to NULL, never rendered as a link.
set role authenticated;
set request.jwt.claim.sub='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select * from public.create_invoice_transaction(
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','invoice-create/v1','10000000-0000-4000-8000-000000000005',
 '{"header":{"shopName":"Shop E","shopAddress":"Address E","shopPhone":"+8801700000005","mapUrl":"https://evil.example/path"},"lines":[{"catalogItemId":null,"itemName":"Water","unit":"bottle","quantity":"1","unitPrice":"5.00"}]}'::jsonb);
reset role;
do $$ begin
 if (select map_url_snapshot from public.invoices where shop_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') is not null then raise exception 'INVALID_MAP_NOT_NULL'; end if;
end $$;
select 'PASS: absent/invalid Maps URLs stored as non-clickable NULL snapshots' as result;
