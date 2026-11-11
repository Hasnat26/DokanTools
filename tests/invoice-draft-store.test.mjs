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
