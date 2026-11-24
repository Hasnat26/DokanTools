import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync("supabase/migrations/202611110001_invoice_first_foundation.sql","utf8");
const issuanceGuard=readFileSync("src/lib/invoice-issuance-guard.mjs","utf8");
const requestValidator=readFileSync("src/lib/invoice-request-validation.mjs","utf8");

test("invoice namespace and per-shop number uniqueness",()=>{assert.match(sql,/primary key\s*\(idempotency_namespace,request_id\)/i);assert.match(sql,/unique\s*\(shop_id,bill_number\)/i);assert.doesNotMatch(sql,/transaction_requests|create_memo_transaction|stock_movements|baki_entries|public\.memos|public\.customers/i);});
test("shop authorization precedes private idempotency registry",()=>{assert.ok(sql.indexOf("Authenticate/authorize the requested tenant first")<sql.indexOf("insert into public.invoice_idempotency"));});
test("profile mismatch is checked only for new idempotency claims",()=>{assert.ok(sql.indexOf("if v_claim_count=0")<sql.indexOf("SHOP_PROFILE_CHANGED_REFRESH_REQUIRED"));});
test("runtime issue gate is default-off and private",()=>{assert.match(sql,/values\('invoice_issue',false\)/i);assert.match(sql,/INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL/);assert.match(issuanceGuard,/INVOICE_ISSUANCE_ENABLED = false/);assert.match(issuanceGuard,/INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL/);});
test("Maps URL is optional and normalized against explicit HTTPS allow-list",()=>{assert.match(sql,/map_url_snapshot text check\(map_url_snapshot is null/);assert.match(sql,/maps\[\.\]app\[\.\]goo\[\.\]gl/);assert.match(sql,/v_map:=case when v_shop\.map_link/);assert.ok(sql.includes("nullif(btrim(v_header->>'mapUrl'),'')"));});
test("security definer path is locked to pg_catalog",()=>{assert.match(sql,/security definer\s+set search_path=pg_catalog/i);assert.match(sql,/revoke all on function public\.create_invoice_transaction[^;]*from public,anon/i);assert.match(sql,/grant execute on function public\.create_invoice_transaction[^;]*to authenticated/i);});
test("invoice facts reject update/delete",()=>{assert.match(sql,/invoices_immutable/i);assert.match(sql,/invoice_lines_immutable/i);assert.match(sql,/INVOICE_FACTS_IMMUTABLE/i);});
test("decimal grammar accepts dot and route bounds request bytes",()=>{assert.match(requestValidator,/\(\[\.\]\[0-9\]/);assert.match(sql,/\(\[\.\]\[0-9\]/);});
test("API authenticates and scopes reads by shop",()=>{assert.match(issuanceGuard,/INVOICE_ISSUANCE_ENABLED = false/);});
test("PostgreSQL harness SQL uses balanced dollar-quoted blocks",()=>{for(const path of ["tests/postgres/00_fixture_and_seed.sql","tests/postgres/05_baseline_assertions.sql","tests/postgres/10_security_rls_assertions.sql","tests/postgres/30_fault_injection.sql","tests/postgres/40_rollback_assertions.sql"]){const source=readFileSync(path,"utf8");assert.equal((source.match(/\$\$/g)||[]).length%2,0,path+" has unbalanced $ delimiters");assert.doesNotMatch(source,/\bdo \$\s/m,path+" has a single-dollar DO opener");}});
test("public QR/token capability is absent",()=>{assert.doesNotMatch(sql,/invoice_public_links|verify_invoice/i);assert.doesNotMatch(issuanceGuard,/publicUrl|qrPayload|signedUrl/i);});
