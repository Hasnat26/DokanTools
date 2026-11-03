-- DokanTools P0 remediation: payload-bound idempotency for memo, baki and stock operations.
-- This is a forward-only additive migration; no live database is modified by this source patch.
alter table public.transaction_requests add column if not exists payload_json jsonb;

-- Backfill payloads where the persisted canonical record contains the complete original input.
-- Legacy stock-item creation cannot be reconstructed safely (expiry/sort order may have changed),
-- so those rows remain NULL and retry will fail closed with LEGACY_PAYLOAD_UNAVAILABLE.
update public.transaction_requests tr
set payload_json = jsonb_build_object('customer_id',m.customer_id,'items',m.items_json,'due_amount',m.due_amount)
from public.memos m
where tr.operation_type='memo_sale' and tr.entity_id=m.id and tr.payload_json is null;

update public.transaction_requests tr
set payload_json = jsonb_build_object('customer_id',be.customer_id,'amount',be.amount,
  'type',be.type,'note',nullif(btrim(be.note),''),'items',be.items_json)
from public.baki_entries be
where tr.operation_type='baki_entry' and tr.entity_id=be.id and tr.payload_json is null;

update public.transaction_requests tr
set payload_json = jsonb_build_object('stock_item_id',tr.entity_id,
  'new_qty',(ae.event_data->>'current_qty')::numeric,'reason',nullif(btrim(ae.event_data->>'reason'),''))
from public.audit_events ae
where tr.operation_type='stock_adjustment' and tr.shop_id=ae.shop_id
  and tr.operation_id=ae.operation_id and ae.event_type='stock_adjusted' and tr.payload_json is null;

create or replace function public.create_memo_transaction(
  p_request_id uuid,
  p_shop_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_due_amount numeric
)
returns table(result_memo_id uuid, result_total_amount numeric, result_due_amount numeric, was_duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop public.shops%rowtype;
  v_claim_id uuid;
  v_existing_id uuid;
  v_status text;
  v_existing_type text;
  v_existing_payload jsonb;
  v_request_payload jsonb;
  v_catalog_price numeric;
  v_override_reason text;
  v_price_overrides jsonb := '[]'::jsonb;
  v_memo_id uuid;
  v_due_entry_id uuid;
  v_item jsonb;
  v_name text;
  v_qty numeric;
  v_price numeric;
  v_total numeric(12,2) := 0;
  v_due numeric(12,2);
  v_stock_id uuid;
  v_stock_name text;
  v_stock_unit text;
  v_stock_count integer;
  v_qty_after numeric(12,3);
begin
  if v_user_id is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  if p_request_id is null then raise exception 'A stable request ID is required.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one memo line is required.';
  end if;

  -- Serializes core stock/cash operations per shop for this pilot-scale implementation.
  select * into v_shop from public.shops
  where id = p_shop_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Shop not found or access denied.' using errcode = '42501'; end if;

  if p_customer_id is not null and not exists (
    select 1 from public.customers c where c.id = p_customer_id and c.shop_id = p_shop_id
  ) then raise exception 'Customer does not belong to this shop.' using errcode = '42501'; end if;

  for v_item in select value from jsonb_array_elements(p_items) as t(value) loop
    v_name := nullif(btrim(v_item->>'name'), '');
    if v_name is null then raise exception 'Every memo line needs a name.'; end if;
    begin
      v_qty := (v_item->>'qty')::numeric;
      v_price := coalesce(nullif(v_item->>'unit_price','')::numeric, nullif(v_item->>'price','')::numeric);
    exception when others then raise exception 'Invalid quantity or unit price for %.', v_name;
    end;
    if v_qty is null or v_qty <= 0 or v_qty <> round(v_qty, 3) then
      raise exception 'Quantity for % must be positive and support at most 3 decimal places.', v_name;
    end if;
    if v_price is null or v_price < 0 then raise exception 'Invalid unit price for %.', v_name; end if;
    v_total := v_total + round(v_qty * round(v_price, 2), 2);
  end loop;
  v_total := round(v_total, 2);
  v_due := round(coalesce(p_due_amount, -1), 2);
  if v_total <= 0 then raise exception 'Memo total must be greater than zero.'; end if;
  if v_due < 0 or v_due > v_total then raise exception 'Due must be between zero and the memo total.'; end if;
  if v_due > 0 and p_customer_id is null then
    raise exception 'A customer must be selected when a memo records an unpaid balance.';
  end if;
  v_request_payload := jsonb_build_object('customer_id',p_customer_id,'items',p_items,'due_amount',v_due);

  insert into public.transaction_requests(shop_id, operation_id, operation_type, status, payload_json)
  values (p_shop_id, p_request_id, 'memo_sale', 'processing', v_request_payload)
  on conflict (shop_id, operation_id) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    select tr.entity_id, tr.status, tr.operation_type, tr.payload_json into v_existing_id, v_status, v_existing_type, v_existing_payload
    from public.transaction_requests tr
    where tr.shop_id = p_shop_id and tr.operation_id = p_request_id;
    if v_status <> 'completed' or v_existing_id is null or v_existing_type <> 'memo_sale' then
      raise exception 'This request ID is already used or processing; verify its status before retrying.';
    end if;
    if v_existing_payload is null then
      raise exception 'IDEMPOTENCY_LEGACY_PAYLOAD_UNAVAILABLE: this older request cannot be safely retried; inspect the saved memo.';
    end if;
    if v_existing_payload is distinct from v_request_payload then
      raise exception 'IDEMPOTENCY_PAYLOAD_MISMATCH: request ID was previously used with different memo data.' using errcode='22000';
    end if;
    select m.total_amount, m.due_amount into v_total, v_due
    from public.memos m where m.id = v_existing_id and m.shop_id = p_shop_id;
    if not found then raise exception 'Completed request does not match a memo. Manual review required.'; end if;
    return query select v_existing_id, v_total, v_due, true;
    return;
  end if;

  insert into public.memos(shop_id, customer_id, items_json, total_amount, due_amount)
  values (p_shop_id, p_customer_id, p_items, v_total, v_due)
  returning id into v_memo_id;

  for v_item in select value from jsonb_array_elements(p_items) as t(value) loop
    v_catalog_price := null;
    v_override_reason := null;
    v_name := btrim(v_item->>'name');
    v_qty := (v_item->>'qty')::numeric;
    v_price := coalesce(nullif(v_item->>'unit_price','')::numeric, nullif(v_item->>'price','')::numeric);
    v_stock_id := null;
    v_stock_name := null;

    if nullif(v_item->>'stock_item_id','') is not null then
      select si.id, si.name, si.unit, si.sale_price into v_stock_id, v_stock_name, v_stock_unit, v_catalog_price
      from public.stock_items si
      where si.id = (v_item->>'stock_item_id')::uuid and si.shop_id = p_shop_id
      for update;
      if not found then raise exception 'Inventory reference for % is invalid.', v_name; end if;
      if lower(btrim(v_stock_name)) <> lower(btrim(v_name)) then
        raise exception 'Inventory reference does not match product %.', v_name;
      end if;
    else
      select count(*) into v_stock_count from public.stock_items si
      where si.shop_id = p_shop_id and lower(btrim(si.name)) = lower(btrim(v_name));
      if v_stock_count > 1 then raise exception 'Multiple inventory records match %. Correct the catalog first.', v_name; end if;
      if v_stock_count = 1 then
        select si.id, si.name, si.unit, si.sale_price into v_stock_id, v_stock_name, v_stock_unit, v_catalog_price
        from public.stock_items si
        where si.shop_id = p_shop_id and lower(btrim(si.name)) = lower(btrim(v_name))
        for update;
      end if;
    end if;

    if v_stock_id is not null then
      if round(v_price,2) is distinct from round(coalesce(v_catalog_price, v_price),2) then
        v_override_reason := nullif(btrim(v_item->>'price_override_reason'),'');
        if v_override_reason is null or length(v_override_reason) < 3 then
          raise exception 'PRICE_OVERRIDE_REASON_REQUIRED: provide a reason when overriding the shop catalog price.';
        end if;
        v_price_overrides := v_price_overrides || jsonb_build_array(jsonb_build_object(
          'stock_item_id',v_stock_id,'item_name',v_name,'catalog_price',round(v_catalog_price,2),
          'applied_price',round(v_price,2),'reason',v_override_reason
        ));
      end if;
      if nullif(btrim(v_item->>'unit'), '') is null
         or lower(btrim(v_item->>'unit')) <> lower(btrim(v_stock_unit)) then
        raise exception 'Unit mismatch for %. Explicit unit conversion is not supported in this pilot build.', v_name;
      end if;
      update public.stock_items si set qty = si.qty - v_qty
      where si.id = v_stock_id and si.shop_id = p_shop_id and si.qty >= v_qty
      returning si.qty into v_qty_after;
      if not found then raise exception 'Insufficient stock for %. No memo or inventory changes were committed.', v_name; end if;
      insert into public.stock_movements(
        shop_id, stock_item_id, operation_id, movement_type, qty_delta,
        qty_before, qty_after, unit, reference_id, created_by
      ) values (
        p_shop_id, v_stock_id, p_request_id, 'sale', -v_qty,
        v_qty_after + v_qty, v_qty_after, coalesce(nullif(v_item->>'unit',''), 'unit'), v_memo_id, v_user_id
      );
    end if;
  end loop;

  -- Keep the customer receivable ledger consistent with the memo's due amount.
  if v_due > 0 then
    insert into public.baki_entries(shop_id, customer_id, amount, type, note, items_json)
    values (p_shop_id, p_customer_id, v_due, 'due', 'মেমো #' || left(v_memo_id::text, 8), p_items)
    returning id into v_due_entry_id;
    insert into public.audit_events(shop_id, actor_user_id, operation_id, event_type, entity_type, entity_id, event_data)
    values (p_shop_id, v_user_id, p_request_id, 'memo_due_added_to_customer_ledger', 'baki_entry', v_due_entry_id,
      jsonb_build_object('memo_id', v_memo_id, 'customer_id', p_customer_id, 'amount', v_due));
  end if;

  insert into public.audit_events(shop_id, actor_user_id, operation_id, event_type, entity_type, entity_id, event_data)
  values (p_shop_id, v_user_id, p_request_id, 'memo_created', 'memo', v_memo_id,
    jsonb_build_object('line_count', jsonb_array_length(p_items), 'total_amount', v_total,
      'due_amount', v_due, 'stock_movements_recorded', true, 'due_entry_id', v_due_entry_id,
      'price_overrides',v_price_overrides));

  update public.transaction_requests
  set entity_id = v_memo_id, status = 'completed', completed_at = now()
  where id = v_claim_id;

  return query select v_memo_id, v_total, v_due, false;
end;
$$;

create or replace function public.create_stock_item(
  p_request_id uuid,
  p_shop_id uuid,
  p_name text,
  p_unit text,
  p_purchase_price numeric,
  p_sale_price numeric,
  p_initial_qty numeric,
  p_expiry_date date default null,
  p_sort_order integer default 0
)
returns table(result_stock_id uuid, result_qty numeric, was_duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop public.shops%rowtype;
  v_claim_id uuid;
  v_existing_id uuid;
  v_status text;
  v_existing_type text;
  v_existing_payload jsonb;
  v_request_payload jsonb;
  v_saved_qty numeric;
  v_stock_id uuid;
  v_before numeric(12,3) := 0;
  v_qty numeric(12,3);
  v_name text := nullif(btrim(p_name), '');
  v_unit text := nullif(btrim(p_unit), '');
begin
  if v_user_id is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  if p_request_id is null then raise exception 'A stable request ID is required.'; end if;
  if v_name is null or v_unit is null then raise exception 'Product name and unit are required.'; end if;
  if p_purchase_price is null or p_purchase_price < 0 or p_sale_price is null or p_sale_price < 0 then
    raise exception 'Prices must be non-negative.';
  end if;
  if p_initial_qty is null or p_initial_qty < 0 or p_initial_qty <> round(p_initial_qty,3) then
    raise exception 'Opening quantity must be non-negative with at most 3 decimal places.';
  end if;
  v_qty := p_initial_qty;
  select * into v_shop from public.shops where id=p_shop_id and user_id=v_user_id for update;
  if not found then raise exception 'Shop not found or access denied.' using errcode = '42501'; end if;
  v_request_payload := jsonb_build_object('name',v_name,'unit',v_unit,'purchase_price',round(p_purchase_price,2),
    'sale_price',round(p_sale_price,2),'initial_qty',v_qty,'expiry_date',p_expiry_date,'sort_order',coalesce(p_sort_order,0));

  insert into public.transaction_requests(shop_id, operation_id, operation_type, status, payload_json)
  values(p_shop_id,p_request_id,'stock_item_create','processing',v_request_payload)
  on conflict(shop_id,operation_id) do nothing returning id into v_claim_id;
  if v_claim_id is null then
    select entity_id,status,operation_type,payload_json into v_existing_id,v_status,v_existing_type,v_existing_payload from public.transaction_requests
    where shop_id=p_shop_id and operation_id=p_request_id;
    if v_status <> 'completed' or v_existing_id is null or v_existing_type <> 'stock_item_create' then raise exception 'This request ID is already used or this stock request is still processing.'; end if;
    if v_existing_payload is null then raise exception 'IDEMPOTENCY_LEGACY_PAYLOAD_UNAVAILABLE: inspect the saved stock item before retrying.'; end if;
    if v_existing_payload is distinct from v_request_payload then raise exception 'IDEMPOTENCY_PAYLOAD_MISMATCH: request ID was previously used with different stock creation data.' using errcode='22000'; end if;
    select (ae.event_data->>'opening_qty')::numeric into v_saved_qty from public.audit_events ae
      where ae.shop_id=p_shop_id and ae.operation_id=p_request_id and ae.event_type='stock_item_created' limit 1;
    v_qty := coalesce(v_saved_qty,0);
    return query select v_existing_id,v_qty,true; return;
  end if;

  if exists(select 1 from public.stock_items si where si.shop_id=p_shop_id and lower(btrim(si.name))=lower(v_name)) then
    raise exception 'A stock item with this name already exists. Use the existing item instead.';
  end if;

  insert into public.stock_items(shop_id,name,unit,purchase_price,sale_price,price,qty,expiry_date,sort_order,is_public)
  values(p_shop_id,v_name,v_unit,round(p_purchase_price,2),round(p_sale_price,2),round(p_sale_price,2),v_qty,p_expiry_date,coalesce(p_sort_order,0),false)
  returning id into v_stock_id;

  if v_qty > 0 then
    insert into public.stock_movements(shop_id,stock_item_id,operation_id,movement_type,qty_delta,qty_before,qty_after,unit,reason,created_by)
    values(p_shop_id,v_stock_id,p_request_id,'opening',v_qty,v_before,v_qty,v_unit,'Opening stock recorded at product creation',v_user_id);
  end if;
  insert into public.audit_events(shop_id,actor_user_id,operation_id,event_type,entity_type,entity_id,event_data)
  values(p_shop_id,v_user_id,p_request_id,'stock_item_created','stock_item',v_stock_id,
    jsonb_build_object('name',v_name,'unit',v_unit,'opening_qty',v_qty,'purchase_price',round(p_purchase_price,2),'sale_price',round(p_sale_price,2)));
  update public.transaction_requests set entity_id=v_stock_id,status='completed',completed_at=now() where id=v_claim_id;
  return query select v_stock_id,v_qty,false;
end;
$$;

create or replace function public.adjust_stock_quantity(
  p_request_id uuid,
  p_shop_id uuid,
  p_stock_item_id uuid,
  p_new_qty numeric,
  p_reason text
)
returns table(result_stock_id uuid, previous_qty numeric, current_qty numeric, was_duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop public.shops%rowtype;
  v_claim_id uuid;
  v_existing_id uuid;
  v_status text;
  v_existing_type text;
  v_existing_payload jsonb;
  v_request_payload jsonb;
  v_stock public.stock_items%rowtype;
  v_old_qty numeric(12,3);
  v_new_qty numeric(12,3);
  v_saved_old numeric;
  v_saved_new numeric;
  v_reason text := nullif(btrim(p_reason),'');
begin
  if v_user_id is null then raise exception 'Authentication required.' using errcode = '28000'; end if;
  if p_request_id is null then raise exception 'A stable request ID is required.'; end if;
  if v_reason is null or length(v_reason) < 3 then raise exception 'A short correction reason is required.'; end if;
  if p_new_qty is null or p_new_qty < 0 or p_new_qty <> round(p_new_qty,3) then
    raise exception 'New quantity must be non-negative with at most 3 decimal places.';
  end if;
  v_new_qty := p_new_qty;
  select * into v_shop from public.shops where id=p_shop_id and user_id=v_user_id for update;
  if not found then raise exception 'Shop not found or access denied.' using errcode = '42501'; end if;
  v_request_payload := jsonb_build_object('stock_item_id',p_stock_item_id,'new_qty',v_new_qty,'reason',v_reason);

  insert into public.transaction_requests(shop_id,operation_id,operation_type,status,payload_json)
  values(p_shop_id,p_request_id,'stock_adjustment','processing',v_request_payload)
  on conflict(shop_id,operation_id) do nothing returning id into v_claim_id;
  if v_claim_id is null then
    select entity_id,status,operation_type,payload_json into v_existing_id,v_status,v_existing_type,v_existing_payload from public.transaction_requests
    where shop_id=p_shop_id and operation_id=p_request_id;
    if v_status <> 'completed' or v_existing_id is null or v_existing_type <> 'stock_adjustment' then raise exception 'This request ID is already used or this adjustment request is still processing.'; end if;
    if v_existing_payload is null then raise exception 'IDEMPOTENCY_LEGACY_PAYLOAD_UNAVAILABLE: inspect the saved adjustment before retrying.'; end if;
    if v_existing_payload is distinct from v_request_payload then raise exception 'IDEMPOTENCY_PAYLOAD_MISMATCH: request ID was previously used with different stock adjustment data.' using errcode='22000'; end if;
    select (ae.event_data->>'previous_qty')::numeric,(ae.event_data->>'current_qty')::numeric
      into v_saved_old,v_saved_new from public.audit_events ae
      where ae.shop_id=p_shop_id and ae.operation_id=p_request_id and ae.event_type='stock_adjusted' limit 1;
    return query select v_existing_id,v_saved_old,v_saved_new,true; return;
  end if;

  select * into v_stock from public.stock_items si
  where si.id=p_stock_item_id and si.shop_id=p_shop_id for update;
  if not found then raise exception 'Stock item not found or access denied.' using errcode='42501'; end if;
  v_old_qty := v_stock.qty;
  update public.stock_items set qty=v_new_qty where id=p_stock_item_id and shop_id=p_shop_id;
  if v_new_qty <> v_old_qty then
    insert into public.stock_movements(shop_id,stock_item_id,operation_id,movement_type,qty_delta,qty_before,qty_after,unit,reason,created_by)
    values(p_shop_id,p_stock_item_id,p_request_id,'adjustment',v_new_qty-v_old_qty,v_old_qty,v_new_qty,v_stock.unit,v_reason,v_user_id);
  end if;
  insert into public.audit_events(shop_id,actor_user_id,operation_id,event_type,entity_type,entity_id,event_data)
  values(p_shop_id,v_user_id,p_request_id,'stock_adjusted','stock_item',p_stock_item_id,
    jsonb_build_object('previous_qty',v_old_qty,'current_qty',v_new_qty,'reason',v_reason));
  update public.transaction_requests set entity_id=p_stock_item_id,status='completed',completed_at=now() where id=v_claim_id;
  return query select p_stock_item_id,v_old_qty,v_new_qty,false;
end;
$$;

create or replace function public.create_baki_entry(
  p_request_id uuid,
  p_shop_id uuid,
  p_customer_id uuid,
  p_amount numeric,
  p_type text,
  p_note text,
  p_items jsonb default '[]'::jsonb
)
returns table(result_entry_id uuid, was_duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop public.shops%rowtype;
  v_claim_id uuid;
  v_existing_id uuid;
  v_status text;
  v_existing_type text;
  v_existing_payload jsonb;
  v_request_payload jsonb;
  v_entry_id uuid;
  v_current_due numeric(12,2);
begin
  if v_user_id is null then raise exception 'Authentication required.' using errcode='28000'; end if;
  if p_request_id is null then raise exception 'A stable request ID is required.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Entry amount must be greater than zero.'; end if;
  if p_type not in ('due','paid') then raise exception 'Entry type must be due or paid.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Items must be a JSON array.'; end if;
  select * into v_shop from public.shops where id=p_shop_id and user_id=v_user_id for update;
  if not found then raise exception 'Shop not found or access denied.' using errcode='42501'; end if;
  if not exists(select 1 from public.customers c where c.id=p_customer_id and c.shop_id=p_shop_id) then
    raise exception 'Customer does not belong to this shop.' using errcode='42501';
  end if;
  v_request_payload := jsonb_build_object('customer_id',p_customer_id,'amount',round(p_amount,2),
    'type',p_type,'note',nullif(btrim(p_note),''),'items',p_items);
  insert into public.transaction_requests(shop_id,operation_id,operation_type,status,payload_json)
  values(p_shop_id,p_request_id,'baki_entry','processing',v_request_payload)
  on conflict(shop_id,operation_id) do nothing returning id into v_claim_id;
  if v_claim_id is null then
    select entity_id,status,operation_type,payload_json into v_existing_id,v_status,v_existing_type,v_existing_payload from public.transaction_requests
    where shop_id=p_shop_id and operation_id=p_request_id;
    if v_status <> 'completed' or v_existing_id is null or v_existing_type <> 'baki_entry' then raise exception 'This request ID is already used or this ledger request is still processing.'; end if;
    if v_existing_payload is null then raise exception 'IDEMPOTENCY_LEGACY_PAYLOAD_UNAVAILABLE: inspect the saved ledger entry before retrying.'; end if;
    if v_existing_payload is distinct from v_request_payload then raise exception 'IDEMPOTENCY_PAYLOAD_MISMATCH: request ID was previously used with different baki data.' using errcode='22000'; end if;
    return query select v_existing_id,true; return;
  end if;

  -- Check the balance only for a new operation; an idempotent retry must resolve first.
  if p_type = 'paid' then
    select coalesce(sum(case when be.type = 'due' then be.amount else -be.amount end), 0)
      into v_current_due from public.baki_entries be
      where be.shop_id = p_shop_id and be.customer_id = p_customer_id;
    if round(p_amount,2) > round(v_current_due,2) then
      raise exception 'Payment exceeds the recorded customer due balance.';
    end if;
  end if;

  insert into public.baki_entries(shop_id,customer_id,amount,type,note,items_json)
  values(p_shop_id,p_customer_id,round(p_amount,2),p_type,nullif(btrim(p_note),''),p_items)
  returning id into v_entry_id;
  insert into public.audit_events(shop_id,actor_user_id,operation_id,event_type,entity_type,entity_id,event_data)
  values(p_shop_id,v_user_id,p_request_id,case when p_type='due' then 'customer_due_added' else 'customer_payment_recorded' end,
    'baki_entry',v_entry_id,jsonb_build_object('amount',round(p_amount,2),'type',p_type,'item_count',jsonb_array_length(p_items)));
  update public.transaction_requests set entity_id=v_entry_id,status='completed',completed_at=now() where id=v_claim_id;
  return query select v_entry_id,false;
end;
$$;
