import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const sql=readFileSync("supabase/migrations/202611110001_invoice_first_foundation.sql","utf8").toLowerCase();
const checks=["create table if not exists public.invoice_runtime_controls","values('invoice_issue',false)","create table if not exists public.invoice_counters","create table if not exists public.invoices","create table if not exists public.invoice_lines","create table if not exists public.invoice_idempotency","primary key(idempotency_namespace,request_id)","unique(shop_id,bill_number)","alter table public.invoices enable row level security","alter table public.invoice_lines enable row level security","authenticate/authorize the requested tenant first","for share","for update","public.create_invoice_transaction","invoices_immutable","invoice_lines_immutable","set search_path=pg_catalog","maps[.]app[.]goo[.]gl","grant execute on function public.create_invoice_transaction(uuid,text,uuid,jsonb) to authenticated","commit;"];
for(const c of checks)assert.ok(sql.includes(c),"Missing: "+c);
assert.ok(!/create_memo_transaction|stock_movements|baki_entries|public\.memos|public\.customers|stock_items|transaction_requests/i.test(sql),"Legacy side-effect dependency detected");
assert.ok(!/grant\s+select\s+.*\bto\s+anon/i.test(sql),"Anonymous invoice grant detected");
console.log("PASS "+checks.length+" invoice SQL source assertions.");
