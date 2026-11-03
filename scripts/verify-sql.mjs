import fs from "node:fs";
import assert from "node:assert/strict";

const schema = fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../supabase/migrations/20261019_reliability_foundation.sql", import.meta.url), "utf8");
const p0Migration = fs.readFileSync(new URL("../supabase/migrations/20261102_p0_idempotency.sql", import.meta.url), "utf8");
const combined = `${schema}\n${migration}\n${p0Migration}`;
const marker = "-- DokanTools reliability foundation.";
assert.ok(schema.includes(marker), "fresh-install schema is missing reliability foundation");
assert.ok(schema.slice(schema.indexOf(marker)).trim().startsWith(migration.trim()), "fresh-install schema must include the original reliability migration");
assert.ok(schema.includes("alter table public.transaction_requests add column if not exists payload_json jsonb"), "fresh-install schema missing P0 idempotency payload migration");
assert.ok(schema.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"), "fresh-install schema missing payload mismatch protection");

for (const required of [
  "create table if not exists public.transaction_requests",
  "create table if not exists public.stock_movements",
  "create table if not exists public.audit_events",
  "create or replace function public.create_memo_transaction",
  "create or replace function public.adjust_stock_quantity",
  "create or replace function public.create_stock_item",
  "create or replace function public.create_baki_entry",
  "memo_due_added_to_customer_ledger",
  "owner creates customers",
  "Payment exceeds the recorded customer due balance.",
  "Explicit unit conversion is not supported in this pilot build.",
  "Changing an existing stock unit requires an explicit conversion workflow; it is disabled in this pilot build.",
  "A customer must be selected when a memo records an unpaid balance.",
  "public_shop_profiles",
  "public_shop_products",
  "drop function if exists public.public_due_lookup(uuid,text)",
]) assert.ok(combined.toLowerCase().includes(required.toLowerCase()), `missing SQL feature: ${required}`);

assert.ok(/unique\s*\(shop_id\s*,\s*operation_id\s*\)/i.test(combined), "request idempotency unique key missing");
assert.ok(/auth\.uid\(\)/i.test(combined), "SQL security functions do not validate auth.uid()");
assert.ok(/for update/i.test(migration), "transactional function row lock missing");
assert.ok(/qty\s*>=\s*v_qty/i.test(migration), "sale stock guard missing");
assert.ok(/drop policy if exists [^;]*public reads stock/i.test(migration), "public stock policy is not removed");
assert.ok(/drop policy if exists [^;]*public reads memo summaries/i.test(migration), "public memo policy is not removed");
assert.ok(/drop policy if exists [^;]*public reads shop profiles/i.test(migration), "public shops table policy is not removed");
assert.ok(/grant select on public\.public_shop_profiles(?:,\s*public\.public_shop_products)? to anon, authenticated/i.test(migration), "safe public profile view is not granted");
assert.ok(/revoke delete on public\.shops, public\.customers from public, anon, authenticated/i.test(migration), "financial-history cascade deletes are not blocked");
assert.ok(/grant update \(shop_name, shop_type, owner_name, phone, address, map_link, logo_url, is_public\)\s+on public\.shops to authenticated/i.test(migration), "shops column-level update grant missing");
assert.ok(/create policy "owner creates customers"/i.test(migration), "owner customer insert policy missing");
assert.ok(/si\.qty\s*>=\s*v_qty/i.test(migration), "atomic stock guard missing");
assert.ok(/memo_due_added_to_customer_ledger/i.test(migration), "memo due is not written to customer ledger atomically");
assert.ok(!/create (?:or replace )?function public\.public_due_lookup/i.test(combined), "unsafe public due lookup must not be recreated");
console.log("SQL static verification: PASS (schema/migration design checks only; not a PostgreSQL execution test)");
