# DokanTools — M0-01 Remediation Design R2.1 Clarification

**Status:** Focused design clarification only; implementation approval NOT GRANTED  
**Financial pilot:** NO-GO  
**Repository:** `Hasnat26/DokanTools`  
**Parent design:** R2 in PR #2; preserved unchanged  
**R2.1 branch base:** R2 branch head `2e97683d66700726826d89c18d0fc6f01d533f80`  
**Scope:** Clarify five CH-1 requested topics and affected acceptance tests. This is an amendment, not a rewrite or replacement of R2.

> Design-only. SQL below is illustrative and must be adapted after inspection of actual column types/names and constraint inventory. No SQL was executed.

## 1. Manual reference and exception policy (R2 §2.3, §7, §12, §14)

### 1.1 Policy decision proposed for CH-1

A manual due should normally have a reference, but a reference is **not mandatory for every genuine small-retail credit**. A shop may record an informal credit (e.g., a known customer buys on baki without a paper invoice). For such entries:

- **Default path:** reference required. Examples: receipt/invoice/challan number, shop-issued serial, or another stable business reference.
- **No-reference exception:** allowed only when a shop owner/manager role approves it. If no manager role/credential exists in the approved MVP, require a distinct second authenticated actor. The creator cannot approve their own exception.
- **No second actor/manager available:** transaction is rejected/deferred; do not silently downgrade approval to a checkbox by the same user. CH-1 may explicitly choose a stricter policy.
- No-reference is not a way to classify a memo-generated receivable as manual. The operator must still affirm independent origin and complete memo-source search.

### 1.2 Required persisted fields

For every manual due, persist the following business fields (in the ledger row where suitable, otherwise in an immutable linked audit record):

- `manual_reference_raw` (nullable only for approved exception);
- `manual_reference_normalized` (nullable only for approved exception);
- `manual_reference_kind` (e.g. paper_invoice, receipt, challan, shop_serial, none_exception);
- `reference_exception` boolean;
- `reference_exception_reason_code` and free-text reason (required for exception; bounded length);
- `created_by_user_id`, `created_at`;
- `approved_by_user_id`, `approved_at`, `approval_method` (manager-role or second-actor);
- `request_id`, `shop_id`, `customer_id`, `direction`, `origin`, amount;
- `independent_manual_due_confirmed` and timestamp;
- audit event ID and canonical ledger entry ID.

Approval fields are mandatory iff reference exception is true. The approver must be authenticated, authorized for that shop and different from creator. Audit is append-only; no update to exception evidence after posting. Never store a PIN itself—only approval actor/method and timestamp.

### 1.3 Reference normalization and uniqueness

Normalization must be server-side and versioned/documented. Minimum proposal:

1. Unicode normalize (NFKC);
2. trim leading/trailing whitespace;
3. collapse internal whitespace;
4. case-fold for case-insensitive identifiers;
5. remove only separators explicitly declared insignificant for that reference kind. Do not strip punctuation universally because it may change invoice identity.

Uniqueness for nonempty manual due references:

`UNIQUE (shop_id, customer_id, manual_reference_kind, manual_reference_normalized)`

Apply only to `origin='manual' AND direction='due' AND manual_reference_normalized IS NOT NULL`. If a reference is intended to be shop-global (e.g. a unique invoice book serial), CH-1 may require shop-wide uniqueness; customer-scoped uniqueness is the proposed default because some vendors/customers reuse numbering.

Approved no-reference exception entries have no normalized reference and are not protected by this uniqueness key. They must not be assigned fabricated references such as timestamp-only strings.

### 1.4 Known memo reference prevention

Before accepting manual due:

- Search the customer’s memo list and require the operator to confirm independent credit.
- Server-side RPC must compare the supplied raw/normalized identifier against authoritative memo identifiers/aliases available in the database: full memo UUID, persisted memo number, and explicitly registered reference aliases.
- If exact match to a memo identity exists for the same shop/customer, reject manual classification and route to the memo-linked transaction or report duplicate source.
- Do not use fuzzy amount/date/customer matching as an automatic blocker. Do not use truncated UUID prefixes as identity.
- Never allow a client-supplied `source_memo_id` on a manual row.

**Residual risk (explicit):** a user can still misclassify a memo due as manual by omitting/altering the reference, using a different paper reference, or claiming no-reference exception. Amount/customer/date similarity cannot reliably distinguish genuine repeated credit from duplicate debt. Manager/second-actor approval, memo search, UX warning and audit reduce risk but do not eliminate fraud or human error. No perfect semantic duplicate detector is claimed.

## 2. PostgreSQL constraints and cross-table validation (R2 §3)

The schema must keep existing `baki_entries.type` as **direction** (`due`/`paid`) and add `origin`. Names below are illustrative. Verify actual names/types and existing equivalent constraints first.

### 2.1 Illustrative ledger CHECK constraints

```sql
-- Illustrative only; adapt table/column names and legacy rollout.
ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_direction_origin_ck
  CHECK (
    (type = 'due' AND origin IN ('memo', 'manual', 'legacy_unclassified'))
    OR
    (type = 'paid' AND origin IN ('manual', 'legacy_unclassified'))
  );

ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_origin_source_ck
  CHECK (
    (origin = 'memo'
      AND type = 'due'
      AND source_memo_id IS NOT NULL
      AND customer_id IS NOT NULL)
    OR
    (origin = 'manual'
      AND source_memo_id IS NULL
      AND customer_id IS NOT NULL)
    OR
    (origin = 'legacy_unclassified'
      AND source_memo_id IS NULL
      AND customer_id IS NOT NULL)
  );

ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_amount_positive_ck
  CHECK (amount > 0);
```

This permits only:
- memo + due + nonnull memo source + nonnull customer;
- manual + due/paid + NULL memo source + nonnull customer;
- legacy_unclassified + due/paid + NULL memo source + nonnull customer.

It prohibits paid/memo, manual with memo source, memo without source, and customerless ledger rows. New-write RPCs must reject `legacy_unclassified`; it exists only for historical migration/reporting. DB enforcement of “no new legacy rows” should be via RPC privilege boundary and, if CH-1 requires DB-level enforcement, a migration-controlled trigger/guard that permits only approved migration context—not a client-settable flag.

### 2.2 Manual reference and exception CHECK

Illustrative fields: `manual_reference_normalized`, `reference_exception`, `reference_exception_reason`, `created_by_user_id`, `approved_by_user_id`, `approved_at`.

```sql
ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_manual_reference_policy_ck
  CHECK (
    origin <> 'manual'
    OR type <> 'due'
    OR (
      (manual_reference_normalized IS NOT NULL
        AND reference_exception = false
        AND approved_by_user_id IS NULL
        AND approved_at IS NULL)
      OR
      (manual_reference_normalized IS NULL
        AND reference_exception = true
        AND reference_exception_reason IS NOT NULL
        AND created_by_user_id IS NOT NULL
        AND approved_by_user_id IS NOT NULL
        AND approved_at IS NOT NULL
        AND approved_by_user_id <> created_by_user_id)
    )
  );

CREATE UNIQUE INDEX baki_manual_due_reference_uq
  ON public.baki_entries
    (shop_id, customer_id, manual_reference_kind,
     manual_reference_normalized)
  WHERE origin = 'manual'
    AND type = 'due'
    AND manual_reference_normalized IS NOT NULL;
```

CHECK constraints cannot verify manager authorization or shop membership of approver. RPC must validate creator and approver against authenticated identities and shop roles. A trigger may enforce immutable audit fields, but must not replace RPC authorization. Ensure NULL semantics do not accidentally satisfy a required condition; add explicit `IS NOT NULL` checks as shown.

### 2.3 Composite foreign keys and source uniqueness

Illustrative parent keys and ledger FKs:

```sql
-- Parent candidate keys (add only if equivalent unique keys do not exist).
ALTER TABLE public.customers
  ADD CONSTRAINT customers_shop_id_id_uq UNIQUE (shop_id, id);

ALTER TABLE public.memos
  ADD CONSTRAINT memos_id_shop_customer_uq
  UNIQUE (id, shop_id, customer_id);

ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_shop_customer_fk
  FOREIGN KEY (shop_id, customer_id)
  REFERENCES public.customers (shop_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.baki_entries
  ADD CONSTRAINT baki_memo_shop_customer_fk
  FOREIGN KEY (source_memo_id, shop_id, customer_id)
  REFERENCES public.memos (id, shop_id, customer_id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX baki_one_due_per_memo_uq
  ON public.baki_entries (source_memo_id)
  WHERE origin = 'memo' AND type = 'due';
```

The memo FK target must use the exact same customer ID as the memo. The source memo is not nullable for memo-origin due (CHECK above); manual/legacy rows must have source NULL. Use RESTRICT/NO ACTION; financial history must not cascade-delete.

**Nullable memo customer:** PostgreSQL composite FK default MATCH SIMPLE skips FK validation when any referencing component is NULL. Therefore it does not enforce a customer relationship for a customerless memo. Add a memo-table check equivalent to:

```sql
ALTER TABLE public.memos
  ADD CONSTRAINT memo_positive_due_requires_customer_ck
  CHECK (COALESCE(due_amount, 0) <= 0 OR customer_id IS NOT NULL);
```

The memo RPC must also validate `due_amount > 0 => customer_id IS NOT NULL` before insert. Verify currency/rounding semantics and whether due_amount is stored as numeric; adapt comparison if appropriate. Zero-due memo with NULL customer remains allowed.

FKs/checks cannot enforce that a memo is posted/eligible or that its due amount equals the ledger row amount. Memo RPC must validate those conditions and create memo + stock + due atomically. Any cross-table trigger proposed later requires separate design and runtime testing; do not assume a CHECK can query another table.

## 3. Payment lock protocol and aggregate balance invariant (R2 §5, §6)

### 3.1 Balance-affecting paths

The following write paths affect customer aggregate balance and must be treated as one serialization domain:

| Write path | Balance effect | Required lock order | Balance calculation |
|---|---|---|---|
| `create_memo_transaction` with due > 0 | Increase | Shop row → customer row | Under locks, before due insert; memo RPC may not create a due if customer null |
| Manual due RPC | Increase | Shop row → customer row | Under locks; validate source/reference/approval before insert |
| Customer payment RPC | Decrease | Shop row → customer row | Under locks, after acquiring both; reject if amount > current aggregate |
| Future adjustment/reversal RPC (not M0-01) | Potential increase/decrease | Same order | Must re-read under locks; not authorized by this design |
| Any alternate financial RPC/import/admin write | Depends | Must use same protocol | Must not bypass invariant; otherwise disable/reject |
| Direct client INSERT/UPDATE/DELETE to ledger | Any | Prohibited | No balance write permitted |

Customer creation and catalog-only operations do not affect balance. Memo creation with zero due must not insert a ledger due. A due-bearing memo and payment may race; both must lock shop then customer so one serial order determines balance.

### 3.2 Locking, timing and transaction semantics

- Verify authentication and shop ownership first; then acquire the shop row lock, then customer row lock. Verify customer/shop relation after locking.
- Compute `SUM(due) - SUM(paid)` from committed ledger rows **after both locks are acquired**, inside the same transaction and before deciding whether to accept a payment.
- Memo/manual due inserts must also take these locks so payment cannot read a stale balance while a new due is being posted.
- Insert ledger row, audit event and idempotency completion within the same transaction.
- Commit makes all effects visible. Any validation, constraint, audit, or request-completion failure rolls back ledger, audit and request claim/effects together. Do not catch a DB error and commit partial financial work.
- Idempotency claim must be concurrency-safe. Same operation ID + same canonical payload returns the canonical committed entity after resolving the lock/unique conflict. Same ID + different payload or operation type rejects without financial changes.
- If response is lost after commit, client retries same request ID and payload; it must not create a second entry. If state is ambiguous/processing, do not mint a new ID; use the approved recovery path.
- All locks use consistent ordering to avoid deadlocks. Any future multi-customer transaction must lock customer rows in deterministic sorted UUID order after shop lock.

**Shop-level lock sufficiency:** it is sufficient as a conservative pilot serialization mechanism only if every balance-affecting writer in the same shop acquires that same shop lock before balance read/write, including memo due, manual due, payments and future adjustment/import paths. Customer row lock is additional consistency protection. It will serialize different customers in the same shop and may reduce throughput. If any path bypasses the shop lock (including direct SQL/service role), the invariant is not guaranteed. Do not claim shop locking alone is universally sufficient absent ACL and runtime verification.

### 3.3 Exact concurrent runtime assertion

Given starting balance = 100. Two independent sessions concurrently submit payment amount 70 to the same shop/customer using distinct request IDs:

- exactly one RPC commits and creates one `paid` ledger row for 70;
- the other RPC returns a controlled insufficient-balance rejection after lock acquisition and sees balance 30;
- committed aggregate balance is exactly 30;
- total accepted payment is exactly 70;
- no negative balance, duplicate ledger row, duplicate financial audit event, or completed request for rejected payment;
- rejected transaction leaves no payment ledger/audit/request-completion side effect (a separate nonfinancial security/diagnostic log is allowed if designed);
- both sessions' final reads agree with the ledger aggregate.

Also test due/payment race: starting balance 0; one memo/manual due 100 and one payment 100 race. Allowed serial outcomes are (a) due commits first, then payment commits, final balance 0; or (b) payment locks first and rejects at balance 0, then due commits, final balance 100. Never accept payment before the due becomes committed/visible; never final balance <0. Record session IDs, lock timing, RPC results, ledger rows and audit rows.

## 4. Legacy UI/reporting semantics (R2 §4, §6, §12)

- `legacy_unclassified` entries remain visible in customer ledger with a clear label, e.g. **“Historical entry — origin unknown”** and a distinct badge. Show direction (historical due/paid), amount, original date/note, and “not linked to a memo” status. Do not label them “manual” or “memo”.
- They **do contribute to aggregate customer balance** according to their preserved direction and amount. Excluding them would silently alter customer balance/history.
- Newly created manual due/payment must be visually distinct: **“Manual entry”**, with creator/reference/exception badge where authorized. Legacy entries cannot be edited/reclassified by ordinary operators.
- Ambiguous migration report must include entry ID, shop/customer IDs, direction, amount, timestamp, source note/available identity fields, ambiguity reason and suggested operator-review queue. Avoid unnecessary personal data in exported evidence.
- Migration/reporting must not change amount, direction, IDs, dates, note, or customer/shop linkage. No auto-merge, auto-delete, auto-link or balance adjustment. Reclassification requires a separate approved, append-only correction workflow; that workflow is out of M0-01.

## 5. Durable catalog/stock recovery (R2 §9)

### 5.1 Persisted identity and state

Operation state must survive reload and device/browser restart. It must not exist only in React state, local component state, or a temporary toast.

Persist a durable operation record in PostgreSQL, preferably `transaction_requests` or a dedicated `catalog_stock_operations` table, scoped by shop and operation ID. If reusing `transaction_requests`, ensure catalog and stock operation types are distinct and payloads/status semantics are sufficient. Proposed fields:

- `shop_id`, `catalog_operation_id`, `stock_operation_id` (stock request ID);
- canonical payload hash and operation type;
- catalog entity ID and stock entity ID (nullable until confirmed);
- state/status, created/updated timestamps, last error code (sanitized);
- actor ID and durable audit/event reference.

Catalog operation ID is stable for catalog create/update. Stock operation ID is a separate stable UUID for the inventory/opening-stock operation. The stock RPC's idempotency operation ID must equal the persisted stock operation ID for every retry.

### 5.2 State transitions

```text
catalog_started
  -> catalog_saved
  -> catalog_only                  (explicit user chose no stock)
  -> stock_pending                 (stock requested)
       -> stock_created            (confirmed commit + canonical stock ID)
       -> stock_failed             (confirmed rollback/failure; retry allowed)
       -> stock_result_unknown     (timeout/response loss; DB outcome unknown)
            -> stock_created       (lookup proves completed)
            -> stock_failed        (lookup proves no commit and safe retry)
            -> stock_pending       (same-ID retry after recovery check)
```

Do not transition unknown to failed solely because a client timeout occurred. Do not use a new stock operation ID for recovery. Payload mismatch on same ID must reject.

### 5.3 Response-lost and reload recovery

- After catalog save, backend persists operation record and catalog ID before client reports success.
- Before stock RPC, persist stock operation ID and `stock_pending`.
- If response is lost, persist/derive `stock_result_unknown` server-side or expose that status from durable request state; client reload queries operations by shop/user and renders unresolved items.
- Query durable request/operation row using the same stock ID. If completed, return canonical stock item ID and mark UI `stock_created`. If request/stock entity proves no commit and operation is safely retryable, retry exact payload with same ID. If request remains processing/ambiguous, show “Verification required” and block new-ID retry.
- After reload, the UI must reconstruct state from server data. Local storage may cache display only; it is not authoritative.
- Catalog-only remains a valid explicit state and has no inventory quantity/movement. Catalog saved with stock pending must not be shown as “stocked”.
- Status transition and stock RPC result must be transactionally consistent where possible. If catalog operation and stock RPC remain separate, durable state is a saga/recovery record; failure may leave catalog saved but must not duplicate inventory.
- A future combined RPC may improve atomicity but is not authorized here.

## 6. Revised/expanded acceptance matrix cases (R2 T01–T27 retained)

The original T01–T27 remain in R2. The following cases strengthen/revise relevant tests. These are proposed runtime tests; **NOT EXECUTED**.

| Test | Initial state | Operation / accepted-rejected result | Exact after-state | Audit | Rollback / invariant |
|---|---|---|---|---|---|
| T05-R2.1 | A/C balance 0; no matching memo/ref | Manual due with unique normalized reference, creator and independent-origin confirmation → accept | Exactly 1 manual due; balance +amount; no memo source | One immutable event with creator, raw+normalized ref, ref kind, confirmation, request/entry IDs | No stock/memo changes |
| T06-R2.1 | Same shop/customer/ref already exists | Same normalized ref, different request ID → reject | Existing row unchanged; no second ledger row; balance unchanged | Rejection diagnostic optional; no accepted financial event | Transaction rollback |
| T07-R2.1 | Known memo ID/number/registered alias exists for same shop/customer | Attempt manual due using that memo identity → reject/route to memo source | No manual row, no balance change | Rejection/source-conflict evidence, no financial event | Cannot evade by passing memo source ID |
| T28 | No paper ref; creator A and authorized manager B exist | A creates manual due and B approves no-reference exception → accept | One manual due, reference fields NULL, exception=true, reason, approver fields persisted | Creator≠approver; both actors/timestamps/method/reason/request/entry IDs | Atomic: approval and due commit together |
| T29 | No-reference manual due attempt by one actor only, or self-approval | Reject | No ledger row, no balance change, no completed financial request | Optional denial event; no accepted due event | No self-approval or checkbox-only bypass |
| T30 | Memo has due_amount>0 and customer NULL | Memo RPC attempt → reject | No memo, stock delta, movement, ledger due, completed request | No committed financial audit event | Entire memo transaction rolls back |
| T31 | Zero-due memo with customer NULL | Memo RPC → accept if otherwise valid | Memo exists; no baki row; no balance effect | Memo-created audit only | Confirms NULL customer is allowed only for no receivable |
| T32 | Ledger attempt for memo/customer from different shop/customer | RPC or direct insert attempt → reject | No cross-shop ledger row; balance unchanged | No accepted financial event | Composite FK/RPC validation rollback |
| T33 | Two sessions: balance 100; each pays 70, different request IDs | Concurrent payment → one accepted, one insufficient-balance | Exactly one paid row (70), final balance 30 | Exactly one accepted payment audit | Other session has no financial ledger/audit/completed request |
| T34 | Balance 0; concurrent memo/manual due 100 and payment 100 | Race → valid serial outcomes only (defined §3.3) | Either final 0 (due then paid) or final 100 (payment rejects before due); never negative | Audit order matches committed serialization | Lock order and after-lock balance read verified |
| T35 | Existing catalog row; stock request not committed | Stock operation begins; durable operation record/status saved; client reload | Operation appears after reload with same catalog/stock IDs and pending status | Operation creation/update events with actor/IDs | No dependence on React memory/local cache |
| T36 | Stock RPC commits; response dropped | Retry/query same stock ID → return canonical stock item | Exactly 1 stock row/opening movement; state stock_created | One stock-created event, no duplicate financial/stock event | Same ID/same payload idempotent |
| T37 | Stock request definitively rolled back | Retry same stock ID/payload → accept | Exactly 1 stock row/movement after retry; completed request | One stock-created event | No new ID; no catalog duplicate |
| T38 | Catalog-only item | User explicitly chooses catalog-only | Catalog exists; no stock item, movement, quantity or valuation | Catalog-only event/state | Never display as stocked |
| T39 | Legacy due/paid ambiguous source | Render ledger and report | Legacy row unchanged; balance includes direction; UI badge “Historical entry — origin unknown”; no memo/manual label | Migration report captures ambiguity reason and IDs | No auto-reclassification or balance mutation |

Runtime evidence for each affected test must include pre/post ledger and balance, request records/status, relevant memo/catalog/stock entities, audit rows, SQLSTATE/RPC response, and rollback assertions. Concurrent tests must use independent DB sessions. Synthetic tenant data only. No runtime PASS claim until execution.

## 7. R2 section mapping and approval state

| Clarification topic | R2.1 sections | R2 sections clarified |
|---|---|---|
| Manual reference and exception policy | §1, §2.2, §2.3, §6, T05-R2.1–T07-R2.1, T28–T29 | §2.3, §7, §12, §14 |
| Composite FK and CHECK constraints | §2, T30–T32 | §3 |
| Payment locks and balance invariant | §3, T33–T34 | §5, §6, §11 |
| Legacy classification/UI semantics | §4, T39 | §4, §6, §11, §12 |
| Durable catalog/stock recovery | §5, T35–T38 | §9, §11, §12 |

## 8. Explicit restrictions and remaining design decisions

- PR #2 and R2 are preserved unchanged; this document is a separate focused revision.
- No application code, SQL migration file, database, or production data changed.
- No staging/runtime tests were executed; no PASS claim is made.
- Implementation approval remains **NOT GRANTED**; financial pilot remains **NO-GO**.
- CH-1 should confirm: manager vs second-actor exception authority; reference uniqueness scope (customer vs shop); permitted exception reason codes; whether no-reference entries require a value/amount threshold or daily cap; operation-state storage location (existing `transaction_requests` vs dedicated table); exact memo alias registry and normalization per reference type.
