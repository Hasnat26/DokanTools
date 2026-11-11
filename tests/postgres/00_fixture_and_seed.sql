-- Synthetic two-tenant fixture. Local disposable database only.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into public.shops(id,user_id,shop_name,phone,address,map_link) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Shop A','+8801700000001','Address A','https://maps.google.com/maps?q=shop-a'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Shop B','+8801700000002','Address B','https://maps.google.com/maps?q=shop-b'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Shop C',null,null,null);
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
