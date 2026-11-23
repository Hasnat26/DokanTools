-- Destructive rollback for disposable invoice test databases only.
drop function if exists public.create_invoice_transaction(uuid,text,uuid,jsonb);
drop table if exists public.invoice_audit_events;
drop table if exists public.invoice_status_events;
drop table if exists public.invoice_idempotency;
drop table if exists public.invoice_lines;
drop table if exists public.invoices;
drop table if exists public.invoice_counters;
drop table if exists public.invoice_runtime_controls;
drop function if exists public.reject_invoice_fact_mutation();
