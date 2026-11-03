# DokanTools P0 remediation — QA-01-R2 conditional pending cleanup (includes QA-01 / QA-01-R1)

## QA-01 change
Memo transaction requests now use a shop-scoped durable browser outbox in IndexedDB (`dokantools-memo-pending`, object store `pending_memos`). The memo page:

1. Builds the complete RPC payload and operation UUID before RPC submission.
2. Saves operation ID, exact RPC payload, form snapshot and timestamp to IndexedDB.
3. Waits for the IndexedDB read-write transaction to complete before sending the RPC.
4. On page reload, restores the pending record and form snapshot; while pending, edits/new memo creation are locked and the Retry action sends the exact saved payload and operation ID.
5. Preserves the outbox item on RPC error/exception or when the canonical memo cannot be fetched.
6. Clears the pending item only after RPC result memo ID is returned and the canonical memo row is retrieved. If clearing fails, the pending item remains and retry is idempotent.
7. Rejects attempts to overwrite an unresolved pending operation with a different ID or payload.
8. The pending store uses one IndexedDB `readwrite` transaction for `get(shopId)` followed by conditional `add(record)`. Same ID + exact payload is idempotent; a conflicting ID/payload aborts the transaction without replacing the winner. Claim resolution occurs only after transaction completion.
9. Pending record validation enforces `record.operationId === record.payload.p_request_id` and `record.shopId === record.payload.p_shop_id`.
10. A synchronous React `useRef` guard prevents same-tab re-entrant submit calls; it is only a submit guard, not the durable ID source.
11. Pending cleanup is compare-and-delete: `remove(shopId, operationId, payload)` reads and conditionally deletes inside one IndexedDB `readwrite` transaction. It deletes only if the stored shop and operation ID match, and if provided the exact canonical payload matches too. A stale O1 cleanup cannot delete O2 for the same shop; a mismatch is a no-op. The transaction resolves only after `complete`, and abort/error paths reject safely.
12. After canonical memo retrieval, the page passes the exact `pendingOperation.operationId` and saved payload to cleanup. If cleanup finds another operation, the page reloads that pending record into state instead of clearing the local pending UI.

If IndexedDB read fails, memo creation is blocked rather than assuming no pending transaction exists. If IndexedDB save fails, the RPC is not sent.

## Tests and verification
- `npm test`: PASS, 29/29 Node tests (includes 15 pending-store tests: atomic claim/retry and identity tests plus compare-and-delete stale-operation, payload mismatch, shop isolation, and cleanup/claim race simulations).
- `npm run typecheck`: PASS.
- `node node_modules/eslint/bin/eslint.js src --ext .ts,.tsx`: PASS.
- `node scripts/verify-sql.mjs`: PASS (static checks only).

The pending-store tests use a persistent in-memory adapter with deterministic serialized claim/delete transaction simulation to test concurrent contenders and stale cleanup, plus mock RPC commit/lost-response/retry behavior. These are **unit tests**, not real browser reload, IndexedDB, or multi-tab integration tests. The race tests verify the store contract in the test adapter; they do not execute IndexedDB's actual transaction scheduler. No browser automation was executed; browser persistence and cross-tab behavior remain unverified in an actual browser.

## Prior P0 patch included
This patch ZIP also retains the earlier payload-bound idempotency migration, canonical memo receipt retrieval, price-override audit, SQL static regression tests, schema, and supporting tests/scripts.

## Not performed / remaining risks
- No live Supabase access or database modification.
- No PostgreSQL migration execution, RPC, RLS, concurrency, or staging validation.
- No actual browser IndexedDB integration/reload test (e.g., Playwright/browser test).
- IndexedDB may be cleared by browser/site-data cleanup, private browsing behavior, quota failures, or user/device loss. Financial transactions should still be reconciled against server-side memo history before allowing a new sale after storage loss; this client outbox is not a substitute for server-side operation lookup.
- Customer creation occurs before the memo outbox save in the existing flow and is a separate operation; possible customer duplication on customer-insert response loss is outside this QA-01 memo-ID fix.
- Financial pilot remains NO-GO pending QA review and isolated staging validation.
