import test from "node:test";
import assert from "node:assert/strict";
import { syncPendingMemoLoad } from "../src/lib/memo-pending-ui.mjs";

function record(operationId, shopId = "shop-123") {
  return {
    shopId, operationId,
    payload: { p_request_id: operationId, p_shop_id: shopId, p_customer_id: null, p_items: [], p_due_amount: 0 },
    formSnapshot: { customerId: "customer-1", customerName: operationId, customerPhone: "01000000000", items: [{ product_id: "", name: operationId, qty: "1", unit: "pc", price: "5" }], due: "0" },
    createdAt: "2026-11-03T00:00:00.000Z",
  };
}

test("QA-01-R3: stale O1 React pending state synchronizes to null after successful empty store read", () => {
  let pendingState = record("O1");
  const restored = [];
  syncPendingMemoLoad(null, { setPending: value => { pendingState = value; }, restoreForm: snapshot => restored.push(snapshot) });
  assert.equal(pendingState, null);
  assert.deepEqual(restored, []);
});

test("QA-01-R3: successful store read containing O2 replaces stale React O1 state", () => {
  let pendingState = record("O1");
  const restored = [];
  const o2 = record("O2");
  syncPendingMemoLoad(o2, { setPending: value => { pendingState = value; }, restoreForm: snapshot => restored.push(snapshot) });
  assert.equal(pendingState.operationId, "O2");
  assert.deepEqual(restored, [o2.formSnapshot]);
});

test("QA-01-R3: empty store result does not restore or overwrite form fields", () => {
  let form = { customerName: "typed-but-not-pending", due: "17" };
  syncPendingMemoLoad(undefined, {
    setPending: () => {},
    restoreForm: snapshot => { form = { customerName: snapshot.customerName, due: snapshot.due }; },
  });
  assert.deepEqual(form, { customerName: "typed-but-not-pending", due: "17" });
});

test("QA-01-R3: non-empty unresolved operation restores its saved form snapshot", () => {
  const o2 = record("O2");
  let restored = null;
  syncPendingMemoLoad(o2, { setPending: () => {}, restoreForm: snapshot => { restored = snapshot; } });
  assert.deepEqual(restored, o2.formSnapshot);
});
