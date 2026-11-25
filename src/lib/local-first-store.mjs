import { shouldApplyBackupRecord, validateLocalBackup } from "./local-first-invoice.mjs";

const DB_NAME = "dokantools-local-first";
const DB_VERSION = 1;
const RECORD_STORES = ["invoices", "products", "customers"];

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("LOCAL_STORAGE_UNAVAILABLE"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("workspace")) db.createObjectStore("workspace", { keyPath: "id" });
      for (const name of RECORD_STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          store.createIndex("workspace_id", "workspace_id", { unique: false });
          store.createIndex("workspace_updated", ["workspace_id", "updated_at"], { unique: false });
        }
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error("LOCAL_DB_OPEN_FAILED"));
    request.onblocked = () => reject(new Error("LOCAL_DB_UPGRADE_BLOCKED"));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = tx.onabort = () => reject(tx.error || new Error("LOCAL_DB_TRANSACTION_FAILED"));
  });
}

export async function getOrCreateLocalWorkspace() {
  const db = await openDb();
  const tx = db.transaction("workspace", "readwrite");
  const store = tx.objectStore("workspace");
  const pointer = await new Promise((resolve, reject) => {
    const request = store.get("active");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("WORKSPACE_READ_FAILED"));
  });
  let workspace = null;
  if (pointer?.active_workspace_id) {
    workspace = await new Promise((resolve, reject) => {
      const request = store.get(pointer.active_workspace_id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("WORKSPACE_READ_FAILED"));
    });
  }
  if (!workspace) {
    const id = globalThis.crypto?.randomUUID?.();
    if (!id) { db.close(); throw new Error("SECURE_RANDOM_UNAVAILABLE"); }
    workspace = { id, name: "My shop", address: "", phone: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.put(workspace);
    store.put({ id: "active", active_workspace_id: id });
  }
  await transactionDone(tx);
  db.close();
  return workspace;
}

export async function saveLocalWorkspace(workspace) {
  if (!workspace?.id) throw new Error("WORKSPACE_ID_REQUIRED");
  const db = await openDb();
  const tx = db.transaction("workspace", "readwrite");
  const store = tx.objectStore("workspace");
  store.put({ ...workspace, updated_at: new Date().toISOString() });
  store.put({ id: "active", active_workspace_id: workspace.id });
  await transactionDone(tx);
  db.close();
  return true;
}

async function getRecord(storeName, id) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const result = await new Promise((resolve, reject) => {
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("LOCAL_RECORD_READ_FAILED"));
  });
  db.close();
  return result;
}

async function listRecords(storeName, workspaceId) {
  if (!workspaceId) throw new Error("WORKSPACE_ID_REQUIRED");
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const rows = await new Promise((resolve, reject) => {
    const request = tx.objectStore(storeName).index("workspace_id").getAll(workspaceId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("LOCAL_RECORD_LIST_FAILED"));
  });
  db.close();
  return rows.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
}

async function putRecord(storeName, record, workspaceId, invalidatePdf = false, requireExisting = false) {
  if (!record?.id || !workspaceId) throw new Error("LOCAL_RECORD_ID_REQUIRED");
  if (record.workspace_id && record.workspace_id !== workspaceId) throw new Error("WORKSPACE_MISMATCH");
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const old = await new Promise((resolve, reject) => {
    const request = store.get(record.id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("LOCAL_RECORD_READ_FAILED"));
  });
  if (old && old.workspace_id !== workspaceId) {
    tx.abort();
    db.close();
    throw new Error("WORKSPACE_MISMATCH");
  }
  if (requireExisting && !old) {
    tx.abort();
    db.close();
    throw new Error("LOCAL_RECORD_NOT_FOUND");
  }
  const now = new Date().toISOString();
  const next = {
    ...old,
    ...record,
    workspace_id: workspaceId,
    created_at: old?.created_at || record.created_at || now,
    updated_at: now,
    ...(storeName === "invoices" ? {
      revision: old ? Number(old.revision || 0) + 1 : Number(record.revision || 1),
      pdf_artifact: invalidatePdf ? null : record.pdf_artifact ?? old?.pdf_artifact ?? null,
    } : {}),
  };
  store.put(next);
  await transactionDone(tx);
  db.close();
  return next;
}

async function deleteRecord(storeName, id, workspaceId) {
  if (!id || !workspaceId) throw new Error("LOCAL_RECORD_ID_REQUIRED");
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  let mismatch = false;
  let found = false;
  const request = store.get(id);
  request.onsuccess = () => {
    const current = request.result;
    if (!current) return;
    found = true;
    if (current.workspace_id !== workspaceId) {
      mismatch = true;
      tx.abort();
      return;
    }
    store.delete(id);
  };
  request.onerror = () => tx.abort();
  try {
    await transactionDone(tx);
  } catch (error) {
    db.close();
    if (mismatch) throw new Error("WORKSPACE_MISMATCH");
    throw error;
  }
  db.close();
  return found;
}

export const localFirstStore = {
  getInvoice: id => getRecord("invoices", id),
  listInvoices: workspaceId => listRecords("invoices", workspaceId),
  saveInvoice: (invoice, workspaceId) => putRecord("invoices", invoice, workspaceId, true),
  deleteInvoice: (id, workspaceId) => deleteRecord("invoices", id, workspaceId),
  listProducts: workspaceId => listRecords("products", workspaceId),
  saveProduct: (product, workspaceId) => putRecord("products", product, workspaceId),
  updateProduct: (product, workspaceId) => putRecord("products", product, workspaceId, false, true),
  deleteProduct: (id, workspaceId) => deleteRecord("products", id, workspaceId),
  listCustomers: workspaceId => listRecords("customers", workspaceId),
  saveCustomer: (customer, workspaceId) => putRecord("customers", customer, workspaceId),
  updateCustomer: (customer, workspaceId) => putRecord("customers", customer, workspaceId, false, true),
  deleteCustomer: (id, workspaceId) => deleteRecord("customers", id, workspaceId),
  async exportBackup(workspace) {
    if (!workspace?.id) throw new Error("WORKSPACE_ID_REQUIRED");
    const [invoices, products, customers] = await Promise.all([
      listRecords("invoices", workspace.id), listRecords("products", workspace.id), listRecords("customers", workspace.id),
    ]);
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace: { ...workspace },
      data: { invoices, products, customers },
    };
  },
  async restoreBackup(backup, activeWorkspace, mode = "merge") {
    validateLocalBackup(backup);
    if (!activeWorkspace?.id || !["merge", "replace"].includes(mode)) throw new Error("RESTORE_OPTIONS_INVALID");
    const db = await openDb();
    const tx = db.transaction([...RECORD_STORES, "workspace"], "readwrite");
    const putImportedWorkspace = () => {
      const workspaceStore = tx.objectStore("workspace");
      if (mode === "replace") {
        workspaceStore.put({ ...backup.workspace, id: activeWorkspace.id });
      } else {
        const request = workspaceStore.get(activeWorkspace.id);
        request.onsuccess = () => {
          if (shouldApplyBackupRecord(request.result || null, backup.workspace)) {
            workspaceStore.put({ ...backup.workspace, id: activeWorkspace.id });
          }
        };
      }
    };
    const putImportedRecords = () => {
      for (const name of RECORD_STORES) {
        for (const record of backup.data[name]) {
          tx.objectStore(name).put({
            ...record,
            workspace_id: activeWorkspace.id,
            updated_at: record.updated_at || new Date().toISOString(),
          });
        }
      }
    };
    if (mode === "merge") {
      putImportedWorkspace();
      for (const name of RECORD_STORES) {
        const store = tx.objectStore(name);
        for (const record of backup.data[name]) {
          const request = store.get(record.id);
          request.onsuccess = () => {
            if (shouldApplyBackupRecord(request.result || null, record)) {
              store.put({ ...record, workspace_id: activeWorkspace.id, updated_at: record.updated_at || new Date().toISOString() });
            }
          };
          request.onerror = () => tx.abort();
        }
      }
    } else {
      let remaining = RECORD_STORES.length;
      for (const name of RECORD_STORES) {
        const request = tx.objectStore(name).index("workspace_id").openCursor(activeWorkspace.id);
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            remaining -= 1;
            if (remaining === 0) {
              putImportedWorkspace();
              putImportedRecords();
            }
          }
        };
        request.onerror = () => tx.abort();
      }
    }
    await transactionDone(tx);
    db.close();
    return true;
  },
};
