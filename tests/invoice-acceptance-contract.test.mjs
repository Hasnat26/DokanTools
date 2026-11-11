import test from "node:test";
import assert from "node:assert/strict";
import { owners, shops, headers, drafts, issued, requests, legacyState } from "./fixtures/invoice-fixtures.mjs";

function clone(value) { return structuredClone(value); }

// Stable JSON representation: object-key order is irrelevant; array order is significant.
export function canonicalizePayload(value) {
  if (Array.isArray(value)) return value.map(canonicalizePayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalizePayload(value[key])]),
    );
  }
  return value;
}
function canonicalPayload(value) { return JSON.stringify(canonicalizePayload(value)); }

function createContractStore() {
  const shopOwners = new Map([[shops.shopA1, owners.ownerA], [shops.shopA2, owners.ownerA], [shops.shopB1, owners.ownerB]]);
  const counters = new Map();
  const invoices = new Map();
  const claims = new Map();
  const legacy = clone(legacyState);
  let nextInvoiceId = 0;

  async function issue({ authOwnerId, requestId, namespace = requests.namespace, shopId, payload }) {
    if (!authOwnerId) throw new Error("AUTH_REQUIRED");
    if (shopOwners.get(shopId) !== authOwnerId) throw new Error("ACCESS_DENIED");
    const key = `${namespace}:${requestId}`;
    const payloadHash = canonicalPayload(payload);
    const existing = claims.get(key);
    if (existing) {
      if (existing.ownerId !== authOwnerId || existing.shopId !== shopId || existing.payloadHash !== payloadHash) throw new Error("IDEMPOTENCY_CONFLICT");
      return clone(invoices.get(existing.invoiceId));
    }
    const billNumber = (counters.get(shopId) ?? 0) + 1;
    const invoiceId = `synthetic-invoice-${++nextInvoiceId}`;
    const invoice = {
      invoiceId, ownerId: authOwnerId, shopId, status: "issued", billNumber,
      headerSnapshot: clone(headers.shopA1),
      lines: clone(payload.lines ?? []),
      publicQr: null, publicUrl: null,
    };
    invoices.set(invoiceId, invoice);
    claims.set(key, { ownerId: authOwnerId, shopId, payloadHash, invoiceId });
    counters.set(shopId, billNumber);
    return clone(invoice);
  }

  function historyForOwner(authOwnerId, shopId) {
    if (!authOwnerId || shopOwners.get(shopId) !== authOwnerId) return [];
    return [...invoices.values()]
      .filter((invoice) => invoice.ownerId === authOwnerId && invoice.shopId === shopId)
      .map(clone);
  }

  function detailForOwner(authOwnerId, invoiceId) {
    if (!authOwnerId) return null;
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.ownerId !== authOwnerId) return null;
    return clone(invoice);
  }

  return { issue, historyForOwner, detailForOwner, shopOwners, counters, invoices, claims, legacy };
}

test("IF-QA-001/002 model oracle: authorization precedes idempotency claim", async () => {
  const store = createContractStore();
  await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopB1, payload: requests.exactPayload }), /ACCESS_DENIED/);
  assert.equal(store.claims.size, 0);
  assert.equal(store.counters.size, 0);
  await assert.rejects(store.issue({ authOwnerId: null, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload }), /AUTH_REQUIRED/);
});

test("IF-QA-003 model oracle: sequential shop counters are isolated", async () => {
  const store = createContractStore();
  const a1 = await store.issue({ authOwnerId: owners.ownerA, requestId: "r-a1", shopId: shops.shopA1, payload: requests.exactPayload });
  const a2 = await store.issue({ authOwnerId: owners.ownerA, requestId: "r-a2", shopId: shops.shopA1, payload: requests.exactPayload });
  const b1 = await store.issue({ authOwnerId: owners.ownerB, requestId: "r-b1", shopId: shops.shopB1, payload: requests.exactPayload });
  assert.deepEqual([a1.billNumber, a2.billNumber, b1.billNumber], [1, 2, 1]);
});

test("IF-QA-005/006 model oracle: canonical replay accepts reordered JSON keys and rejects changed values", async () => {
  const store = createContractStore();
  const payloadA = { ownerId: owners.ownerA, shopId: shops.shopA1, lines: [{ menuItemId: "rice", quantity: "1", unitPrice: "10.00" }], metadata: { source: "web", version: 1 } };
  const payloadReordered = { metadata: { version: 1, source: "web" }, lines: [{ unitPrice: "10.00", quantity: "1", menuItemId: "rice" }], shopId: shops.shopA1, ownerId: owners.ownerA };
  const first = await store.issue({ authOwnerId: owners.ownerA, requestId: "canonical-key", shopId: shops.shopA1, payload: payloadA });
  const replay = await store.issue({ authOwnerId: owners.ownerA, requestId: "canonical-key", shopId: shops.shopA1, payload: payloadReordered });
  assert.deepEqual(replay, first);
  await assert.rejects(store.issue({ authOwnerId: owners.ownerA, requestId: "canonical-key", shopId: shops.shopA1, payload: { ...payloadReordered, metadata: { version: 2, source: "web" } } }), /IDEMPOTENCY_CONFLICT/);
  assert.equal(store.invoices.size, 1);
  assert.equal(store.counters.get(shops.shopA1), 1);
});

test("IF-QA-007/008 concurrent duplicate and distinct-request numbering", { skip: "BLOCKED: in-memory Map oracle cannot prove scheduler interleaving, database locking, uniqueness or multi-connection concurrency; implement with CH-3 disposable PostgreSQL harness." }, () => {});
test("IF-QA-009 partial-write rollback", { skip: "BLOCKED: requires CH-3 transaction-level fault injection after actual partial SQL mutations on disposable PostgreSQL; a Map oracle would not prove rollback." }, () => {});

test("IF-QA-010 fixture model: issued snapshot remains independent of later source edits", () => {
  const invoice = clone(issued);
  const profileNow = { ...clone(headers.shopA1), shopName: "Renamed Shop", profileRevision: 5 };
  const menuNow = { id: "menu-a-rice", name: "Updated Menu Name", price: "99.00" };
  assert.equal(invoice.headerSnapshot.shopName, "QA Synthetic Food Shop A");
  assert.equal(invoice.lines[0].itemNameSnapshot, "Plain Rice");
  assert.notEqual(profileNow.shopName, invoice.headerSnapshot.shopName);
  assert.notEqual(menuNow.name, invoice.lines[0].itemNameSnapshot);
});

test("IF-QA-011 fixture model: modeled invoice operation leaves legacy counters unchanged", async () => {
  const store = createContractStore();
  const before = clone(store.legacy);
  await store.issue({ authOwnerId: owners.ownerA, requestId: "no-side-effects", shopId: shops.shopA1, payload: requests.exactPayload });
  assert.deepEqual(store.legacy, before);
});

test("IF-QA-012 fixture model: draft is not issued", () => {
  assert.equal(drafts.minimal.status, "draft");
  assert.equal("billNumber" in drafts.minimal, false);
  assert.equal("issuedAt" in drafts.minimal, false);
  assert.equal("verified" in drafts.minimal, false);
  assert.equal(issued.status, "issued");
});

test("IF-QA-013/018 fixture default: public QR fields are absent", () => {
  assert.equal(issued.publicQr, null);
  assert.equal(issued.publicUrl, null);
});

test("IF-QA-014 owner-scoped history and detail model: Owner B cannot retrieve Owner A invoice", async () => {
  const store = createContractStore();
  const invoiceA = await store.issue({ authOwnerId: owners.ownerA, requestId: "owner-a-invoice", shopId: shops.shopA1, payload: requests.exactPayload });
  assert.equal(store.historyForOwner(owners.ownerA, shops.shopA1).length, 1);
  assert.equal(store.historyForOwner(owners.ownerB, shops.shopA1).length, 0);
  assert.deepEqual(store.detailForOwner(owners.ownerA, invoiceA.invoiceId), invoiceA);
  assert.equal(store.detailForOwner(owners.ownerB, invoiceA.invoiceId), null);
  assert.equal(store.detailForOwner(owners.ownerB, "unknown-invoice-id"), null);
});

test("IF-QA-015 pending PO decisions are recorded as unresolved test inputs", () => {
  const pending = ["PO-02", "PO-04", "PO-05", "PO-06", "PO-11", "PO-12", "PO-I11", "PO-I06A", "PO-L01", "PO-L02", "PO-L03", "PO-L04"];
  assert.equal(pending.length, 12);
  assert.ok(pending.includes("PO-04"));
  assert.ok(pending.includes("PO-05"));
});

test("IF-QA-020 fixture model: lost-response retry uses same request identity", async () => {
  const store = createContractStore();
  const first = await store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload });
  const recovered = await store.issue({ authOwnerId: owners.ownerA, requestId: requests.requestId, shopId: shops.shopA1, payload: requests.exactPayload });
  assert.equal(recovered.invoiceId, first.invoiceId);
  assert.equal(store.invoices.size, 1);
});
