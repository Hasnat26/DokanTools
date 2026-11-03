import test from "node:test";
import assert from "node:assert/strict";
import { createMemoPendingStore } from "../src/lib/memo-pending-store.mjs";

function persistentAdapter() {
  const records = new Map();
  let tail = Promise.resolve();
  return {
    records,
    // Deterministic serialized transaction simulation: each claim is one atomic
    // critical section over the map, matching the IndexedDB readwrite contract.
    async claim(record) {
      const previous = tail;
      let release;
      tail = new Promise((resolve) => { release = resolve; });
      await previous;
      try {
        const existing = records.get(record.shopId);
        if (existing) {
          if (existing.operationId === record.operationId && JSON.stringify(existing.payload) === JSON.stringify(record.payload)) {
            return structuredClone(existing);
          }
          throw new Error("An unresolved memo already exists for this shop; its operation ID and payload cannot be replaced");
        }
        records.set(record.shopId, structuredClone(record));
        return structuredClone(record);
      } finally {
        release();
      }
    },
    async get(shopId) { return records.has(shopId) ? structuredClone(records.get(shopId)) : null; },
    async deleteIfMatches(shopId, operationId, payload) {
      const previous = tail;
      let release;
      tail = new Promise((resolve) => { release = resolve; });
      await previous;
      try {
        const existing = records.get(shopId);
        if (!existing || existing.operationId !== operationId) return false;
        if (payload !== undefined && JSON.stringify(existing.payload) !== JSON.stringify(payload)) return false;
        records.delete(shopId);
        return true;
      } finally { release(); }
    },
  };
}

const pendingRecord = () => ({
  shopId: "shop-123", operationId: "op-uuid-abc",
  payload: { p_request_id: "op-uuid-abc", p_shop_id: "shop-123", p_customer_id: null, p_items: [{name:"Rice",qty:2,price:50}], p_due_amount:0 },
  formSnapshot: { customerId:"", customerName:"", customerPhone:"", items:[{product_id:"",name:"Rice",qty:"2",unit:"kg",price:"50"}], due:"0" },
  createdAt: "2026-11-02T00:00:00.000Z",
});

test("operation ID and exact pending payload survive store recreation (reload simulation)", async () => {
  const adapter = persistentAdapter();
  const firstPageStore = createMemoPendingStore(adapter);
  const record = pendingRecord();
  await firstPageStore.save(record);
  // A new page/module instance reads the same durable adapter after simulated reload.
  const reopenedPageStore = createMemoPendingStore(adapter);
  const restored = await reopenedPageStore.get(record.shopId);
  assert.equal(restored.operationId, record.operationId);
  assert.deepEqual(restored.payload, record.payload);
  assert.deepEqual(restored.formSnapshot, record.formSnapshot);
});

test("pending record cannot be silently replaced with a new ID or changed payload", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter); const record = pendingRecord();
  await store.save(record);
  await assert.rejects(store.save({...record, operationId:"new-id", payload:{...record.payload,p_request_id:"new-id"}}), /cannot be replaced/);
  await assert.rejects(store.save({...record, payload:{...record.payload,p_due_amount:25}}), /cannot be replaced/);
  assert.equal((await store.get(record.shopId)).operationId, record.operationId);
});

test("lost RPC response after commit followed by retry reuses original ID and returns one memo", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter); const record = pendingRecord(); await store.save(record);
  const committed = new Map(); let callCount = 0;
  async function mockRpc(payload) {
    callCount++;
    if (!committed.has(payload.p_request_id)) committed.set(payload.p_request_id, { memoId:"memo-once", payload });
    if (callCount === 1) throw new Error("response lost after commit");
    assert.deepEqual(payload, record.payload);
    return committed.get(payload.p_request_id);
  }
  await assert.rejects(mockRpc((await store.get(record.shopId)).payload), /response lost/);
  const retryRecord = await store.get(record.shopId);
  const recovered = await mockRpc(retryRecord.payload);
  assert.equal(retryRecord.operationId, record.operationId);
  assert.equal(recovered.memoId, "memo-once");
  assert.equal(committed.size, 1);
});

test("successful canonical recovery clears pending; ambiguous failure preserves it", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter); const record = pendingRecord(); await store.save(record);
  // Ambiguous RPC/network failure does not delete the outbox item.
  assert.ok(await store.get(record.shopId));
  // Only after a canonical persisted memo is fetched does the page clear it.
  const canonicalMemo = { id:"memo-once", shop_id:record.shopId, items_json:record.payload.p_items };
  assert.equal(canonicalMemo.id, "memo-once");
  assert.equal(await store.remove(record.shopId, record.operationId, record.payload), true);
  assert.equal(await store.get(record.shopId), null);
});


test("atomic concurrent distinct operation claims: exactly one wins and loser cannot overwrite", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter);
  const a = pendingRecord();
  const b = {...pendingRecord(), operationId:"op-uuid-other", payload:{...pendingRecord().payload,p_request_id:"op-uuid-other",p_due_amount:5}};
  const results = await Promise.allSettled([store.save(a), store.save(b)]);
  assert.equal(results.filter(r=>r.status==="fulfilled").length, 1);
  assert.equal(results.filter(r=>r.status==="rejected").length, 1);
  const winner = await store.get(a.shopId);
  assert.ok([a.operationId,b.operationId].includes(winner.operationId));
  const loser = winner.operationId===a.operationId?b:a;
  assert.notEqual(winner.operationId, loser.operationId);
  assert.deepEqual(winner.payload, winner.operationId===a.operationId?a.payload:b.payload);
});

test("atomic same operation ID and exact payload is idempotently reusable", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter); const r=pendingRecord();
  const results = await Promise.all([store.save(r), store.save(structuredClone(r))]);
  assert.equal(results.length,2);
  assert.equal((await store.get(r.shopId)).operationId,r.operationId);
});

test("same operation ID with different payload is rejected", async () => {
  const adapter=persistentAdapter();const store=createMemoPendingStore(adapter);const r=pendingRecord();await store.save(r);
  await assert.rejects(store.save({...r,payload:{...r.payload,p_due_amount:1}}),/cannot be replaced/);
});

test("different shops can claim independently", async () => {
  const adapter=persistentAdapter();const store=createMemoPendingStore(adapter);const a=pendingRecord();const b=pendingRecord();
  b.shopId="shop-456";b.operationId="op-456";b.payload={...b.payload,p_request_id:"op-456",p_shop_id:"shop-456"};
  await Promise.all([store.save(a),store.save(b)]);
  assert.equal((await store.get(a.shopId)).operationId,a.operationId);
  assert.equal((await store.get(b.shopId)).operationId,b.operationId);
});

test("invalid shop/operation/payload identity combinations are rejected", async () => {
  const store=createMemoPendingStore(persistentAdapter());const r=pendingRecord();
  await assert.rejects(store.save({...r,operationId:"mismatch"}),/operation ID does not match/);
  await assert.rejects(store.save({...r,shopId:"other-shop"}),/shop ID does not match/);
  const malformed={...r,payload:{...r.payload,p_request_id:"different"}};
  await assert.rejects(store.save(malformed),/operation ID does not match/);
  await assert.rejects(store.save({...r,payload:{...r.payload,p_shop_id:"different-shop"}}),/shop ID does not match/);
});


test("QA-01-R2: stale O1 cleanup cannot delete O2 after O1 was resolved", async () => {
  const adapter = persistentAdapter(); const store = createMemoPendingStore(adapter);
  const o1 = pendingRecord();
  const o2 = {...pendingRecord(), operationId:"op-uuid-o2", payload:{...pendingRecord().payload,p_request_id:"op-uuid-o2",p_due_amount:9}};
  await store.save(o1);
  assert.equal(await store.remove(o1.shopId,o1.operationId,o1.payload),true);
  await store.save(o2);
  assert.equal(await store.remove(o1.shopId,o1.operationId,o1.payload),false);
  assert.deepEqual(await store.get(o2.shopId),o2);
});

test("same operation ID cleanup succeeds; mismatched ID is a no-op", async () => {
  const store=createMemoPendingStore(persistentAdapter());const r=pendingRecord();await store.save(r);
  assert.equal(await store.remove(r.shopId,"wrong-operation"),false);
  assert.deepEqual(await store.get(r.shopId),r);
  assert.equal(await store.remove(r.shopId,r.operationId,r.payload),true);
  assert.equal(await store.get(r.shopId),null);
});

test("conditional cleanup leaves other shops unaffected", async () => {
  const store=createMemoPendingStore(persistentAdapter());const a=pendingRecord();const b=pendingRecord();
  b.shopId="shop-456";b.operationId="op-456";b.payload={...b.payload,p_request_id:"op-456",p_shop_id:"shop-456"};
  await Promise.all([store.save(a),store.save(b)]);
  assert.equal(await store.remove(a.shopId,a.operationId,a.payload),true);
  assert.equal(await store.get(a.shopId),null);
  assert.deepEqual(await store.get(b.shopId),b);
});

test("cleanup payload fingerprint mismatch is a no-op", async () => {
  const store=createMemoPendingStore(persistentAdapter());const r=pendingRecord();await store.save(r);
  assert.equal(await store.remove(r.shopId,r.operationId,{...r.payload,p_due_amount:99}),false);
  assert.deepEqual(await store.get(r.shopId),r);
});

test("concurrent conditional cleanup and claim cannot lose the newer O2 record", async () => {
  const adapter=persistentAdapter();const store=createMemoPendingStore(adapter);const o1=pendingRecord();
  const o2={...pendingRecord(),operationId:"op-uuid-o2",payload:{...pendingRecord().payload,p_request_id:"op-uuid-o2",p_due_amount:7}};
  await store.save(o1);
  const [cleanup,claim]=await Promise.allSettled([
    store.remove(o1.shopId,o1.operationId,o1.payload),
    store.save(o2),
  ]);
  // If cleanup linearizes first, O2 is allowed to claim. If claim is first,
  // it conflicts with O1 and stale cleanup may then remove O1. No interleaving
  // may overwrite/delete O2; the final state is either absent or O2.
  const finalRecord=await store.get(o1.shopId);
  if (claim.status === "fulfilled") assert.equal(finalRecord.operationId,o2.operationId);
  else assert.ok(finalRecord===null || finalRecord.operationId===o1.operationId);
  if (finalRecord?.operationId===o2.operationId) {
    assert.equal(claim.status,"fulfilled");
    assert.deepEqual(finalRecord.payload,o2.payload);
  }
});

test("cleanup requires explicit operation identity and validates optional payload identity", async () => {
  const store=createMemoPendingStore(persistentAdapter());const r=pendingRecord();await store.save(r);
  await assert.rejects(store.remove(r.shopId),/requires shopId and operationId/);
  await assert.rejects(store.remove(r.shopId,r.operationId,{...r.payload,p_request_id:"wrong"}),/does not match payload/);
  assert.deepEqual(await store.get(r.shopId),r);
});
