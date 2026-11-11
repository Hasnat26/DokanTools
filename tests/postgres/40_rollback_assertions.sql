do $$ begin
 if to_regclass('public.invoices') is not null or to_regclass('public.invoice_lines') is not null
  or to_regclass('public.invoice_idempotency') is not null or to_regclass('public.invoice_runtime_controls') is not null
 then raise exception 'INVOICE_ROLLBACK_LEFT_OBJECTS'; end if;
 if to_regclass('public.shops') is null or to_regclass('public.item_catalog') is null or to_regclass('public.transaction_requests') is null
 then raise exception 'INVOICE_ROLLBACK_DAMAGED_BASELINE'; end if;
 if to_regprocedure('public.create_memo_transaction(uuid,uuid,uuid,jsonb,numeric)') is null
 then raise exception 'INVOICE_ROLLBACK_REMOVED_MEMO_RPC'; end if;
end $$;
select 'PASS: invoice rollback removed invoice objects only; baseline tables and memo RPC remain' as result;
