import test from "node:test";
import assert from "node:assert/strict";
import { createInvoiceDraftSessionGuard } from "../src/lib/invoice-draft-session.mjs";

const draftA = {
  id: "draft-a",
  owner_id: "owner-a",
  shop_id: "shop-a",
  lines: [{ item_name: "Rice" }],
};

test("User A logout invalidates access without deleting the persisted draft", () => {
  const guard = createInvoiceDraftSessionGuard();
  const request = guard.begin();
  const sessionA = guard.activate(request, "owner-a", "shop-a");
  assert.equal(guard.canAccess(draftA, "owner-a", "shop-a"), true);

  guard.invalidate();

  assert.equal(guard.isCurrent(sessionA), false);
  assert.equal(guard.canAccess(draftA, "owner-a", "shop-a"), false);
  // Logout is deliberately non-destructive pending PO approval.
  assert.equal(draftA.lines[0].item_name, "Rice");
});

test("User B login in the same browser cannot see User A drafts", () => {
  const guard = createInvoiceDraftSessionGuard();
  const requestA = guard.begin();
  guard.activate(requestA, "owner-a", "shop-a");
  guard.invalidate();

  const requestB = guard.begin();
  guard.activate(requestB, "owner-b", "shop-b");

  assert.equal(guard.canAccess(draftA, "owner-b", "shop-b"), false);
  assert.equal(guard.canAccess(draftA, "owner-a", "shop-a"), false);
});

test("owner and shop identity must both match", () => {
  const guard = createInvoiceDraftSessionGuard();
  const request = guard.begin();
  guard.activate(request, "owner-a", "shop-a");

  assert.equal(guard.canAccess(draftA, "owner-a", "shop-a"), true);
  assert.equal(guard.canAccess(draftA, "owner-b", "shop-a"), false);
  assert.equal(guard.canAccess(draftA, "owner-a", "shop-b"), false);
});

test("interrupted logout transition leaves storage intact but invalidates stale async work", () => {
  const guard = createInvoiceDraftSessionGuard();
  const request = guard.begin();
  const sessionA = guard.activate(request, "owner-a", "shop-a");

  // Simulate a pending asynchronous draft read when logout interrupts the page.
  guard.invalidate();

  assert.equal(guard.isCurrent(sessionA), false);
  assert.equal(guard.canAccess(draftA, "owner-a", "shop-a"), false);
  assert.equal(draftA.id, "draft-a");
});

test("a superseded account load cannot reactivate an older session", () => {
  const guard = createInvoiceDraftSessionGuard();
  const requestA = guard.begin();
  const requestB = guard.begin();

  assert.equal(guard.activate(requestA, "owner-a", "shop-a"), null);
  const sessionB = guard.activate(requestB, "owner-b", "shop-b");
  assert.equal(guard.isCurrent(sessionB), true);
});
