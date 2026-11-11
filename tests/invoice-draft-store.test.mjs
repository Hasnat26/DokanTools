import test from "node:test";
import assert from "node:assert/strict";
import { saveInvoiceDraft, listInvoiceDrafts, deleteInvoiceDraft } from "../src/lib/invoice-draft-store.mjs";

test("draft storage fails closed when IndexedDB is unavailable", async () => {
  await assert.rejects(
    saveInvoiceDraft({ id: "draft-1", owner_id: "owner-1", shop_id: "shop-1" }),
    /DRAFT_STORAGE_UNAVAILABLE/
  );
  await assert.rejects(listInvoiceDrafts("owner-1", "shop-1"), /DRAFT_STORAGE_UNAVAILABLE/);
  await assert.rejects(deleteInvoiceDraft("owner-1", "shop-1", "draft-1"), /DRAFT_STORAGE_UNAVAILABLE/);
});

test("IndexedDB owner/shop index isolates account drafts without deleting prior-owner records", async () => {
  const records = new Map();
  let storeCreated = false;
  const requestFor = (run) => {
    const request = { result: undefined, error: null };
    queueMicrotask(() => {
      try {
        request.result = run();
        request.onsuccess?.({ target: request });
      } catch (error) {
        request.error = error;
        request.onerror?.({ target: request });
      }
    });
    return request;
  };
  const store = {
    createIndex() {},
    put(value) { records.set(value.id, structuredClone(value)); return {}; },
    get(id) { return requestFor(() => records.get(id)); },
    delete(id) { records.delete(id); return {}; },
    index(name) {
      assert.equal(name, "owner_shop");
      return {
        getAll([ownerId, shopId]) {
          return requestFor(() => [...records.values()]
            .filter(row => row.owner_id === ownerId && row.shop_id === shopId)
            .map(row => structuredClone(row)));
        },
      };
    },
  };
  const fakeIndexedDB = {
    open() {
      const request = { result: undefined, error: null };
      queueMicrotask(() => {
        const db = {
          objectStoreNames: { contains: () => storeCreated },
          createObjectStore() { storeCreated = true; return store; },
          transaction() {
            const tx = { objectStore: () => store };
            setTimeout(() => tx.oncomplete?.(), 0);
            return tx;
          },
          close() {},
        };
        request.result = db;
        if (!storeCreated) request.onupgradeneeded?.({ target: request });
        request.onsuccess?.({ target: request });
      });
      return request;
    },
  };

  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: fakeIndexedDB });
  try {
    await saveInvoiceDraft({
      id: "draft-a", owner_id: "owner-a", shop_id: "shop-a",
      created_at: "2026-11-11T00:00:00.000Z", lines: [],
    });
    await saveInvoiceDraft({
      id: "draft-b", owner_id: "owner-b", shop_id: "shop-b",
      created_at: "2026-11-11T00:00:00.000Z", lines: [],
    });

    assert.deepEqual((await listInvoiceDrafts("owner-a", "shop-a")).map(row => row.id), ["draft-a"]);
    assert.deepEqual((await listInvoiceDrafts("owner-b", "shop-b")).map(row => row.id), ["draft-b"]);
    assert.deepEqual(await listInvoiceDrafts("owner-b", "shop-a"), []);
    assert.equal(records.has("draft-a"), true);
    assert.equal(records.has("draft-b"), true);
  } finally {
    delete globalThis.indexedDB;
  }
});
