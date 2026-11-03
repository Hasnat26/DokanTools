const DB_NAME = "dokantools-memo-pending";
const DB_VERSION = 1;
const STORE_NAME = "pending_memos";

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function validateRecord(record) {
  if (!record?.shopId || !record?.operationId || !record?.payload || typeof record.payload !== "object") {
    throw new Error("Invalid pending memo record");
  }
  if (record.operationId !== record.payload.p_request_id) {
    throw new Error("Pending memo operation ID does not match payload.p_request_id");
  }
  if (String(record.shopId) !== String(record.payload.p_shop_id)) {
    throw new Error("Pending memo shop ID does not match payload.p_shop_id");
  }
  if (stableJson(record.payload) === undefined) {
    throw new Error("Pending memo payload is not serializable");
  }
}

export function createMemoPendingStore(adapter) {
  return {
    async save(record) {
      validateRecord(record);
      const normalized = { ...record, shopId: String(record.shopId) };
      if (typeof adapter.claim !== "function") {
        throw new Error("Memo pending adapter must implement atomic claim()");
      }
      await adapter.claim(normalized);
    },
    async get(shopId) {
      if (!shopId) return null;
      const record = (await adapter.get(String(shopId))) ?? null;
      if (record) validateRecord(record);
      return record;
    },
    async remove(shopId, operationId, payload) {
      if (!shopId || !operationId) throw new Error("Memo pending cleanup requires shopId and operationId");
      if (payload !== undefined && (typeof payload !== "object" || payload === null)) {
        throw new Error("Memo pending cleanup payload must be an object when supplied");
      }
      if (payload !== undefined && payload.p_request_id !== operationId) {
        throw new Error("Memo pending cleanup operation ID does not match payload.p_request_id");
      }
      if (payload !== undefined && String(payload.p_shop_id) !== String(shopId)) {
        throw new Error("Memo pending cleanup shop ID does not match payload.p_shop_id");
      }
      return await adapter.deleteIfMatches(String(shopId), String(operationId), payload);
    },
  };
}

function openDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this browser"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "shopId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open memo outbox"));
    request.onblocked = () => reject(new Error("Memo outbox database upgrade is blocked"));
  });
}

function idbRequest(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = operation(store);
    let result;
    let requestFailed = false;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => {
      requestFailed = true;
      reject(request.error ?? new Error("Memo outbox operation failed"));
    };
    tx.oncomplete = () => { if (!requestFailed) resolve(result); };
    tx.onabort = () => reject(tx.error ?? new Error("Memo outbox transaction aborted"));
    tx.onerror = () => reject(tx.error ?? new Error("Memo outbox transaction failed"));
  });
}

/**
 * Atomic compare-and-claim: the read and conditional add occur inside one
 * IndexedDB readwrite transaction. A conflict aborts without overwriting.
 */
function idbClaim(db, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const read = store.get(record.shopId);
    let result;
    let claimError = null;

    read.onerror = () => {
      claimError = read.error ?? new Error("Memo claim read failed");
      try { tx.abort(); } catch {}
    };
    read.onsuccess = () => {
      const existing = read.result;
      if (existing) {
        if (existing.operationId === record.operationId && stableJson(existing.payload) === stableJson(record.payload)) {
          result = existing; // Same logical claim: idempotent reuse, never replace its snapshot.
          return;
        }
        claimError = new Error("An unresolved memo already exists for this shop; its operation ID and payload cannot be replaced");
        try { tx.abort(); } catch {}
        return;
      }
      const add = store.add(record);
      add.onerror = () => {
        claimError = add.error ?? new Error("Memo pending claim insert failed");
        try { tx.abort(); } catch {}
      };
      add.onsuccess = () => { result = record; };
    };

    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(claimError ?? tx.error ?? new Error("Memo pending claim transaction aborted"));
    tx.onerror = () => {
      if (claimError) reject(claimError);
      else reject(tx.error ?? new Error("Memo pending claim transaction failed"));
    };
  });
}

/**
 * Atomic compare-and-delete: inspect and conditionally delete within the same
 * readwrite transaction. A stale cleanup is a no-op and never touches a newer
 * operation occupying the shop's outbox key.
 */
function idbDeleteIfMatches(db, shopId, operationId, payload) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const read = store.get(shopId);
    let deleted = false;
    let cleanupError = null;

    read.onerror = () => {
      cleanupError = read.error ?? new Error("Memo pending cleanup read failed");
      try { tx.abort(); } catch {}
    };
    read.onsuccess = () => {
      const existing = read.result;
      if (!existing || existing.operationId !== operationId) return;
      if (payload !== undefined && stableJson(existing.payload) !== stableJson(payload)) return;
      const deletion = store.delete(shopId);
      deletion.onerror = () => {
        cleanupError = deletion.error ?? new Error("Memo pending cleanup delete failed");
        try { tx.abort(); } catch {}
      };
      deletion.onsuccess = () => { deleted = true; };
    };

    tx.oncomplete = () => resolve(deleted);
    tx.onabort = () => reject(cleanupError ?? tx.error ?? new Error("Memo pending cleanup transaction aborted"));
    tx.onerror = () => reject(cleanupError ?? tx.error ?? new Error("Memo pending cleanup transaction failed"));
  });
}

const browserAdapter = {
  async claim(record) {
    const db = await openDb();
    try { await idbClaim(db, record); }
    finally { db.close(); }
  },
  async get(shopId) {
    const db = await openDb();
    try { return await idbRequest(db, "readonly", (store) => store.get(shopId)); }
    finally { db.close(); }
  },
  async deleteIfMatches(shopId, operationId, payload) {
    const db = await openDb();
    try { return await idbDeleteIfMatches(db, shopId, operationId, payload); }
    finally { db.close(); }
  },
};

export const memoPendingStore = createMemoPendingStore(browserAdapter);
