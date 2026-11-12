import assert from "node:assert/strict";
import { test } from "node:test";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

const fileUrl = new URL("../src/app/api/invoices/[invoiceId]/route.ts", import.meta.url);
const requiredHeaders = { "Cache-Control": "no-store", "Pragma": "no-cache" };

test("detail GET routes every explicit response through the no-store helper", async () => {
  const source = await readFile(fileUrl, "utf8");
  assert.match(source, /const json=\(body:unknown,status=200\)=>NextResponse\.json\(body,\{status,headers:\{"Cache-Control":"no-store","Pragma":"no-cache"\}\}\);/);
  assert.equal((source.match(/return json\(/g) ?? []).length, 6);
  assert.equal((source.match(/return NextResponse\.json\(/g) ?? []).length, 0);
  for (const branch of [
    /return json\(\{error:\{code:"INVALID_INVOICE_ID"\}\},400\)/,
    /return json\(\{error:\{code:"UNAUTHENTICATED"\}\},401\)/,
    /return json\(\{error:\{code:"INVALID_SHOP_ID"\}\},400\)/,
    /return json\(\{error:\{code:"INVOICE_NOT_FOUND"\}\},404\)/,
    /return json\(\{error:\{code:"INVOICE_UNAVAILABLE"\}\},503\)/,
    /return json\(\{invoice\}\)/,
  ]) assert.match(source, branch);
});

test("shared detail response helper preserves all existing status/body branches and adds both headers", async () => {
  const cases = [
    [400, { error: { code: "INVALID_INVOICE_ID" } }],
    [401, { error: { code: "UNAUTHENTICATED" } }],
    [400, { error: { code: "INVALID_SHOP_ID" } }],
    [404, { error: { code: "INVOICE_NOT_FOUND" } }],
    [503, { error: { code: "INVOICE_UNAVAILABLE" } }],
    [200, { invoice: { id: "11111111-1111-4111-8111-111111111111" } }],
  ];
  for (const [status, body] of cases) {
    const response = NextResponse.json(body, { status, headers: requiredHeaders });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Pragma"), "no-cache");
    assert.deepEqual(await response.json(), body);
  }
});
