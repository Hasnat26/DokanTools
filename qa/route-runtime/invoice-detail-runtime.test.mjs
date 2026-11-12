import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const APP_DIR = resolve(process.env.APP_DIR || "app");
const NO_CONFIG_APP_DIR = resolve(process.env.NO_CONFIG_APP_DIR || process.env.APP_DIR || "app");
const EVIDENCE_DIR = resolve(process.env.EVIDENCE_DIR || "route-runtime-evidence");
const ROUTE_APP_SHA = process.env.ROUTE_APP_SHA;
const QA_HARNESS_SHA = process.env.QA_HARNESS_SHA;
const MOCK_HOST = "127.0.0.1";
const MOCK_PORT = 54321;
const APP_PORT = 3101;
const NO_CONFIG_PORT = 3102;
const MOCK_URL = `http://${MOCK_HOST}:${MOCK_PORT}`;
const INVOICE_ID = "11111111-1111-4111-8111-111111111111";
const SHOP_ID = "22222222-2222-4222-8222-222222222222";
const TOKEN = "synthetic-owner-token";
const ANON = "synthetic-local-anon-key";
const REQUIRED_HEADERS = { "cache-control": "no-store", pragma: "no-cache" };
const transcript = [];
let mockServer;
let configuredApp;
let noConfigApp;
let mockScenario = "normal";

const invoiceRow = {
  id: INVOICE_ID, shop_id: SHOP_ID, bill_number: 17,
  issued_at: "2026-11-01T10:00:00.000Z", total_amount: "125.50",
  shop_name_snapshot: "Synthetic Test Shop", shop_address_snapshot: "Loopback Road",
  shop_phone_snapshot: "01700000000", map_url_snapshot: null,
};
const lineRows = [
  { line_no: 1, catalog_item_id_snapshot: "catalog-b", item_name_snapshot: "Rice", unit_snapshot: "plate", quantity: "2", unit_price: "50.00", line_total: "100.00" },
  { line_no: 2, catalog_item_id_snapshot: "catalog-a", item_name_snapshot: "Water", unit_snapshot: "bottle", quantity: "1", unit_price: "25.50", line_total: "25.50" },
];

function assertLoopbackUrl(value) {
  const url = new URL(value);
  assert.equal(url.protocol, "http:");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname), `Refusing non-loopback Supabase URL: ${url.hostname}`);
  assert.equal(url.port, String(MOCK_PORT));
}
assertLoopbackUrl(MOCK_URL);
assert.ok(!/supabase\.co|render\.com|production|staging/i.test(MOCK_URL));

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
}

async function mockHandler(req, res) {
  const url = new URL(req.url, MOCK_URL);
  const entry = {
    method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams.entries()),
    authorization: req.headers.authorization || null, apikey: req.headers.apikey || null,
  };
  entry.body = await readJson(req);
  transcript.push(entry);
  if (req.socket.localAddress !== "127.0.0.1" && req.socket.localAddress !== "::ffff:127.0.0.1") {
    res.writeHead(403, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "loopback only" }));
    return;
  }
  res.setHeader("content-type", "application/json");
  if (req.method !== "GET") {
    res.writeHead(405); res.end(JSON.stringify({ message: "GET only" })); return;
  }
  if (url.pathname === "/auth/v1/user") {
    if (req.headers.authorization !== `Bearer ${TOKEN}` || req.headers.apikey !== ANON) {
      res.writeHead(401); res.end(JSON.stringify({ message: "synthetic invalid token", code: "invalid_token" })); return;
    }
    res.writeHead(200); res.end(JSON.stringify({ id: "33333333-3333-4333-8333-333333333333", aud: "authenticated", role: "authenticated" })); return;
  }
  if (url.pathname === "/rest/v1/invoices") {
    if (url.searchParams.get("shop_id") !== `eq.${SHOP_ID}` || !url.searchParams.has("id")) {
      res.writeHead(400); res.end(JSON.stringify({ message: "missing exact invoice filters" })); return;
    }
    if (url.searchParams.get("id") !== `eq.${INVOICE_ID}`) {
      res.writeHead(200); res.end("[]"); return;
    }
    if (url.searchParams.get("id") === `eq.${INVOICE_ID}` && mockScenario === "invoice-query-error") {
      res.writeHead(500); res.end(JSON.stringify({ code: "XX000", message: "synthetic invoice query failure" })); return;
    }
    res.writeHead(200); res.end(JSON.stringify(invoiceRow)); return;
  }
  if (url.pathname === "/rest/v1/invoice_lines") {
    if (url.searchParams.get("shop_id") !== `eq.${SHOP_ID}` || url.searchParams.get("invoice_id") !== `eq.${INVOICE_ID}`) {
      res.writeHead(400); res.end(JSON.stringify({ message: "missing exact invoice-line filters" })); return;
    }
    if (mockScenario === "invoice-lines-error") {
      res.writeHead(500); res.end(JSON.stringify({ code: "XX000", message: "synthetic invoice-lines failure" })); return;
    }
    res.writeHead(200); res.end(JSON.stringify(lineRows)); return;
  }
  res.writeHead(404); res.end(JSON.stringify({ message: "unknown mock endpoint" }));
}

function startNext(port, withConfig, appDir = APP_DIR) {
  const nextBin = resolve(appDir, "node_modules/next/dist/bin/next");
  const env = { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_ENV: "production" };
  delete env.SUPABASE_URL;
  delete env.SUPABASE_ANON_KEY;
  if (withConfig) {
    env.NEXT_PUBLIC_SUPABASE_URL = MOCK_URL;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON;
  } else {
    delete env.NEXT_PUBLIC_SUPABASE_URL;
    delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: appDir, env, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk.toString(); });
  child.stderr.on("data", chunk => { output += chunk.toString(); });
  child.output = () => output;
  return child;
}

async function waitForApp(port, child) {
  const url = `http://127.0.0.1:${port}/api/invoices/not-a-uuid`;
  for (let i = 0; i < 90; i++) {
    if (child.exitCode !== null) throw new Error(`Next.js exited before readiness: ${child.output()}`);
    try {
      const response = await fetch(url);
      if (response.status === 400) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Next.js did not become ready on ${port}: ${child.output()}`);
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([new Promise(resolveExit => child.once("exit", resolveExit)), delay(5000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function request(port, invoiceId = INVOICE_ID, { shopId = SHOP_ID, token = TOKEN, headers = {} } = {}) {
  const requestHeaders = { ...headers };
  if (token !== null) requestHeaders.authorization = `Bearer ${token}`;
  const suffix = shopId === null ? "" : `?shopId=${encodeURIComponent(shopId)}`;
  const response = await fetch(`http://127.0.0.1:${port}/api/invoices/${invoiceId}${suffix}`, { headers: requestHeaders });
  const body = await response.json();
  assert.equal(response.headers.get("cache-control"), REQUIRED_HEADERS["cache-control"]);
  assert.equal(response.headers.get("pragma"), REQUIRED_HEADERS.pragma);
  assert.match(response.headers.get("content-type") || "", /application\/json/);
  return { status: response.status, body };
}

before(async () => {
  assert.ok(ROUTE_APP_SHA, "ROUTE_APP_SHA must be recorded");
  assert.ok(QA_HARNESS_SHA, "QA_HARNESS_SHA must be recorded");
  mockServer = createServer((req, res) => { void mockHandler(req, res); });
  await new Promise((resolveListen, reject) => {
    mockServer.once("error", reject);
    mockServer.listen(MOCK_PORT, MOCK_HOST, resolveListen);
  });
  assert.equal(mockServer.address().address, MOCK_HOST, "Supabase mock must bind only to IPv4 loopback");
  configuredApp = startNext(APP_PORT, true);
  await waitForApp(APP_PORT, configuredApp);
  noConfigApp = startNext(NO_CONFIG_PORT, false, NO_CONFIG_APP_DIR);
  await waitForApp(NO_CONFIG_PORT, noConfigApp);
});

after(async () => {
  await stop(noConfigApp);
  await stop(configuredApp);
  if (mockServer) await new Promise(resolveClose => mockServer.close(resolveClose));
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await writeFile(resolve(EVIDENCE_DIR, "mock-transcript.json"), JSON.stringify(transcript, null, 2));
  await writeFile(resolve(EVIDENCE_DIR, "tested-sha.txt"), [
    `ROUTE_APP_SHA=${ROUTE_APP_SHA}`,
    `BROWSER_APP_SHA=6cc0ce8535423a9367ed05f17ecf15e5e1d34c20`,
    `QA_HARNESS_SHA=${QA_HARNESS_SHA}`,
    `MOCK_SUPABASE_URL=${MOCK_URL}`,
    "MOCK_BIND=127.0.0.1 only",
  ].join("\n") + "\n");
});

test("01 invalid invoice UUID -> exact 400 INVALID_INVOICE_ID", async () => {
  assert.deepEqual(await request(APP_PORT, "not-a-uuid"), { status: 400, body: { error: { code: "INVALID_INVOICE_ID" } } });
  assert.equal(transcript.length, 0, "invalid UUID must not call Supabase");
});

test("02 missing Supabase configuration -> exact 401 UNAUTHENTICATED", async () => {
  assert.deepEqual(await request(NO_CONFIG_PORT, INVOICE_ID), { status: 401, body: { error: { code: "UNAUTHENTICATED" } } });
  assert.equal(transcript.length, 0, "missing config must not call Supabase");
});

test("03 missing bearer token -> exact 401 UNAUTHENTICATED", async () => {
  assert.deepEqual(await request(APP_PORT, INVOICE_ID, { token: null }), { status: 401, body: { error: { code: "UNAUTHENTICATED" } } });
  assert.equal(transcript.length, 0, "missing bearer must not call Supabase");
});

test("04 Supabase getUser error -> exact 401 UNAUTHENTICATED", async () => {
  assert.deepEqual(await request(APP_PORT, INVOICE_ID, { token: "invalid-synthetic-token" }), { status: 401, body: { error: { code: "UNAUTHENTICATED" } } });
  assert.equal(transcript.length, 1);
  assert.equal(transcript[0].path, "/auth/v1/user");
  assert.equal(transcript[0].authorization, "Bearer invalid-synthetic-token");
});

test("05 invalid shop UUID -> exact 400 INVALID_SHOP_ID after authenticated user lookup", async () => {
  const start = transcript.length;
  assert.deepEqual(await request(APP_PORT, INVOICE_ID, { shopId: "bad-shop-id" }), { status: 400, body: { error: { code: "INVALID_SHOP_ID" } } });
  assert.equal(transcript.length, start + 1);
  assert.equal(transcript[start].path, "/auth/v1/user");
  assert.equal(transcript[start].authorization, `Bearer ${TOKEN}`);
});

test("06 invoice row missing -> exact 404 INVOICE_NOT_FOUND", async () => {
  const start = transcript.length;
  assert.deepEqual(await request(APP_PORT, INVOICE_ID.replace("11111111", "99999999")), { status: 404, body: { error: { code: "INVOICE_NOT_FOUND" } } });
  const invoiceQuery = transcript.slice(start).find(x => x.path === "/rest/v1/invoices");
  assert.ok(invoiceQuery);
  assert.equal(invoiceQuery.query.shop_id, `eq.${SHOP_ID}`);
  assert.equal(invoiceQuery.query.id, `eq.${INVOICE_ID.replace("11111111", "99999999")}`);
});

test("07 invoice PostgREST query failure -> exact 404 INVOICE_NOT_FOUND", async () => {
  const start = transcript.length;
  mockScenario = "invoice-query-error";
  try {
    assert.deepEqual(await request(APP_PORT), { status: 404, body: { error: { code: "INVOICE_NOT_FOUND" } } });
  } finally { mockScenario = "normal"; }
  assert.ok(transcript.slice(start).some(x => x.path === "/rest/v1/invoices"));
});

test("08 invoice-lines query failure -> exact 503 INVOICE_UNAVAILABLE", async () => {
  const start = transcript.length;
  mockScenario = "invoice-lines-error";
  let response;
  try { response = await request(APP_PORT); } finally { mockScenario = "normal"; }
  assert.deepEqual(response, { status: 503, body: { error: { code: "INVOICE_UNAVAILABLE" } } });
  const calls = transcript.slice(start);
  const invoiceQuery = calls.find(x => x.path === "/rest/v1/invoices");
  const linesQuery = calls.find(x => x.path === "/rest/v1/invoice_lines");
  assert.ok(invoiceQuery && linesQuery);
  assert.equal(invoiceQuery.query.shop_id, `eq.${SHOP_ID}`);
  assert.equal(invoiceQuery.query.id, `eq.${INVOICE_ID}`);
  assert.equal(linesQuery.query.shop_id, `eq.${SHOP_ID}`);
  assert.equal(linesQuery.query.invoice_id, `eq.${INVOICE_ID}`);
  assert.equal(linesQuery.query.order, "line_no.asc");
});

test("09 successful detail -> exact 200 InvoiceDTO, ordered lines and scoped PostgREST filters", async () => {
  const start = transcript.length;
  const result = await request(APP_PORT);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    invoice: {
      id: INVOICE_ID, shopId: SHOP_ID, billNumber: "17", issuedAt: "2026-11-01T10:00:00.000Z",
      currency: "BDT", totalAmount: "125.50",
      header: { shopName: "Synthetic Test Shop", shopAddress: "Loopback Road", shopPhone: "01700000000", mapUrl: null },
      lines: [
        { lineNo: 1, catalogItemId: "catalog-b", itemName: "Rice", unit: "plate", quantity: "2", unitPrice: "50.00", lineTotal: "100.00" },
        { lineNo: 2, catalogItemId: "catalog-a", itemName: "Water", unit: "bottle", quantity: "1", unitPrice: "25.50", lineTotal: "25.50" },
      ],
    },
  });
  const calls = transcript.slice(start);
  const auth = calls.find(x => x.path === "/auth/v1/user");
  const invoiceQuery = calls.find(x => x.path === "/rest/v1/invoices");
  const linesQuery = calls.find(x => x.path === "/rest/v1/invoice_lines");
  assert.ok(auth && invoiceQuery && linesQuery);
  assert.equal(auth.authorization, `Bearer ${TOKEN}`);
  assert.equal(auth.apikey, ANON);
  assert.equal(invoiceQuery.authorization, `Bearer ${TOKEN}`);
  assert.equal(invoiceQuery.query.shop_id, `eq.${SHOP_ID}`);
  assert.equal(invoiceQuery.query.id, `eq.${INVOICE_ID}`);
  assert.equal(linesQuery.authorization, `Bearer ${TOKEN}`);
  assert.equal(linesQuery.query.shop_id, `eq.${SHOP_ID}`);
  assert.equal(linesQuery.query.invoice_id, `eq.${INVOICE_ID}`);
  assert.equal(linesQuery.query.order, "line_no.asc");
  assert.ok(calls.every(x => x.method === "GET"), "no POST/issuance/QR request may occur");
});


test("10 mock transcript contains no mutation, issuance or QR endpoint requests", () => {
  assert.ok(transcript.every(x => x.method === "GET"));
  assert.ok(transcript.every(x => !/issue|qr/i.test(x.path)));
});
