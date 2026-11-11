const DB_NAME = "dokantools-invoice-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("DRAFT_STORAGE_UNAVAILABLE"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("owner_shop", ["owner_id", "shop_id"], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("DRAFT_STORAGE_OPEN_FAILED"));
  });
}

export async function saveInvoiceDraft(draft) {
  if (!draft?.id || !draft?.owner_id || !draft?.shop_id) {
    throw new Error("DRAFT_IDENTITY_REQUIRED");
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...draft, updated_at: new Date().toISOString() });
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("DRAFT_SAVE_FAILED")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("DRAFT_SAVE_ABORTED")); };
  });
}

export async function listInvoiceDrafts(ownerId, shopId) {
  if (!ownerId || !shopId) throw new Error("DRAFT_IDENTITY_REQUIRED");
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).index("owner_shop").getAll([ownerId, shopId]);
    request.onsuccess = () => {
      const rows = (request.result || []).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      db.close();
      resolve(rows);
    };
    request.onerror = () => { db.close(); reject(request.error || new Error("DRAFT_READ_FAILED")); };
  });
}

export async function deleteInvoiceDraft(ownerId, shopId, draftId) {
  if (!ownerId || !shopId || !draftId) throw new Error("DRAFT_IDENTITY_REQUIRED");
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(draftId);
    getRequest.onsuccess = () => {
      const current = getRequest.result;
      if (current && current.owner_id === ownerId && current.shop_id === shopId) {
        store.delete(draftId);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("DRAFT_DELETE_FAILED")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("DRAFT_DELETE_ABORTED")); };
  });
}
