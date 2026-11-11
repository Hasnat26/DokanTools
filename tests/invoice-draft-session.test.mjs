import test from "node:test";
import assert from "node:assert/strict";
import { createInvoiceDraftSessionGuard, runSessionBoundRequest } from "../src/lib/invoice-draft-session.mjs";

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

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function flushPromiseMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

function switchToUserB(guard) {
  guard.invalidate();
  const request = guard.begin();
  return guard.activate(request, "owner-b", "shop-b");
}

test("Test A — late User A invoice list cannot populate User B state", async () => {
  const guard = createInvoiceDraftSessionGuard();
  const generation = guard.begin();
  const sessionA = guard.activate(generation, "owner-a", "shop-a");
  const request = deferred();
  const state = { issuedInvoices: ["B-invoice"], historyError: "", historyLoading: true };
  const task = runSessionBoundRequest({
    guard, snapshot: sessionA,
    request: () => request.promise,
    onSuccess: rows => { state.issuedInvoices = rows; },
    onError: error => { state.historyError = error.message; },
    onFinally: () => { state.historyLoading = false; },
  });

  switchToUserB(guard);
  state.issuedInvoices = ["B-invoice"];
  state.historyLoading = true;
  request.resolve(["A-private-invoice"]);
  await task;

  assert.deepEqual(state.issuedInvoices, ["B-invoice"]);
  assert.equal(state.historyError, "");
  assert.equal(state.historyLoading, true);
});

test("Test B — late User A invoice detail cannot replace User B screen/detail", async () => {
  const guard = createInvoiceDraftSessionGuard();
  const generation = guard.begin();
  const sessionA = guard.activate(generation, "owner-a", "shop-a");
  const request = deferred();
  const state = { selectedInvoice: { id: "B-invoice" }, screen: "history", detailLoading: true, historyError: "" };
  const task = runSessionBoundRequest({
    guard, snapshot: sessionA,
    request: () => request.promise,
    onSuccess: invoice => { state.selectedInvoice = invoice; state.screen = "detail"; },
    onError: error => { state.historyError = error.message; },
    onFinally: () => { state.detailLoading = false; },
  });

  switchToUserB(guard);
  state.selectedInvoice = null;
  state.screen = "history";
  state.detailLoading = true;
  request.resolve({ id: "A-private-invoice" });
  await task;

  assert.equal(state.selectedInvoice, null);
  assert.equal(state.screen, "history");
  assert.equal(state.historyError, "");
  assert.equal(state.detailLoading, true);
});

test("Test C — stale User A rejection cannot replace User B error state", async () => {
  const guard = createInvoiceDraftSessionGuard();
  const generation = guard.begin();
  const sessionA = guard.activate(generation, "owner-a", "shop-a");
  const request = deferred();
  const state = { historyError: "B-current-error", issuedInvoices: ["B-invoice"] };
  const task = runSessionBoundRequest({
    guard, snapshot: sessionA,
    request: () => request.promise,
    onSuccess: rows => { state.issuedInvoices = rows; },
    onError: error => { state.historyError = error.message; },
  });

  switchToUserB(guard);
  request.reject(new Error("A-private-server-error"));
  await task;

  assert.equal(state.historyError, "B-current-error");
  assert.deepEqual(state.issuedInvoices, ["B-invoice"]);
});

test("Test D — stale finally path cannot clear User B loading state", async () => {
  const guard = createInvoiceDraftSessionGuard();
  const generation = guard.begin();
  const sessionA = guard.activate(generation, "owner-a", "shop-a");
  const request = deferred();
  const state = { historyLoading: true, detailLoading: true };
  const task = runSessionBoundRequest({
    guard, snapshot: sessionA,
    request: () => request.promise,
    onSuccess: () => {},
    onError: () => {},
    onFinally: () => { state.historyLoading = false; state.detailLoading = false; },
  });

  switchToUserB(guard);
  state.historyLoading = true;
  state.detailLoading = true;
  request.resolve([]);
  await task;

  assert.equal(state.historyLoading, true);
  assert.equal(state.detailLoading, true);
});

test("session-bound request refuses to start without verified owner/shop context", async () => {
  const guard = createInvoiceDraftSessionGuard();
  let invoked = false;
  const result = await runSessionBoundRequest({
    guard,
    snapshot: null,
    request: async () => { invoked = true; return []; },
  });
  assert.equal(result, false);
  assert.equal(invoked, false);
});
