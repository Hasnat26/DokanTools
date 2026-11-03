import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(new URL("../supabase/migrations/20261102_p0_idempotency.sql", import.meta.url), "utf8");

test("P0 migration stores and compares idempotency payloads for all affected operations", () => {
  assert.match(migration, /add column if not exists payload_json jsonb/i);
  for (const rpc of ["create_memo_transaction", "create_baki_entry", "create_stock_item", "adjust_stock_quantity"]) {
    const start = migration.indexOf(`create or replace function public.${rpc}(`);
    assert.notEqual(start, -1, `${rpc} exists in P0 migration`);
    const end = migration.indexOf("\n$$;", start);
    const body = migration.slice(start, end);
    assert.match(body, /payload_json/i, `${rpc} stores or reads payload_json`);
    assert.match(body, /IDEMPOTENCY_PAYLOAD_MISMATCH/, `${rpc} rejects mismatched payload`);
    assert.match(body, /v_existing_payload is distinct from v_request_payload/i, `${rpc} compares payloads`);
  }
});

test("memo override requires a reason and is included in audit event data", () => {
  assert.match(migration, /PRICE_OVERRIDE_REASON_REQUIRED/);
  assert.match(migration, /price_overrides/);
  assert.match(migration, /catalog_price/);
  assert.match(migration, /applied_price/);
});
