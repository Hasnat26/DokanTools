-- Invoice-First backend foundation. Additive and source-only until applied to an isolated DB.
begin;
create table if not exists public.invoice_counters (
 shop_id uuid primary key references public.shops(id) on delete restrict,
 next_number bigint not null default 1 check(next_number>0),
 updated_at timestamptz not null default clock_timestamp()
);
create table if not exists public.invoices (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.shops(id) on delete restrict,
 bill_number bigint not null check(bill_number>0),
 issued_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references auth.users(id) on delete restrict,
 currency_code text not null default 'BDT' check(currency_code='BDT'),
 shop_name_snapshot text not null check(length(btrim(shop_name_snapshot)) between 1 and 200),
 shop_address_snapshot text not null check(length(btrim(shop_address_snapshot)) between 1 and 500),
 shop_phone_snapshot text not null check(length(btrim(shop_phone_snapshot)) between 1 and 40),
 map_url_snapshot text not null check(length(btrim(map_url_snapshot)) between 1 and 2048),
 total_amount numeric(14,2) not null check(total_amount>=0),
 line_count integer not null check(line_count>0),
 idempotency_namespace text not null,
 request_id uuid not null,
 payload_hash bytea not null check(octet_length(payload_hash)=32),
 integrity_hash bytea not null check(octet_length(integrity_hash)=32),
 hash_version smallint not null default 1 check(hash_version=1),
 created_at timestamptz not null default clock_timestamp(),
 constraint invoices_shop_bill_number_uq unique(shop_id,bill_number),
 constraint invoices_idempotency_identity_uq unique(idempotency_namespace,request_id),
 constraint invoices_shop_id_id_uq unique(shop_id,id)
);
create table if not exists public.invoice_lines (
 invoice_id uuid not null, shop_id uuid not null, line_no integer not null check(line_no>0),
 catalog_item_id_snapshot uuid,
 item_name_snapshot text not null check(length(btrim(item_name_snapshot)) between 1 and 200),
 unit_snapshot text, quantity numeric(12,3) not null check(quantity>0),
 unit_price numeric(14,2) not null check(unit_price>=0),
 line_total numeric(14,2) not null check(line_total>=0),
 created_at timestamptz not null default clock_timestamp(),
 primary key(invoice_id,line_no),
 constraint invoice_lines_invoice_shop_fk foreign key(shop_id,invoice_id)
   references public.invoices(shop_id,id) on delete restrict,
 check(quantity=round(quantity,3)), check(unit_price=round(unit_price,2)),
 check(line_total=round(quantity*unit_price,2))
);
create table if not exists public.invoice_idempotency (
 idempotency_namespace text not null check(length(idempotency_namespace) between 1 and 100),
 request_id uuid not null,
 shop_id uuid not null references public.shops(id) on delete restrict,
 owner_user_id uuid not null references auth.users(id) on delete restrict,
 operation_type text not null check(operation_type='invoice_create'),
 payload_hash bytea not null check(octet_length(payload_hash)=32),
 canonical_payload jsonb not null,
 invoice_id uuid,
 status text not null check(status in('processing','completed')),
 created_at timestamptz not null default clock_timestamp(),
 completed_at timestamptz,
 primary key(idempotency_namespace,request_id),
 constraint invoice_idempotency_invoice_fk foreign key(shop_id,invoice_id)
   references public.invoices(shop_id,id) on delete restrict,
 check((status='processing' and invoice_id is null and completed_at is null)
   or (status='completed' and invoice_id is not null and completed_at is not null))
);
create table if not exists public.invoice_status_events (
 event_id uuid primary key default gen_random_uuid(),
 shop_id uuid not null, invoice_id uuid not null,
 event_type text not null check(event_type='issued'),
 occurred_at timestamptz not null default clock_timestamp(),
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 foreign key(shop_id,invoice_id) references public.invoices(shop_id,id) on delete restrict,
 unique(invoice_id)
);
create table if not exists public.invoice_audit_events (
 event_id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.shops(id) on delete restrict,
 invoice_id uuid not null,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 event_type text not null check(event_type='invoice_created'),
 event_data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default clock_timestamp(),
 foreign key(shop_id,invoice_id) references public.invoices(shop_id,id) on delete restrict
);
create index if not exists invoices_shop_issued_idx on public.invoices(shop_id,issued_at desc,bill_number desc);
create index if not exists invoice_lines_shop_invoice_idx on public.invoice_lines(shop_id,invoice_id);
create index if not exists invoice_audit_shop_created_idx on public.invoice_audit_events(shop_id,created_at desc);

create or replace function public.reject_invoice_fact_mutation()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin raise exception 'INVOICE_FACTS_IMMUTABLE' using errcode='55000'; end;
$$;
drop trigger if exists invoices_immutable on public.invoices;
create trigger invoices_immutable before update or delete on public.invoices
for each row execute function public.reject_invoice_fact_mutation();
drop trigger if exists invoice_lines_immutable on public.invoice_lines;
create trigger invoice_lines_immutable before update or delete on public.invoice_lines
for each row execute function public.reject_invoice_fact_mutation();
revoke all on function public.reject_invoice_fact_mutation() from public,anon,authenticated;

alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.invoice_idempotency enable row level security;
alter table public.invoice_status_events enable row level security;
alter table public.invoice_audit_events enable row level security;
drop policy if exists invoice_owner_select on public.invoices;
create policy invoice_owner_select on public.invoices for select to authenticated
using(exists(select 1 from public.shops s where s.id=invoices.shop_id and s.user_id=auth.uid()));
drop policy if exists invoice_lines_owner_select on public.invoice_lines;
create policy invoice_lines_owner_select on public.invoice_lines for select to authenticated
using(exists(select 1 from public.shops s where s.id=invoice_lines.shop_id and s.user_id=auth.uid()));

revoke all on public.invoice_counters,public.invoice_idempotency,public.invoice_status_events,public.invoice_audit_events from public,anon,authenticated;
revoke all on public.invoices,public.invoice_lines from public,anon,authenticated;
grant select on public.invoices,public.invoice_lines to authenticated;
revoke insert,update,delete,truncate,references,trigger on public.invoices,public.invoice_lines from public,anon,authenticated;

create or replace function public.create_invoice_transaction(
 p_shop_id uuid,p_idempotency_namespace text,p_request_id uuid,p_payload jsonb
)
returns table(result_invoice_id uuid,result_bill_number bigint,result_issued_at timestamptz,
 result_total_amount numeric,result_was_replay boolean)
language plpgsql security definer
set search_path=pg_catalog,public,extensions,auth as $$
declare
 v_actor uuid:=auth.uid();
 v_shop public.shops%rowtype;
 v_claim_count integer;
 v_claim public.invoice_idempotency%rowtype;
 v_invoice uuid;
 v_bill bigint;
 v_issued timestamptz;
 v_total numeric(14,2):=0;
 v_line jsonb;
 v_no integer:=0;
 v_name text;
 v_unit text;
 v_qty numeric(12,3);
 v_price numeric(14,2);
 v_line_total numeric(14,2);
 v_header jsonb;
 v_lines jsonb;
 v_canonical jsonb;
 v_hash bytea;
 v_integrity bytea;
 v_item_id uuid;
begin
 if v_actor is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
 if p_shop_id is null or p_request_id is null or p_idempotency_namespace is null
   or length(p_idempotency_namespace) not between 1 and 100 then
   raise exception 'INVALID_REQUEST_IDENTITY' using errcode='22023';
 end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object'
   or (select count(*) from jsonb_object_keys(p_payload))<>2
   or not(p_payload ?& array['header','lines']) then
   raise exception 'INVALID_INVOICE_PAYLOAD' using errcode='22023';
 end if;
 v_header:=p_payload->'header';
 v_lines:=p_payload->'lines';
 if jsonb_typeof(v_header)<>'object' or jsonb_typeof(v_lines)<>'array'
   or jsonb_array_length(v_lines) not between 1 and 100 then
   raise exception 'INVALID_HEADER_OR_LINES' using errcode='22023';
 end if;
 if (select count(*) from jsonb_object_keys(v_header))<>4
   or not(v_header ?& array['shopName','shopAddress','shopPhone','mapUrl']) then
   raise exception 'INVALID_HEADER' using errcode='22023';
 end if;

 -- Authenticate/authorize the requested tenant first. This lock remains held to commit.
 select * into v_shop from public.shops s
 where s.id=p_shop_id and s.user_id=v_actor
 for share;
 if not found then
   raise exception 'SHOP_NOT_FOUND_OR_ACCESS_DENIED' using errcode='42501';
 end if;

 -- Canonical key uses the exact supplied header and line JSON; replay remains stable
 -- even after the current shop profile is edited.
 v_canonical:=jsonb_build_object('header',v_header,'lines',v_lines);
 v_hash:=extensions.digest(convert_to(v_canonical::text,'UTF8'),'sha256');

 -- Authorization is complete before any private registry comparison.
 insert into public.invoice_idempotency(idempotency_namespace,request_id,shop_id,owner_user_id,
   operation_type,payload_hash,canonical_payload,status)
 values(p_idempotency_namespace,p_request_id,p_shop_id,v_actor,'invoice_create',v_hash,v_canonical,'processing')
 on conflict(idempotency_namespace,request_id) do nothing;
 get diagnostics v_claim_count=row_count;

 if v_claim_count=0 then
   select * into v_claim from public.invoice_idempotency r
    where r.idempotency_namespace=p_idempotency_namespace and r.request_id=p_request_id
    for update;
   if not found or v_claim.status<>'completed' or v_claim.invoice_id is null
     or v_claim.shop_id<>p_shop_id or v_claim.owner_user_id<>v_actor
     or v_claim.operation_type<>'invoice_create' or v_claim.payload_hash<>v_hash
     or v_claim.canonical_payload<>v_canonical then
     raise exception 'IDEMPOTENCY_CONFLICT' using errcode='23505';
   end if;
   select i.bill_number,i.issued_at,i.total_amount into v_bill,v_issued,v_total
    from public.invoices i where i.id=v_claim.invoice_id and i.shop_id=p_shop_id;
   if not found then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='23505'; end if;
   return query select v_claim.invoice_id,v_bill,v_issued,v_total,true;
   return;
 end if;

 -- A new request must snapshot the currently persisted shop profile. A mismatch is
 -- rejected; the claim rolls back with the exception, and no number is consumed.
 if nullif(btrim(v_shop.shop_name),'') is null or nullif(btrim(v_shop.address),'') is null
   or nullif(btrim(v_shop.phone),'') is null or nullif(btrim(v_shop.map_link),'') is null
   or length(v_shop.shop_name)>200 or length(v_shop.address)>500
   or length(v_shop.phone)>40 or length(v_shop.map_link)>2048
   or v_shop.map_link !~* '^https://(www[.])?(google[.][a-z.]+/maps|maps[.]google[.][a-z.]+/)' then
   raise exception 'SHOP_PROFILE_INCOMPLETE_OR_INVALID' using errcode='22023';
 end if;
 if v_header->>'shopName' is distinct from v_shop.shop_name
   or v_header->>'shopAddress' is distinct from v_shop.address
   or v_header->>'shopPhone' is distinct from v_shop.phone
   or v_header->>'mapUrl' is distinct from v_shop.map_link then
   raise exception 'SHOP_PROFILE_CHANGED_REFRESH_REQUIRED' using errcode='22023';
 end if;

 for v_line in select value from jsonb_array_elements(v_lines) x(value) loop
  v_no:=v_no+1;
  if jsonb_typeof(v_line)<>'object'
    or (select count(*) from jsonb_object_keys(v_line))<>5
    or not(v_line ?& array['catalogItemId','itemName','unit','quantity','unitPrice']) then
    raise exception 'INVALID_LINE' using errcode='22023';
  end if;
  v_name:=nullif(btrim(v_line->>'itemName'),'');
  v_unit:=nullif(btrim(v_line->>'unit'),'');
  begin
    v_qty:=(v_line->>'quantity')::numeric;
    v_price:=(v_line->>'unitPrice')::numeric;
    v_item_id:=nullif(v_line->>'catalogItemId','')::uuid;
  exception when others then
    raise exception 'INVALID_LINE_VALUE' using errcode='22023';
  end;
  if v_name is null or length(v_name)>200 or v_qty<=0 or v_qty<>round(v_qty,3)
    or v_price<0 or v_price<>round(v_price,2)
    or (v_unit is not null and length(v_unit)>40)
    or nullif(v_line->>'quantity','') !~ '^(0|[1-9][0-9]*)([.][0-9]{1,3})?$'
    or nullif(v_line->>'unitPrice','') !~ '^(0|[1-9][0-9]*)([.][0-9]{1,2})?$' then
    raise exception 'INVALID_LINE' using errcode='22023';
  end if;
  v_total:=v_total+round(v_qty*v_price,2);
 end loop;
 if v_total>999999999999.99 then
   raise exception 'INVOICE_TOTAL_OUT_OF_RANGE' using errcode='22003';
 end if;

 -- Per-shop row lock serializes issued bill numbers; transaction rollback restores counter.
 insert into public.invoice_counters(shop_id,next_number)
 values(p_shop_id,1) on conflict(shop_id) do nothing;
 select next_number into v_bill from public.invoice_counters
 where shop_id=p_shop_id for update;
 if v_bill is null or v_bill<=0 or v_bill=9223372036854775807 then
   raise exception 'INVOICE_COUNTER_UNAVAILABLE' using errcode='22003';
 end if;
 update public.invoice_counters set next_number=v_bill+1,updated_at=clock_timestamp()
 where shop_id=p_shop_id;

 v_invoice:=gen_random_uuid();
 v_issued:=clock_timestamp();
 v_integrity:=extensions.digest(convert_to(v_canonical::text||'|'||v_bill::text||'|'||v_issued::text,'UTF8'),'sha256');
 insert into public.invoices(id,shop_id,bill_number,issued_at,created_by,shop_name_snapshot,
  shop_address_snapshot,shop_phone_snapshot,map_url_snapshot,total_amount,line_count,
  idempotency_namespace,request_id,payload_hash,integrity_hash)
 values(v_invoice,p_shop_id,v_bill,v_issued,v_actor,v_shop.shop_name,v_shop.address,v_shop.phone,
  v_shop.map_link,v_total,v_no,p_idempotency_namespace,p_request_id,v_hash,v_integrity);

 v_no:=0;
 for v_line in select value from jsonb_array_elements(v_lines) x(value) loop
   v_no:=v_no+1;
   v_name:=btrim(v_line->>'itemName');
   v_unit:=nullif(btrim(v_line->>'unit'),'');
   v_qty:=(v_line->>'quantity')::numeric;
   v_price:=(v_line->>'unitPrice')::numeric;
   v_item_id:=nullif(v_line->>'catalogItemId','')::uuid;
   v_line_total:=round(v_qty*v_price,2);
   insert into public.invoice_lines(invoice_id,shop_id,line_no,catalog_item_id_snapshot,
    item_name_snapshot,unit_snapshot,quantity,unit_price,line_total)
   values(v_invoice,p_shop_id,v_no,v_item_id,v_name,v_unit,v_qty,v_price,v_line_total);
 end loop;

 insert into public.invoice_status_events(shop_id,invoice_id,event_type,occurred_at,actor_user_id)
 values(p_shop_id,v_invoice,'issued',v_issued,v_actor);
 insert into public.invoice_audit_events(shop_id,invoice_id,actor_user_id,event_type,event_data,created_at)
 values(p_shop_id,v_invoice,v_actor,'invoice_created',
  jsonb_build_object('bill_number',v_bill,'line_count',v_no,'total_amount',v_total),v_issued);
 update public.invoice_idempotency set invoice_id=v_invoice,status='completed',completed_at=v_issued
 where idempotency_namespace=p_idempotency_namespace and request_id=p_request_id;
 return query select v_invoice,v_bill,v_issued,v_total,false;
end;
$$;
revoke all on function public.create_invoice_transaction(uuid,text,uuid,jsonb) from public,anon;
grant execute on function public.create_invoice_transaction(uuid,text,uuid,jsonb) to authenticated;
commit;
