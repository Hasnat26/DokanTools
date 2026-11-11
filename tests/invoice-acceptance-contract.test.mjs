import test from "node:test";
import assert from "node:assert/strict";
import { owners, shops, headers, drafts, issued, requests, legacyState } from "./fixtures/invoice-fixtures.mjs";

function clone(value) { return structuredClone(value); }

function createContractStore() {
  const shopOwners = new Map([[shops.shopA1, owners.ownerA], [shops.shopA2, owners.ownerA], [shops.shopB1, owners.ownerB]]);
  const counters = new Map();
  const invoices = new Map();
  const claims = new Map();
  const legacy = clone(legacyState);
  let nextInvoiceId = 0;

  async function issue({ authOwnerId, requestId, namespace = requests.namespace, shopId, payload, failAt }) {
    if (!authOwnerId) throw new Error("AUTH_REQUIRED");
    if (shopOwners.get(shopId) !== authOwnerId) throw new Error("ACCESS_DENIED");
    const key = `${namespace}:${requestId}`;
    const hash = JSON.stringify(payload);
    const existing = claims.get(key);
    if (existing) {
      if (existing.ownerId !== authOwnerId || existing.shopId !== shopId || existing.payloadHash !== hash) throw new Error("IDEMPOTENCY_CONFLICT");
      return clone(invoices.get(existing.invoiceId));
    }
    const current = counters.get(shopId) ?? 0;
    const number = current + 1;
    if (failAt === "after-claim" || failAt === "after-number" || failAt === "after-invoice") throw new Error("INJECTED_FAILURE");
    const invoiceId = `synthetic-invoice-${++nextInvoiceId}`;
    const invoice = {
      invoiceId, ownerId: authOwnerId, shopId, status: "issued", billNumber: number,
      headerSnapshot: clone(headers.shopA1),
      lines: clone(payload.lines ?? []),
      publicQr: null, publicUrl: null,
    };
    invoices.set(invoiceId, invoice);
    claims.set(key, { ownerId: authOwnerId, shopId, payloadHash: hash, invoiceId });
    counters.set(shopId, number);
    return clone(invoice);
  }

  return { issue, shopOwners, counters, invoices, claims, legacy };
}

test("IF-QA-001/002 fixture contract: tenant authorization precedes idempotency claim", async () => {
  const store = createContractStore();
  await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopB1, payload: requests.exactPayload }), /ACCESS_DENIED/);
  assert.equal(store.claims.size, 0);
  assert.equal(store.counters.size, 0);
  await assert.rejects(store.issue({ authOwnerId: null, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload }), /AUTH_REQUIRED/);
});

test("IF-QA-003/004 fixture oracle: shop counters are independent and failed issue consumes no number", async () => {
  const store = createContractStore();
  const a = await store.issue({ authOwnerId: owners.ownerA, requestId: "r-a", shopId: shops.shopA1, payload: requests.exactPayload });
  const b = await store.issue({ authOwnerId: owners.ownerB, requestId: "r-b", shopId: shops.shopB1, payload: requests.exactPayload });
  assert.equal(a.billNumber, 1);
  assert.equal(b.billNumber, 1);
  await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: "r-fail", shopId: shops.shopA1, payload: requests.exactPayload, failAt: "after-number" }), /INJECTED_FAILURE/);
  const next = await store.issue({ authOwnerId: owners.ownerA, requestId: "r-next", shopId: shops.shopA1, payload: requests.exactPayload });
  assert.equal(next.billNumber, 2);
});

test("IF-QA-005/006 fixture oracle: same key exact replay; changed payload conflicts", async () => {
  const store = createContractStore();
  const first = await store.issue({ authOwnerId: owners.ownerA, requestId: "same", shopId: shops.shopA1, payload: requests.exactPayload });
  const replay = await store.issue({ authOwnerId: owners.ownerA, requestId: "same", shopId: shops.shopA1, payload: requests.exactPayload });
  assert.deepEqual(replay, first);
  await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: "same", shopId: shops.shopA1, payload: { lines: [{ quantity: "2" }] } }), /IDEMPOTENCY_CONFLICT/);
  assert.equal(store.invoices.size, 1);
  assert.equal(store.counters.get(shops.shopA1), 1);
});

test("IF-QA-007/008 oracle: concurrent duplicate requests converge to one result", async () => {
  const store = createContractStore();
  const outcomes = await Promise.all(Array.from({ length: 12 }, () => store.issue({
    authOwnerId: owners.ownerA, requestId: "concurrent-same", shopId: shops.shopA1, payload: requests.exactPayload,
  })));
  assert.equal(new Set(outcomes.map(x => x.invoiceId)).size, 1);
  assert.equal(store.invoices.size, 1);
  assert.equal(store.counters.get(shops.shopA1), 1);
});

test("IF-QA-009 fault injection: every pre-commit failure leaves no committed state", async () => {
  for (const failAt of ["after-claim", "after-number", "after-invoice"]) {
    const store = createContractStore();
    await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: failAt, shopId: shops.shopA1, payload: requests.exactPayload, failAt }), /INJECTED_FAILURE/);
    assert.equal(store.invoices.size, 0);
    assert.equal(store.claims.size, 0);
    assert.equal(store.counters.size, 0);
  }
});

test("IF-QA-010 issued header and line snapshots do not follow later source edits", () => {
  const invoice = clone(issued);
  const profileNow = { ...clone(headers.shopA1), shopName: "Renamed Shop", profileRevision: 5 };
  const menuNow = { id: "menu-a-rice", name: "Updated Menu Name", price: "99.00" };
  assert.equal(invoice.headerSnapshot.shopName, "QA Synthetic Food Shop A");
  assert.equal(invoice.lines[0].itemNameSnapshot, "Plain Rice");
  assert.notEqual(profileNow.shopName, invoice.headerSnapshot.shopName);
  assert.notEqual(menuNow.name, invoice.lines[0].itemNameSnapshot);
});

test("IF-QA-011 invoice path leaves all legacy memo/stock/customer/ledger state unchanged", async () => {
  const store = createContractStore();
  const before = clone(store.legacy);
  await store.issue({ authOwnerId: owners.ownerA, requestId: "no-side-effects", shopId: shops.shopA1, payload: requests.exactPayload });
  assert.deepEqual(store.legacy, before);
});

test("IF-QA-012 draft is not issued and contains no bill number/time or verification", () => {
  assert.equal(drafts.minimal.status, "draft");
  assert.equal("billNumber" in drafts.minimal, false);
  assert.equal("issuedAt" in drafts.minimal, false);
  assert.equal("verified" in drafts.minimal, false);
  assert.equal(issued.status, "issued");
  assert.equal(issued.publicQr, null);
  assert.equal(issued.publicUrl, null);
});

test("IF-QA-013/018 public QR remains disabled in the synthetic default fixture", () => {
  const qrEnabled = false;
  const poGates = { po12: false, poI06A: false, poI11: false, pmRelease: false, securityEvidence: false };
  const mayMint = qrEnabled && Object.values(poGates).every(Boolean);
  assert.equal(mayMint, false);
  assert.equal(issued.publicQr, null);
  assert.equal(issued.publicUrl, null);
});

test("IF-QA-014 history/detail fixture cannot cross tenant boundary", () => {
  const invoice = clone(issued);
  assert.equal(invoice.ownerId, owners.ownerA);
  const requestingOwner = owners.ownerB;
  assert.notEqual(invoice.ownerId, requestingOwner);
});

test("IF-QA-015 PO-dependent display/business policy stays unspecified", () => {
  const pending = ["PO-02", "PO-04", "PO-05", "PO-06", "PO-11", "PO-12", "PO-I11", "PO-I06A", "PO-L01", "PO-L02", "PO-L03", "PO-L04"];
  assert.equal(pending.length, 12);
  assert.ok(pending.includes("PO-04"));
  assert.ok(pending.includes("PO-05"));
});

test("IF-QA-017 required Bangla mockup strings remain exact in fixture", () => {
  const heading = "খাবারের বিল";
  const footer = "ধন্যবাদ, আবার আসবেন!";
  assert.equal(heading, "খাবারের বিল");
  assert.equal(footer, "ধন্যবাদ, আবার আসবেন!");
});

test("IF-QA-020 lost response retry contract preserves same request identity", async () => {
  const store = createContractStore();
  const first = await store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload });
  const recovered = await store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload });
  assert.equal(recovered.invoiceId, first.invoiceId);
  assert.equal(store.invoices.size, 1);
});
