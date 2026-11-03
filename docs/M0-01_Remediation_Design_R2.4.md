# DokanTools — M0-01 Remediation Design R2.4

**Revision:** R2.4 — CH-4 independent QA corrections (design-only)  
**Disposition:** CH-1 / CH-4 independent review required  
**Implementation approval:** NOT GRANTED  
**Financial pilot:** NO-GO  
**Repository:** Hasnat26/DokanTools  
**Baseline:** efa7d5da139030c092089831f813df697eaed71e  
**R2 head:** 2e97683d66700726826d89c18d0fc6f01d533f80  
**R2.1 head:** 352703589a2f2bfdd8db70d43693e0e9ac21f64d  
**R2.2 branch base:** R2.1 head above  
**Related history:** PR #2 (R2), PR #3 (R2.1); neither is modified by this revision.

> This is a design specification only. SQL snippets are design-review material, not migration code. No application source, SQL migration, database, staging, or production data was changed. PostgreSQL/runtime behavior is NOT VERIFIED.

## 1. Executive decision and revision history

R2.2 consolidates R2 and R2.1 and closes the design-level gaps identified by CH-4. It does not grant implementation approval. Any point requiring a Product Owner (PO), DBA/security owner, or business/accounting decision remains **PO-PENDING / IMPLEMENTATION BLOCKED** until approved.

| Revision | Purpose | Git history |
|---|---|---|
| R1 | Initial remediation design | Preserved in PR #1 |
| R2 | F-01–F-10 design response | PR #2 preserved |
| R2.1 | Focused reference, constraint, balance, legacy UI and stock clarifications | PR #3 preserved |
| R2.2 | Authorization, migration-only guard, exact nullability, writer/lock closure, idempotency states, durable operations, audit, customer recovery and expanded tests | Separate design PR |

### 1.1 Governing design principles

- Financial writes are server-authorized, tenant-scoped, atomic and idempotent.
- No-reference manual due is a **two-step durable approval workflow**; creation of a pending request is not a ledger posting.
- Direction remains baki_entries.type (due / paid); origin is separate.
- Historical legacy_unclassified is migration-only and frozen after backfill.
- Aggregate balance is derived from posted ledger rows. No memo-level settlement/allocation is claimed.
- Every active balance writer must be forced through one lock protocol or disabled.
- A response timeout is not proof of failure. Recover using the same stable operation ID; never blind-replay ambiguous financial work.
- Catalog and stock are separate durable operations unless a future combined RPC is separately approved.
- No automatic merge of customer or inventory records.
- Database owner/superuser break-glass capability is a trust-boundary limitation, not something RLS or ordinary triggers can eliminate.

## 2. Baseline facts and assumptions

Source-level baseline references:

- create_memo_transaction: creates memo, changes stock and creates memo due when due amount > 0 within its transaction.
- create_baki_entry: baseline manual due/payment RPC path.
- create_stock_item: stock creation RPC; catalog creation currently occurs separately in the UI.
- baki_entries.type: existing direction field (due / paid).
- baki_entries.customer_id: baseline non-null.
- memos.customer_id: nullable in baseline; customerless memo is permitted only if it has no receivable.
- Existing SECURITY DEFINER functions, RLS, ACLs and role behavior must be inspected after migration. Source code alone does not prove effective deployed privileges.
- The baseline memo note may include only a shortened UUID. A short prefix is not a deterministic memo identity.
- Customer create-or-get is a separate baseline UI operation before memo/Baki transaction.
- Catalog and stock creation are separate baseline writes.

**Assumption requiring verification:** names and types in illustrative SQL match the baseline at the referenced commit. Implementation must compare actual schema, function signatures, constraints, indexes and grants before writing a migration. Do not silently adapt a mismatch.

## 3. CH-4 disposition and traceability

| QA finding | R2.2 disposition | R2.2 section(s) | Status |
|---|---|---|---|
| R21-01 No-reference approval protocol | Two-step authenticated pending/approve/post protocol; trusted identity, role recheck, hash binding, expiry, cancellation, replay rules | §4, T40–T43, T55 | Design addressed; PO role/expiry decisions pending |
| R21-02 Legacy origin not migration-only | Temporary migration-only context, final permanent trigger guard, immutable legacy rows, privilege/trust boundary | §5, T44, T56 | Design addressed; runtime unverified |
| R21-03 FK/CHECK nullable semantics | Exact nullability and allowed combinations, composite keys, explicit null semantics, direct INSERT/UPDATE matrix | §6, T45 | Design addressed; schema/source comparison pending |
| R21-04 Reference uniqueness | Scope and cross-kind behavior explicitly PO-pending; safe default recommendation | §12, §13 | PO-pending |
| R21-05 Audit immutability | ACL + append-only trigger + correction events + owner/superuser residual risk | §11, T53, T57 | Design addressed; runtime unverified |
| R21-06 Balance lock writer coverage | Known writer inventory, catalog inventory queries, exact lock sequence; unknown writers disabled | §7, T46–T48, T58 | Design addressed at specification level; source/catalog inventory must be executed later |
| R2-07 Processing-state ambiguity | Atomic financial request vs durable pending approval/stock states vs legacy stuck rows | §8, T59 | Design addressed |
| R2-08 Catalog/stock recovery | Stable operation IDs, durable server record, identity uniqueness, reload/response-loss recovery | §9, T49–T52, T60 | Design addressed; PO identity decisions pending |
| R2-09 Catalog audit mismatch | Audit guaranteed only through RPC/operation contract; direct catalog writes prohibited or no audit claim | §9.6, T61 | Design addressed |
| R2-10 Customer create-or-get | Stable ID, exact payload, shop-scoped identity, no auto-merge, conflict/recovery path | §10, T54, T62 | Design addressed; identity fields PO-pending |
| R2-11 Privileged function owner/role | Explicit target trust model and catalog/ACL verification; role owner decision before implementation | §7.5, §11.4, T63 | Design addressed; DBA/security approval required |
| F-01 Direction/origin | Direction/origin matrix and source rules | §6 | Addressed |
| F-02 Composite tenant/customer/memo integrity | Composite FK and RPC cross-table invariants | §6 | Addressed |
| F-03 Legacy classification | Deterministic backfill and ambiguous-row preservation | §5 | Addressed |
| F-04 Atomicity/idempotency | Same-ID behavior and transaction boundaries | §8 | Addressed |
| F-05 Payment concurrency | Aggregate balance invariant and shared locks | §7 | Addressed |
| F-06 Manual due/payment | Manual transaction semantics and approval | §4, §6 | Addressed |
| F-07 Cancellation/reversal | Excluded; posted financial rows immutable | §15 | Addressed as scope restriction |
| F-08 Catalog/stock partial success | Durable operation state and recovery | §9 | Addressed |
| F-09 RLS/tenant security | ACL, SECURITY DEFINER and privileged-path trust boundary | §7, §11 | Addressed at design level |
| F-10 Acceptance tests | T01–T63, proposed only | §14 | Proposed / NOT EXECUTED |

## 4. R22-P0-01 — Two-step no-reference manual due approval

### 4.1 State model

No-reference manual due cannot be posted through a one-step RPC. The pending approval is a durable workflow separate from financial ledger posting.

States:

~~~text
pending_approval
  -> posted
  -> cancelled
  -> expired
  -> rejected (optional explicit authorized rejection)

posted/cancelled/expired/rejected are terminal.
~~~

The operation record is durable and includes:

- shop_id, immutable operation_id (UUID), operation type;
- creator identity from trusted server context;
- canonical payload and canonical payload hash;
- customer ID, amount, direction=due, origin=manual;
- no-reference reason code and bounded reason text;
- independent-manual-origin confirmation;
- created_at, server-derived expires_at, status;
- approval actor, approval timestamp, approval method and authorization snapshot/reference;
- canonical ledger entry ID after posting;
- cancellation/rejection actor and reason where applicable;
- audit/event IDs.

The client may supply operation ID, business payload and reason; it may **not** supply a trusted creator ID, approver ID, role, approval timestamp, status, ledger ID or payload hash as authoritative values.

### 4.2 Proposed RPC/API contract

Names are proposed contract names, not existing functions:

1. submit_manual_due_pending(operation_id, shop_id, customer_id, amount, reason_code, reason_text, independent_origin_confirmed, payload)
   - Creator identity is derived from auth.uid() / trusted server auth context.
   - Authenticated actor must be shop owner or an approved shop member allowed to create manual dues.
   - Validates shop/customer relation and amount > 0.
   - No-reference route only; no ledger entry is inserted.
   - Canonicalizes payload server-side and stores hash.
   - Persists state pending_approval.
   - Same operation ID + same canonical payload returns the same pending operation.
   - Same operation ID + changed payload or another operation type rejects.
   - Directly supplied approved_by_user_id or approval flag is ignored/rejected.

2. approve_manual_due_pending(operation_id)
   - Approver identity is derived from the current authenticated server context; no approver ID argument.
   - Locks the pending operation row first.
   - Revalidates operation status, payload hash, expiry, shop, customer and current approver authorization.
   - Verifies approver != creator.
   - Requires approved PO role policy (see §13). If no authorized role/member is defined, fail closed.
   - Acquires shop and customer locks in the order defined in §7.
   - Recomputes canonical payload/hash from persisted pending data; client cannot change payload at approval.
   - Rechecks shop membership/role immediately before posting.
   - Inserts ledger row and financial audit evidence; transitions pending operation to posted; writes canonical ledger ID and idempotency result; commits all final-posting effects atomically.
   - Approval cannot be applied to a different operation ID or changed payload.

3. cancel_manual_due_pending(operation_id)
   - Creator may cancel own pending request; shop owner may cancel if PO-approved policy permits.
   - Must derive actor from trusted context, lock operation row, require state=pending_approval and not already posted.
   - Writes cancellation audit and state transition; no ledger row.
   - Cancellation racing approval is serialized by operation-row lock; only one terminal transition wins.

4. get_manual_due_operation(operation_id)
   - Read-only, shop-authorized lookup.
   - Returns durable status and canonical IDs, not secrets or unauthorized audit data.
   - After reload, UI reconstructs operation state from this endpoint/database row.

### 4.3 Authorization contract and role-model options

The baseline does not establish a complete shop manager role model. R2.2 does not invent one.

PO-approved options:

- Option A — Owner-only approval: only shop owner can approve no-reference due.
- Option B — Owner + explicitly delegated manager: owner and a role-bearing manager membership can approve.
- Option C — Two distinct shop members: creator and approver must be distinct authenticated shop members; requires PO approval of acceptable role authority.

**Recommended default:** Option B if a secure shop membership/role table already exists or is approved; otherwise Option A. Do not treat “different user ID” alone as authorization. A random second member is not automatically a manager.

Minimum implementation authorization contract:

- Actor has valid authenticated server context.
- Actor is an active member/owner of the same shop.
- Role grants the exact action.
- Role/membership is checked from server-owned data, not client claims.
- Creator and approver are different authenticated subjects.
- Approval is checked again at final posting time.
- No client can create or elevate membership/role.
- If role model, owner ID, membership table or policy is unresolved, no-reference posting is disabled.

### 4.4 Expiry, replay, revocation and failure behavior

- Expiry timestamp is generated by server; client cannot set it.
- Exact duration is PO-pending. Recommended conservative behavior: short expiry, pending operation expires automatically by comparison at approve time; no late approval.
- After expiry, approval rejects; creator must submit a new operation ID and obtain a new approval. Expired operation remains in audit/history.
- Approver role revoked before approval/posting: final approval rejects. A previous UI approval screen is not authority.
- Approval replay after posted: same operation ID returns original canonical posted result to an authorized actor; no second ledger row/event. A replay with altered payload or another operation ID rejects.
- Concurrent approvals: operation row lock serializes; exactly one final post, all other attempts return already-posted/terminal status.
- No-reference pending request has no effect on aggregate balance.
- Validation, ledger insert, audit insert, request completion or state transition failure causes final approval transaction rollback; pending state remains pending if no terminal state was committed.
- If response is lost after posting, query same operation ID; do not create a new request.

### 4.5 Audit fields and posting evidence

Persist creator/approver identities from trusted auth context, their shop authorization reference/role at action time, timestamps, operation ID, canonical payload hash, amount/customer/shop, reason, approval method, request/ledger IDs and terminal status. Never store credentials, OTPs or PINs.

## 5. R22-P0-02 — Database-enforced migration-only legacy_unclassified

### 5.1 Why CHECK/RPC alone are insufficient

A CHECK constraint can validate allowed value combinations but cannot distinguish migration-time writes from post-migration writes. RPC rejection is insufficient because a future SECURITY DEFINER function, service role, import path or direct privileged SQL may bypass the RPC. RLS is not a complete control for owner/service/BYPASSRLS paths.

### 5.2 Proposed two-phase migration guard

**Migration phase only:**

- Use a dedicated migration principal (recommended: non-login role such as dokantools_legacy_backfill) with narrowly scoped, time-bounded migration authorization.
- It is not a member/role available to authenticated, anon, service_role, RPC function owners or routine application users.
- The deployment operator/migration runner obtains this role through controlled migration credentials/role membership; application clients cannot SET ROLE or pass a “migration mode” parameter.
- A temporary SECURITY INVOKER guard may permit setting origin=legacy_unclassified only when current_user is the dedicated migration principal during the approved backfill window.
- Backfill only changes classification/source metadata; it must not alter amount, direction, customer/shop IDs, timestamp or balance.
- Migration verifies counts, conflicts and row hashes/IDs before and after classification.
- The migration transaction/window is closed after backfill; role membership/credential is revoked/disabled.

**Post-migration final guard:**

- Replace/close the temporary guard with a permanent trigger policy:
  - reject any INSERT with origin=legacy_unclassified;
  - reject any UPDATE that sets origin to legacy_unclassified;
  - reject UPDATE/DELETE of an existing legacy-unclassified ledger row;
  - reject changing origin/direction/amount/source identity of any posted ledger row;
  - no client-settable flag or arbitrary GUC/session variable can bypass it.
- Direct authenticated, service-role, alternate SECURITY DEFINER and import paths are rejected by the trigger unless they execute as an explicitly allowed migration principal during the approved migration window.
- Future classification correction is **not** an in-place update. Use a separately approved append-only correction workflow: preserve original row; add correction/adjustment event with reason, actor and link; any financial adjustment is a separate reviewed ledger entry and is out of M0-01.

### 5.3 Trigger trust boundary and residual risk

A SECURITY INVOKER trigger sees the invoking database role context. A SECURITY DEFINER function executes under its function owner; therefore that owner must not be the migration principal or have migration-role membership. Ordinary service role does not bypass triggers merely by bypassing RLS, but a table owner/superuser can disable/drop triggers or alter schema.

**Residual break-glass risk:** PostgreSQL superuser, table/schema owner with sufficient DDL privileges, or compromised migration credentials can circumvent controls. This is outside ordinary application threat boundary and must be controlled by restricted credentials, change approval, external/platform audit, and no routine owner credentials in application runtime. Do not claim absolute immutability against superuser intervention.

### 5.4 Catalog/ACL checks required after migration

Inspect:

- trigger existence, enabled state and trigger function owner/security mode;
- migration role membership, LOGIN status, grants and remaining access;
- table owner, schema owner, service role and function owner memberships;
- rolsuper, rolbypassrls, pg_auth_members;
- effective INSERT/UPDATE/DELETE privileges;
- every SECURITY DEFINER function that writes ledger rows;
- no legacy origin INSERT/UPDATE grant to browser, service or RPC owner roles.

These are planned checks, not executed.

## 6. R22-P0-03 — Exact nullability, CHECK and composite FK specification

### 6.1 Target nullability and allowed data

| Table/field | Target nullability | Rule |
|---|---|---|
| baki_entries.id | NOT NULL, PK | Canonical ledger ID |
| baki_entries.shop_id | NOT NULL | Tenant |
| baki_entries.customer_id | NOT NULL | All ledger entries require a customer |
| baki_entries.type | NOT NULL | Existing direction: due/paid |
| baki_entries.origin | NOT NULL after backfill | memo/manual/legacy_unclassified |
| baki_entries.amount | NOT NULL | Positive magnitude; direction determines sign |
| baki_entries.source_memo_id | NULLABLE | Non-NULL only for memo-origin due |
| manual_reference_raw | NULLABLE | Required for manual due with reference |
| manual_reference_normalized | NULLABLE | Server-derived; null only for approved no-reference exception or non-manual-due |
| manual_reference_kind | NULLABLE | Required for referenced manual due; none_exception for no-reference due |
| reference_exception | NOT NULL DEFAULT false | True only for approved no-reference manual due |
| reference_exception_reason_code/text | NULLABLE | Required for exception; otherwise NULL |
| created_by_user_id | NULLABLE only for historical rows where unavailable | Required for new manual financial writes |
| approved_by_user_id | NULLABLE | Required for no-reference due; otherwise NULL |
| approved_at | NULLABLE | Required for no-reference due; otherwise NULL |
| approval_method | NULLABLE | Required for no-reference due; otherwise NULL |
| independent_manual_due_confirmed | NOT NULL for new manual due | Server validates and audit records; historical values may require migration policy |
| memos.id/shop_id | NOT NULL | Parent identity |
| memos.customer_id | NULLABLE | Allowed only when due_amount is zero |
| memos.due_amount | NOT NULL, default 0 (target) | Must be >= 0; positive due requires customer |
| customers.id/shop_id | NOT NULL | Parent tenant key |
| approval.operation_id | NOT NULL, unique | Stable pending request ID |
| approval.creator_user_id | NOT NULL | Trusted auth identity |
| approval.payload_hash | NOT NULL | Server canonical hash |
| approval.approver_user_id | NULL until approved | Server-derived auth identity |

Actual migration must verify existing type/column definitions before applying this target. If any baseline column cannot be made to meet the target without data loss, stop for design review.

### 6.2 Allowed combinations

| type/direction | origin | customer | source_memo_id | reference/approval | Allowed |
|---|---|---|---|---|---|
| due | memo | NOT NULL | NOT NULL | all manual/approval fields NULL/false | Yes, memo RPC only |
| due | manual | NOT NULL | NULL | valid reference OR posted two-step no-ref approval | Yes |
| paid | manual | NOT NULL | NULL | manual reference/exception fields NULL; payment audit | Yes, payment RPC |
| due/paid | legacy_unclassified | NOT NULL | NULL | reference/approval fields NULL | Historical rows only |
| paid | memo | any | any | — | Prohibited |
| due | memo | NULL | any | — | Prohibited |
| manual | any direction | NULL source required | non-NULL source | — | Prohibited |
| legacy | any direction | NULL source required | non-NULL source | — | Prohibited |
| new write | legacy_unclassified | NOT NULL | NULL | — | Prohibited by final guard |

### 6.3 CHECK semantics

PostgreSQL CHECK passes when its expression is TRUE **or NULL**. Therefore all required fields must be explicitly tested using IS NOT NULL, and boolean fields must be NOT NULL where three-valued logic could undermine a condition. Do not assume CHECK alone establishes role authorization or cross-table equality.

Illustrative target constraints (review-only):

~~~sql
CHECK (type IN ('due', 'paid'));
CHECK (origin IN ('memo', 'manual', 'legacy_unclassified'));
CHECK (amount > 0);
CHECK (shop_id IS NOT NULL AND customer_id IS NOT NULL);

CHECK (
  (origin = 'memo' AND type = 'due'
    AND source_memo_id IS NOT NULL AND customer_id IS NOT NULL)
  OR
  (origin = 'manual' AND type IN ('due', 'paid')
    AND source_memo_id IS NULL AND customer_id IS NOT NULL)
  OR
  (origin = 'legacy_unclassified' AND type IN ('due', 'paid')
    AND source_memo_id IS NULL AND customer_id IS NOT NULL)
);

CHECK (
  (origin = 'manual' AND type = 'due'
    AND reference_exception = false
    AND manual_reference_raw IS NOT NULL
    AND manual_reference_normalized IS NOT NULL
    AND manual_reference_kind IS NOT NULL
    AND approved_by_user_id IS NULL
    AND approved_at IS NULL)
  OR
  (origin = 'manual' AND type = 'due'
    AND reference_exception = true
    AND manual_reference_raw IS NULL
    AND manual_reference_normalized IS NULL
    AND manual_reference_kind = 'none_exception'
    AND reference_exception_reason_code IS NOT NULL
    AND reference_exception_reason_text IS NOT NULL
    AND created_by_user_id IS NOT NULL
    AND approved_by_user_id IS NOT NULL
    AND approved_at IS NOT NULL
    AND approval_method IS NOT NULL
    AND approved_by_user_id <> created_by_user_id)
  OR
  (NOT (origin = 'manual' AND type = 'due')
    AND reference_exception = false
    AND manual_reference_raw IS NULL
    AND manual_reference_normalized IS NULL
    AND manual_reference_kind IS NULL
    AND reference_exception_reason_code IS NULL
    AND reference_exception_reason_text IS NULL
    AND approved_by_user_id IS NULL
    AND approved_at IS NULL
    AND approval_method IS NULL)
);
~~~

The above is a semantic target, not a ready migration. The implementation must additionally define how historical manual rows lacking reference/approval data are represented without falsely claiming that they passed the new process. Preserve them as legacy/unclassified unless trustworthy provenance exists; do not relabel historical rows as newly approved manual entries.

### 6.4 Parent candidate keys and composite FK targets

Required candidate keys, after checking existing equivalents:

- customers(shop_id, id) UNIQUE.
- memos(id, shop_id, customer_id) UNIQUE (nullable customer key allowed in parent rows; uniqueness semantics must be tested).
- baki_entries(shop_id, customer_id) → customers(shop_id, id).
- baki_entries(source_memo_id, shop_id, customer_id) → memos(id, shop_id, customer_id).

Target FK behavior: RESTRICT/NO ACTION; no cascading deletion of financial records.

**MATCH SIMPLE:** for a composite FK, any NULL referencing component skips FK validation. This is intentional for manual/legacy rows with source_memo_id=NULL. The memo-origin CHECK forces all three source FK components non-NULL, so its composite FK is fully checked. Customer FK components are always non-NULL, so tenant/customer integrity is always checked.

The nullable memo customer does not weaken memo-origin ledger integrity because the child memo-origin row must have non-null customer and exact composite key match. Customerless memo is not a ledger source.

### 6.5 Memo-level checks and cross-table invariants

Target memo constraints:

- customer_id nullable only for zero-due memo.
- due_amount NOT NULL and due_amount >= 0.
- due_amount > 0 => customer_id IS NOT NULL.
- zero due with null customer is allowed if PO confirms (recommended).
- memo due RPC must reject a positive due with null customer before any stock/memo writes.

Cross-table invariants not expressible in ordinary CHECK:

- ledger memo/customer/shop matches exact memo/customer/shop;
- ledger amount equals memo due amount;
- memo is posted/eligible and not voided;
- only one memo-origin due exists per memo.

Enforce through composite FK, unique partial index and atomic memo RPC. The memo RPC must create memo, stock changes, due row, audit and idempotency result in one transaction; any failure rolls back all. If a cross-table trigger is later proposed, it requires a separate review and runtime tests.

### 6.6 Direct SQL negative matrix

After implementation, test both INSERT and UPDATE for:

- customer NULL on ledger;
- shop NULL;
- source memo NULL with origin=memo;
- source memo non-NULL with origin=manual;
- source memo non-NULL with origin=legacy;
- source memo from wrong shop;
- source memo from same shop but wrong customer;
- memo source customer NULL;
- paid + memo;
- invalid type/origin;
- amount NULL/zero/negative;
- manual due with missing reference and no approval;
- manual due with exception=true but missing approver/reason/creator;
- creator=approver;
- approval fields on non-exception due/payment/memo row;
- direct UPDATE changing manual/legacy to memo origin;
- direct UPDATE changing amount/customer/source of posted ledger;
- direct insert/update of legacy origin after migration.

Only the explicitly allowed historical/migration cases may succeed during controlled migration. All post-migration direct client writes must be denied.

## 7. R22-P0-04 — Balance-affecting writer inventory and shared lock protocol

### 7.1 Aggregate balance invariant

balance(shop, customer) = SUM(posted due amounts) - SUM(posted paid amounts)

- Only committed posted ledger rows count.
- Legacy rows contribute based on preserved direction and amount.
- Customer-level aggregate payments only; overpayment rejected.
- No memo-level allocation, FIFO/LIFO, or invoice settlement is claimed.
- Reversal/adjustment writers are disabled/not in M0-01 until separately designed and must follow same locks if later approved.

### 7.2 Complete target lock order

Every active financial writer must follow one global order:

1. **Operation/idempotency row** — claim or lock the stable request/operation ID and verify operation type + canonical payload. This is the first database row lock.
2. **Shop row** — acquire the same shop lock used by every balance writer.
3. **Customer row** — acquire the customer row lock for the same shop/customer.
4. **Inventory rows** — if the operation also changes stock, lock stock rows in deterministic ascending UUID order.
5. Perform memo/ledger/stock business writes.
6. Insert audit events and set operation result/completion.
7. Commit.

No writer may lock customer/shop first and then request row. Multi-customer operations (future only) lock customer IDs in sorted order after shop. This ordering is intended to avoid cycles; actual deadlock behavior must be runtime tested.

**Request claim semantics:** for a new atomic financial RPC, the request row/claim is inserted in the same uncommitted transaction and locked before shop/customer. A concurrent same-ID claimant waits on the unique key; after the first transaction resolves, it reads the canonical result or safely claims after rollback. It must not hold a request lock and later acquire another resource in reverse order.

### 7.3 Writer inventory (source-known + required post-migration inventory)

| Writer/path | Baseline/source knowledge | Balance effect | Status in M0-01 | Required protocol/privilege |
|---|---|---|---|---|
| create_memo_transaction(...) | Known source RPC | Memo due increase when due>0; also stock | Active only after hardening | Request → shop → customer → stock rows; atomic; authenticated RPC only |
| create_baki_entry(...) | Known baseline RPC; handles manual due/payment | Increase/decrease | Must be split/restricted to approved manual-due/payment contracts or replaced by exact secure RPCs | Request → shop → customer; old overload disabled/revoked |
| create_stock_item(...) | Known stock RPC | No direct customer balance effect | Active stock writer only | Request → shop → stock/catalog identity; cannot write ledger |
| Any other baki_entries INSERT/UPDATE/DELETE RPC | Not verified; discover via catalog/source | Balance | Prohibited unless explicitly inventoried and protocol-compliant | Revoke/disable unknown function |
| Memo edit/update RPC changing due_amount | Not verified; discover | Potential balance | Posted due changes prohibited | Revoke/disable or immutable |
| Payment/adjustment/reversal RPCs | Not verified; future paths | Balance | Disabled/not in M0-01 | No bypass; future approval required |
| Import/backfill/maintenance | No approved active post-migration financial importer | Potential balance | Direct ledger import prohibited after migration | Historical classification only under migration principal; new imported due must use approved transaction flow |
| Direct authenticated table writes | Protected table | Any | Denied | REVOKE direct INSERT/UPDATE/DELETE |
| Service/admin direct SQL | Privileged | Any | Routine writes prohibited | Break-glass only, documented and separately audited; cannot be assumed to follow RPC locks |
| SECURITY DEFINER functions/overloads | Source and deployed catalog inventory required | Any | Only reviewed exact signatures active | Safe owner/search_path/ACL, lock protocol; unknown overload revoked |
| Trigger/function side effects | Must inventory | Potential | Allowed only if reviewed | No hidden balance writer; included in catalog/source review |

### 7.4 Known and unknown function handling

The two source-known balance-affecting RPCs are create_memo_transaction and create_baki_entry. This is **not** a claim that the deployed database has only these two functions.

Before implementation and again after migration:

- Enumerate all functions, overloads, owners, SECURITY DEFINER flags, ACLs and search_path settings.
- Inspect function bodies for writes to baki_entries, changes to memos.due_amount, and indirect writes to balance-affecting tables.
- Include trigger functions and any dynamic SQL paths.
- If an unknown writer cannot be forced through the protocol, revoke its EXECUTE privileges/disable it before financial acceptance. Do not leave it “temporarily available.”

Catalog query for design review:

~~~sql
SELECT n.nspname, p.proname,
       pg_get_function_identity_arguments(p.oid) AS identity_args,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       p.proacl AS function_acl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%baki_entries%'
    OR pg_get_functiondef(p.oid) ILIKE '%due_amount%'
    OR pg_get_functiondef(p.oid) ILIKE '%create_memo_transaction%'
  )
ORDER BY n.nspname, p.proname, identity_args;
~~~

This query is illustrative; inspect all public functions and triggers, not only matches. Dynamic SQL may evade text matching.

### 7.5 Table/function privileges and role inventory

Inspect effective function and table ACLs, role flags and memberships after migration:

~~~sql
SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
FROM pg_roles
ORDER BY rolname;

SELECT r.rolname AS member, m.roleid::regrole AS granted_role,
       m.admin_option
FROM pg_auth_members m
JOIN pg_roles r ON r.oid = m.member
ORDER BY member, granted_role;

SELECT p.oid::regprocedure AS function_signature,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef, p.proacl,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('baki_entries','memos','customers',
                     'transaction_requests','audit_events',
                     'item_catalog','stock_items','stock_movements')
ORDER BY table_name, grantee, privilege_type;
~~~

No results are asserted here; these queries were not executed.

### 7.6 SECURITY DEFINER target model (DBA/security approval required)

Recommended target:

- dedicated non-login function-owner role with only required table privileges;
- no BYPASSRLS unless explicitly justified and reviewed;
- no membership in migration-only role;
- safe fixed search_path and fully qualified object references;
- explicit auth.uid(), shop ownership/membership and tenant checks;
- revoke EXECUTE from PUBLIC/anon; grant exact intended signatures to authenticated;
- direct protected table INSERT/UPDATE/DELETE denied to browser roles and service role where feasible;
- all overloads explicitly reviewed; default ACLs not assumed safe;
- service-role and admin paths cannot casually bypass business invariants;
- function owner/role membership and Supabase auth context tested at runtime.

The precise owner/role arrangement is a DBA/security decision. Do not assume the repository baseline proves it.

## 8. R22-P0-05 — Idempotency and processing recovery semantics

### 8.1 Distinguish the five states

| State category | Meaning | Durable? | Recovery |
|---|---|---|---|
| In-flight atomic financial claim | Request claim inserted in the same uncommitted transaction as business writes | No visible committed row until transaction commits | Wait on unique conflict; after transaction resolves read canonical result or retry same ID |
| Durable pending operation | Intent committed separately, e.g. no-reference due approval or catalog/stock workflow | Yes | Query operation record; resume only allowed state transition |
| Historical legacy processing | Old row from older implementation or incomplete request history | Yes | Reconcile; never blind replay |
| Business effect committed but request completion missing | Impossible for new atomic financial RPC if claim/effect/completion are one transaction; possible only in old/non-atomic path or privileged intervention | May exist only as legacy anomaly | Reconcile using exact identity; no new write until resolved |
| Response/result unknown | Client did not receive response; DB may have committed | Client uncertainty; server state is authoritative | Query/retry same operation ID and exact payload |

### 8.2 Atomic financial request contract

For memo due, manual referenced due, payment and other approved financial RPCs:

- claim/request row, financial write, audit and completion occur in one transaction;
- processing is an uncommitted internal state, not a normal committed state;
- successful commit contains final status/result/canonical entity ID;
- any failure rolls back claim, ledger, memo/stock effects, audit and completion;
- a committed processing row for a newly implemented atomic financial RPC is a design violation/legacy anomaly, not a recoverable automatic retry state.

### 8.3 Same-ID and conflicting requests

- Same shop + operation ID + operation type + same canonical payload: return the canonical result; no second effect.
- Same ID + changed payload: reject with payload mismatch.
- Same ID reused for another operation type: reject.
- Concurrent same-ID requests: one transaction owns the claim; the other waits and returns canonical result after commit, or may safely become claimant after rollback.
- Different IDs for a truly different business operation are allowed.
- A new ID is not a retry for an unknown result; it must be blocked by unresolved business-operation identity where such identity exists (catalog/stock/customer).
- Canonical memo, ledger, stock and customer IDs are persisted and returned; never synthesize a new result ID on retry.

### 8.4 Legacy processing reconciliation

Historical request rows with processing, missing payload or unknown result:

- freeze retry/re-execution;
- inspect request ID, stored payload if trusted, linked memo/ledger/stock/customer entity IDs, audit evidence and explicit operation reference;
- only exact deterministic identity is acceptable; do not use fuzzy amount/date/name match;
- reconciliation must be performed by authorized operator under documented change/audit ticket;
- if exact effect exists, mark/reconcile canonical result using an append-only reconciliation event and no duplicate financial effect;
- if absence is proven, same original request ID may be resumed only under reviewed recovery procedure;
- if neither is provable, state reconciliation_required, keep financial operation blocked and escalate;
- never mint a new request ID to “try again” while prior outcome remains ambiguous.

Legacy NULL payload remains fail-closed. Payload is not reconstructed from user memory or UI state.

### 8.5 Durable pending operations are not processing

No-reference due approval uses §4 state machine. Catalog/stock uses §9. These durable states have explicit owner/actor, timestamps, expiry where relevant, operation IDs, payload hashes and allowed transitions. They are not stored as generic atomic financial request processing.

## 9. R22-P0-06 — Durable catalog/stock identity and recovery

### 9.1 Durable server operation record

Target durable operation record (existing transaction request extension or dedicated table; exact schema is implementation design review):

- shop ID;
- catalog operation ID;
- catalog row/entity ID;
- stock operation/request ID;
- stock item ID;
- canonical catalog payload/hash;
- canonical stock payload/hash;
- actor ID from auth context;
- business action key (e.g. initial stock/opening-stock action);
- state/status, created/updated times;
- last confirmed result and sanitized error code;
- audit/event reference.

Server database is authoritative. IndexedDB/local storage may cache IDs for UX, but must never authorize or decide transaction status.

### 9.2 Catalog operation identity

- catalog_operation_id is created before first request and reused for retries.
- Catalog create/update RPC writes operation record and catalog entity in one transaction.
- Same ID + same canonical payload returns canonical catalog ID.
- Same ID + changed payload rejects.
- Catalog creation is protected by shop-scoped normalized business identity uniqueness (see §12); different operation IDs cannot create duplicate identities.
- Update operation requires existing catalog ID and expected version/revision. Stale concurrent update returns conflict; do not silently overwrite.
- If response is lost, query by catalog operation ID or stable identity and recover the original catalog entity ID.
- Direct browser catalog writes are prohibited in the target model if audit/idempotency guarantees are required. If direct writes are retained, tests and audit claims must be weakened accordingly; preferred policy is RPC-only writes.

### 9.3 Stock operation identity and states

Stock operation ID is stable and separate from catalog operation ID. It is also the stock RPC idempotency key.

States:

~~~text
catalog_saved
  -> catalog_only                 (explicit user chose no stock)
  -> stock_pending                (stock requested; durable intent committed)
       -> stock_created           (stock row + opening movement + request result committed)
       -> stock_failed            (only if server proves transaction rolled back)
       -> stock_result_unknown    (client-facing uncertainty; server record remains unresolved)
            -> stock_created      (lookup proves committed)
            -> stock_pending      (safe same-ID retry after absence/rollback proved)
            -> reconciliation_required (cannot prove result)
~~~

- stock_result_unknown is an uncertainty label, not evidence of rollback. It may be derived in UI when request remains pending after timeout.
- Do not set stock_failed merely because browser/network timed out.
- stock_created is terminal for the initial-stock action; canonical stock item ID and opening movement ID are persisted.
- Catalog-only is valid and must not have stock quantity, stock movement or inventory valuation.

### 9.4 Stock transaction and retry contract

1. Durable stock operation intent (stock ID, payload hash, catalog ID, business action key) is committed before or in a controlled operation record.
2. Stock RPC claims same stock operation ID, locks shop and relevant stock/catalog identity, validates exact payload.
3. Stock row, opening movement, operation result and request completion commit atomically.
4. If RPC rolls back, stock operation remains safely retryable using same ID/payload.
5. If RPC commits but response is lost, server lookup returns canonical stock item/movement IDs; same-ID retry returns the prior result.
6. Changed payload under same stock ID rejects.
7. New stock ID for unresolved same opening-stock action is rejected by unique business-action identity or requires explicit reconciliation.
8. Do not create a second opening movement for an already-stocked catalog item. Later restocking is a separate movement type with a new operation ID and explicit intent.

### 9.5 Server lookup and browser reload

Proposed read API: get_catalog_stock_operation(catalog_operation_id) or authenticated shop-scoped query.

- After reload, client queries unresolved operation records for the current shop/user.
- It reconstructs catalog ID, stock ID, payload hash/status and canonical result from server data.
- If browser lost its local operation ID, server lists outstanding operations for that shop/actor and the user selects/reconciles the appropriate one; no new ID is generated automatically.
- Client local storage is cache only; deleting it does not delete or alter the server operation.
- Before creating a new initial-stock operation for the same catalog identity, server checks existing opening-stock action/status.
- If existing operation is pending/unknown, return OPERATION_UNRESOLVED and require recovery; do not accept a new ID.

### 9.6 Catalog audit contract (R2-09)

- Audit is guaranteed only for catalog writes performed through the approved catalog RPC/operation workflow.
- Target policy: browser direct INSERT/UPDATE/DELETE to item_catalog denied; RPC writes catalog row, operation record and audit event atomically.
- If PO/engineering chooses to retain direct writes, catalog-only audit cannot be guaranteed for those paths and acceptance tests must not require it. The preferred pilot design is RPC-only catalog writes.
- Catalog audit events are not financial ledger events; they must not be counted as customer balance changes.

### 9.7 Prevent concurrent duplicate stock/catalog identity

- A client-side EXISTS check is not enough under concurrency.
- Use a DB unique constraint/index on shop-scoped canonical catalog identity and/or stable SKU/barcode keys (see §12).
- Use unique initial-stock business action key and/or unique (shop_id, catalog_item_id) stock-item relation if the business model is one inventory row per catalog identity.
- Concurrent distinct request IDs for same normalized identity: one commits; other returns explicit identity conflict/canonical existing ID only if PO-approved create-or-get semantics permit it. Never silently merge/overwrite.
- Identity uniqueness and catalog-only/stocked sharing rules are PO-pending; implementation must not guess.

## 10. R22-P1-03 — Customer create-or-get and response-loss recovery

### 10.1 Separate operation contract

Recommended default: customer creation is a standalone idempotent RPC, not implicitly part of memo/Baki financial transaction. This preserves existing workflow but makes the separate customer commit explicit and recoverable.

Proposed RPC: create_or_get_customer(operation_id, shop_id, customer_payload).

- Creator identity derived from authenticated context.
- Stable customer operation ID generated before first request.
- Server canonicalizes payload; same ID/same payload returns canonical customer ID.
- Same ID/changed payload rejects.
- Operation record and customer creation commit atomically.
- Shop-scoped unique identity key is required; exact identity fields (phone, name, or combination) are PO-pending. Do not select or merge identity fields without approval.
- If a normalized identity match exists with compatible data and PO-approved policy permits reuse, return existing canonical customer ID.
- If identity match conflicts on details, return CUSTOMER_IDENTITY_CONFLICT and require operator review; do not merge/update existing customer automatically.
- Cross-shop identity is separate by default; no cross-shop customer sharing/merge.
- If response lost, query/retry same operation ID; return original customer ID.
- If user retries with a new ID but matching identity exists, unique key prevents duplicate; return existing only if approved create-or-get rules permit, otherwise conflict/review.

### 10.2 Failure/recovery semantics

- Customer create success followed by memo/Baki RPC failure may leave an unused customer row. This is a documented harmless partial workflow state, not a financial ledger entry.
- UI must reuse the canonical customer ID from create-or-get and not create a new customer on every memo/Baki retry.
- Customer creation does not affect aggregate balance and does not use the customer-balance lock protocol; it does use shop-scoped identity uniqueness and idempotency.
- Do not automatically merge duplicates discovered during migration or recovery.

## 11. R22-P1-01 — Audit immutability, approval provenance and correction

### 11.1 Roles and access target

| Role/path | Audit INSERT | SELECT | UPDATE/DELETE |
|---|---|---|---|
| Authenticated shop user | Denied direct; via approved RPC only | Own shop, policy-filtered | Denied |
| Anon | Denied | Denied | Denied |
| Service role | No direct routine mutation; approved RPC/maintenance only | Explicit operational need | Denied in routine use |
| RPC function owner | INSERT only for approved transactional events | Required scope | Denied by trigger/ACL |
| Migration principal | Migration audit only during approved migration | Limited | No routine update/delete |
| Break-glass owner/admin | Exceptional, restricted | Explicit | Cannot be made technically impossible; externally logged/approved |

### 11.2 Enforcement design

- Revoke ordinary UPDATE/DELETE on audit and approval evidence tables.
- Revoke direct INSERT from client roles; events are inserted through approved RPCs.
- Add database trigger guard rejecting UPDATE/DELETE on audit/approval rows for all non-break-glass contexts.
- Audit/approval records include operation ID, shop, actor, trusted auth provenance, timestamp, action, payload hash, linked entity IDs, and reason.
- Approval record is inserted atomically with final ledger posting. A pending request event is separately committed when submitted.
- A denied approval attempt may generate a security/denial event if logging is designed not to create a financial effect; it must not create a posted due.
- Trigger/ACL protection does not prevent superuser/table owner from disabling triggers or altering tables. Restrict ownership credentials, require break-glass ticket and external/platform logging. No absolute immutability claim.

### 11.3 Append-only correction procedure

- Never edit/delete original audit or approval evidence.
- Correction is a new event referencing original event ID, correction reason, actor, timestamp and ticket.
- Financial correction requires a separate reviewed correcting ledger entry; original due/payment is preserved.
- Correction workflow is out of M0-01 and cannot be implemented without separate PO/accounting approval.
- No silent reclassification of legacy ledger rows.

## 12. R22-P1-02 and R22-P1-04 — Reference and inventory identity

### 12.1 Manual reference uniqueness — PO decision register

**Decision status: PO-PENDING.** Recommended safe default:

- Customer-scoped uniqueness: (shop_id, customer_id, reference_kind, normalized_reference).
- PO may designate selected reference kinds (e.g. shop serial/invoice book serial) as shop-global; those require a separate shop-global unique key.
- Reference normalization is server-side, versioned and kind-specific: Unicode NFKC, trim, collapse whitespace, case fold only if kind is case-insensitive; separator removal only when PO says separators are insignificant.
- Same normalized value under different customers: allowed under customer-scoped kinds; not automatically merged. Shop-global kinds conflict.
- Same normalized value across different reference kinds: do not silently merge. Recommended default is duplicate-warning/review or fail-closed conflict until PO chooses cross-kind semantics.
- Same reference cannot identify multiple obligations for the same customer/kind unless PO explicitly approves a suffix/obligation sequence model.
- No-reference exception rows are not protected by reference uniqueness. Repeat exception is possible; require two-step approval and audit. Consider PO-set thresholds/daily caps; not implemented by assumption.
- Memo identifiers/aliases are authoritative only when persisted in trusted server data. A manual reference that exactly matches a known memo ID/number/alias for same shop/customer is rejected/routed to memo due. Do not use fuzzy amount/date matches or shortened UUIDs.

Residual risk: altered/omitted references and repeated no-reference exceptions can still be used to misclassify an obligation. This is a human/fraud risk, not solved by uniqueness indexes.

### 12.2 Inventory normalized identity — PO decision register

**Decision status: PO-PENDING.** Recommended identity hierarchy:

1. Shop-scoped stable SKU/barcode when unique and trusted.
2. Otherwise a normalized catalog identity derived from NFKC, trim/collapse whitespace and case fold (only if names are case-insensitive), plus PO-approved variant attributes.
3. Candidate key: (shop_id, identity_key); do not use name alone if brand/size/pack/variant distinctions are legitimate.
4. Catalog-only and stocked item should normally refer to the same catalog identity; stocking adds inventory state, not a duplicate catalog product.
5. Distinct request IDs creating same normalized identity concurrently: unique constraint decides one canonical row; other receives conflict or canonical existing ID only under approved create-or-get semantics.
6. Never silently merge two catalog/stock records. Conflict resolution requires explicit operator review.
7. If PO permits same-name variants, variant fields/SKU must participate in key; implementation cannot invent variant policy.

Initial-stock action should be unique per canonical catalog/stock item (e.g. unique opening movement/business action key). Later restocking is a separate movement, not another opening-stock create.

## 13. PO decision register — all items pending unless explicitly approved

| ID | Decision | Options | Recommended default | Impact | Status |
|---|---|---|---|---|---|
| PO-01 | No-reference manual due approval | Owner-only; owner+delegated manager; distinct authorized shop member | Owner-only until approved manager-role model exists; fail closed if unavailable | Determines who may post exception credit | PENDING |
| PO-02 | Approval expiry/revocation | Duration; role recheck policy | Server timestamp, short expiry; role recheck at approval; expired request cannot be revived | Security/usability; exact duration unresolved | PENDING |
| PO-03 | Reference uniqueness | Customer-scoped vs shop-global per kind; cross-kind collision | Customer-scoped default; shop-global selected kinds; cross-kind collision fail-closed/review | Duplicate prevention vs false positives | PENDING |
| PO-04 | Aggregate payment | Customer aggregate vs allocation; overpayment behavior | Customer-level aggregate; reject overpayment; no memo allocation | Ledger semantics and UX | PENDING |
| PO-05 | Legacy ledger display/balance | Include or exclude legacy rows | Show “Historical origin unknown”; preserve direction and include in aggregate | Historical balance may include uncertain source | PENDING |
| PO-06 | Inventory normalized identity | Name only; SKU/barcode; variant-aware | Shop-scoped identity with explicit variants/conflict; no silent merge | Duplicate/variant behavior | PENDING |
| PO-07 | Customer create-or-get | Exact phone; phone+name; other stable key; no reuse | Stable shop-scoped key chosen by PO; no auto-merge | Customer duplicates and privacy | PENDING |
| PO-08 | Manager role model | Owner-only; delegated manager; distinct member | Owner-only until roles/membership are approved | Approval authority and schema dependency | PENDING |
| PO-09 | No-reference thresholds/reason codes | No cap; amount cap; daily cap; required reasons | Do not impose unapproved cap; no-reference approval required; exact reason codes pending | Fraud exposure | PENDING |
| PO-10 | Catalog-only vs stocked identity | Same catalog identity; separate identities | Same catalog identity, stock state separate | Product data consistency | PENDING |

If PO decisions are not resolved, implementation must fail closed or disable the dependent feature. They must not be silently decided by developers.

## 14. Runtime acceptance matrix — T40–T63

All tests are **PROPOSED / NOT EXECUTED**. Retain prior T01–T39; revise tests where R2.2 changes semantics. Use synthetic tenants only, independent database sessions for concurrency, and pre/post committed-state queries. No runtime pass is claimed.

### Common evidence for every test

Capture test ID, UTC timestamp, DB version, migration revision, tenant/shop/customer/memo/item IDs, operation/request IDs, payload hash, authenticated actor, RPC result/SQLSTATE, before/after aggregate balance, relevant committed rows, request/operation status, audit rows and explicit rollback assertions. Never capture secrets or real customer PII.

| Test | Preconditions / actors | Action | Expected result | Exact after-state / audit / rollback |
|---|---|---|---|---|
| T40 | Tenant A; creator C created pending no-ref operation O; C is creator | C calls approve RPC for O | Reject self-approval | O remains pending (or terminal if expired); no ledger row; no posted request; no approval/post audit; balance unchanged |
| T41 | O pending; creator C sends forged approver ID for manager M in direct RPC | Call approve with extra forged field | Reject/ignore caller-supplied identity; actor derived from auth | No ledger row; no approval event; O remains pending; denial/security event may exist without financial effect |
| T42 | O pending; actor X is not shop owner/member/approved manager | X approves | Authorization error | No ledger row; no state transition; balance unchanged; no accepted approval audit |
| T43 | O pending with payload hash H; attempt changed amount/customer/reference or replay after posted using another ID | Approve altered/replayed request | Payload mismatch/terminal replay rejection | At most one posted ledger row for O; original amount/customer/hash unchanged; one posting audit; no second balance effect |
| T44 | Post-migration; authenticated, service role, alternate SECURITY DEFINER writer, import path | INSERT legacy origin; UPDATE normal row to legacy; UPDATE/DELETE existing legacy | All post-migration writes rejected except privileged owner break-glass (trust boundary) | No row created/changed/deleted; no balance change; trigger/ACL evidence captured; migration role not available to app roles |
| T45 | Synthetic shops A/B, customers A/B, memos A/B; direct INSERT and UPDATE | Test each nullable source/customer/shop component, wrong shop, wrong customer, wrong memo, paid+memo, manual/legacy with source | Only documented valid combinations accepted; all invalid ones fail CHECK/FK/ACL | Rejected tx leaves no row/audit/request completion; customer/shop FK valid for all ledger rows; memo-origin source/customer/shop exact |
| T46 | A customer balance 0; memo with due 100 and payment 100 race in independent sessions | Race memo RPC vs payment RPC | Valid serialization only | Either memo commits first then payment succeeds and final balance 0; or payment first rejects and memo commits final 100; never negative; audit order matches commits |
| T47 | A customer balance 0; manual referenced due 100 and payment 100 race | Race manual due vs payment | Valid serialization only | Due-first → payment success final 0; payment-first → reject payment, due commit final 100; never negative; one due/payment as appropriate |
| T48 | Authorized service/admin or alternate writer attempts direct ledger write without protocol | Direct SQL/RPC bypass attempt | Denied or writer disabled; no bypass path active | No ledger/balance/audit effect; ACL/function inventory shows no unreviewed writer; privileged break-glass attempt documented |
| T49 | Catalog creation committed; browser reload before stock RPC | Reload, query unresolved operation | Recovery endpoint returns same catalog operation/entity ID and original stock operation ID if allocated | One catalog row; durable operation state catalog_saved/stock_pending; no stock row/movement yet; audit matches actual RPC guarantee |
| T50 | Stock RPC commits; response lost; browser reload | Query/retry same stock ID | Canonical result recovered | Exactly one stock item, one opening movement, one completed operation/request; canonical stock ID same; no duplicate audit effect |
| T51 | Stock operation unresolved for catalog identity K; client generates new stock request ID | Submit new ID for same opening action | Reject OPERATION_UNRESOLVED or return explicit reconciliation requirement | No second stock item/opening movement; original operation ID/status preserved; no new accepted operation |
| T52 | Two sessions, distinct request IDs, same shop-normalized catalog identity/SKU | Concurrent catalog/stock creation | Unique constraint resolves; one canonical identity or explicit conflict | At most one catalog identity/stock identity/opening action; loser no partial duplicate rows; conflict audit/diagnostic only |
| T53 | Posted approval/audit row | Authenticated/service role attempts UPDATE/DELETE; correction attempted | Mutation denied; correction must be new append-only event | Original evidence unchanged; no deleted/updated audit; correction event references original and includes reason/actor; no ledger effect unless separately approved |
| T54 | Customer create-or-get operation C_ID; server creates customer but response lost | Retry same ID/payload; then retry with changed payload | Same payload returns canonical customer ID; changed payload rejects | Exactly one customer row and operation result; same shop ID; no duplicate/merge; no memo/Baki side effect unless separately invoked |
| T55 | Pending no-reference operation reaches expiry | Approve after expires_at | Reject expired operation | No ledger row; status expired or remains pending with expired flag as specified; expiry audit; balance unchanged |
| T56 | App/service/SECURITY DEFINER role attempts legacy row after migration; migration principal credentials revoked | Test role membership and insert/update | All non-break-glass paths reject | Trigger active; no legacy row changes; migration role absent from app membership; catalog/ACL evidence |
| T57 | Audit evidence created by due approval | Direct update/delete by authenticated, service role, RPC owner | Reject | Original audit/approval rows identical before/after; no financial effect; break-glass capability noted separately |
| T58 | Full function/trigger/ACL inventory after schema change | Catalog inspection and direct-write negative test for every overload | Only approved RPC signatures executable; all other writers denied/disabled | Inventory report contains function signature, owner, SECDEF, search_path, ACL, role flags, trigger writes; no unknown active writer |
| T59 | Test atomic financial RPC; inject failures after request claim, memo/ledger insert, stock update, audit insert, completion | Cause each failure within transaction | RPC fails and transaction rolls back | No committed partial ledger/memo/stock/audit/request claim; request can safely retry same ID only after rollback confirmed |
| T60 | Stock state persisted; reload after each transition (catalog_saved, stock_pending, stock_created, unknown) | Reload and recovery query | State and IDs reconstructed from server | No duplicate catalog/stock/movement; local cache may be absent without changing result |
| T61 | Catalog-only operation via approved catalog RPC; baseline direct catalog writes disabled | Create catalog-only | Success; no stock created | Catalog + operation state committed; catalog audit exists only because RPC guarantees it; no stock row/movement/quantity/valuation |
| T62 | Customer identity key is PO-approved; duplicate/conflicting customer candidate exists | Same-ID retry, different-ID same identity, conflicting details, cross-shop identity | Same ID returns canonical; conflicting details return review/conflict; no automatic merge | At most one row per approved shop identity key; no cross-shop merge; audit/operation state preserved |
| T63 | All function owners/roles, including service/function owner and migration role | Unauthorized direct function call/overload and role-membership escalation attempt | Denied; no privileged write except controlled break-glass | No financial/catalog/audit mutation; function owner and BYPASSRLS membership evidence captured |

### Retained R2/R2.1 tests that require revision

- T08/T09: same-ID vs different-ID payment races must include request-row→shop→customer lock order.
- T15: failure injection must cover request claim, business row, stock movement, audit and request completion.
- T16/T17/T35–T37: stock recovery is server-state based; client state is not authoritative.
- T18/T38/T61: catalog audit required only when all catalog writes are RPC-controlled; direct catalog write must be disabled for audit guarantee.
- T19/T20/T22/T39: legacy classification must be frozen post-migration and preserve amount/direction/shop/customer/IDs.
- T28/T29: no-reference due is pending first; approval then atomically posts. No financial ledger row exists at submit step.
- T33/T34/T46/T47: concurrency assertion must include both ledger aggregate and request/audit state.

## 15. Migration, recovery, rollback and scope exclusions

### 15.1 Migration path

- Fresh install: schema and RPC definitions must match target design.
- Baseline upgrade: forward-only migration from exact baseline; do not rewrite applied migration history.
- Preflight: invalid types, nulls, tenant mismatches, duplicate memo sources, ambiguous memo references, old processing requests, duplicate normalized references/identities, existing trigger/function dependencies and ACLs.
- Ambiguous rows remain legacy/unclassified; no fuzzy join or silent correction.
- Migration-only origin backfill runs under dedicated principal and ends with permanent guard.
- Validate row counts, IDs, direction, amount, customer/shop, dates, notes and balance before/after.
- Inspect indexes (validity), constraints, triggers, function owners and ACLs.
- Fresh install and baseline upgrade must converge to same effective schema/security state.

### 15.2 Interrupted migration

- Use transactional DDL where supported.
- Any nontransactional index creation must be a separately documented step with invalid-index detection and safe recovery.
- Do not blindly rerun a partially applied migration or use IF NOT EXISTS to hide an object-definition mismatch.
- Inspect migration history and actual catalog state; restore staging snapshot or apply reviewed forward repair.
- No financial writes during migration/backfill window.
- Rollback of schema is not equivalent to reversal of financial rows.

### 15.3 Rollback/recovery

- No production changes authorized.
- If migration fails before financial writes, stop and restore a verified staging snapshot or apply reviewed forward repair.
- If new financial entries exist, do not drop columns/indexes or delete ledger rows to “roll back”; use a reviewed forward correction or verified backup restore with explicit data-loss acknowledgment.
- If balance, tenant isolation, migration classification or idempotency is uncertain, stop financial writes and keep pilot NO-GO.
- Never auto-delete/merge financial entries or customer/inventory records.

### 15.4 Explicit exclusions

- No application implementation or SQL migration in this revision.
- No staging/production DB access or mutation.
- No merge or deployment.
- No payment-to-memo allocation/FIFO/LIFO/per-invoice settlement.
- No memo cancellation/reversal implementation.
- No automatic customer or inventory merge.
- No new post-migration legacy-origin creation/import.
- No break-glass direct financial write as normal operational path.

## 16. Residual risks, unresolved questions and runtime verification plan

### Residual risks

- Owner/superuser can disable triggers or alter schema; external governance is required.
- Manual due misclassification remains possible through altered/omitted reference or collusion; audit/approval reduces but does not eliminate risk.
- Shop-level serialization can reduce throughput; no performance claim without runtime profiling.
- Customer/inventory identity normalization can create false conflicts or allow variants depending on PO choices.
- Network timeout can leave client outcome unknown; server operation ID is the recovery anchor.
- Legacy balance includes historical entries whose original source may remain unknown.

### Implementation/runtime verification plan (not executed)

Before implementation approval, independent reviewers must confirm:

1. actual baseline columns/types/constraints/functions/overloads match this design;
2. fresh install and baseline upgrade converge;
3. trigger/ACL/role trust boundary works for authenticated, service, function-owner, migration and break-glass contexts;
4. every balance writer is enumerated and lock-compliant or disabled;
5. same-ID/different-ID concurrency and memo/manual due-payment races pass with independent sessions;
6. pending approval rejects self, forged, unauthorized, expired, altered and replayed approvals;
7. direct INSERT/UPDATE nullable-composite cases are enforced;
8. audit and legacy history cannot be mutated through ordinary/alternate paths;
9. browser reload and response-loss scenarios recover canonical catalog/stock/customer IDs;
10. no duplicate normalized stock/customer identity is created under concurrent distinct request IDs;
11. rollback is verified at every write boundary;
12. backup/restore drill and migration recovery pass on synthetic staging.

No runtime test is claimed as executed or passed.

## 17. Implementation approval state

- CH-4 R2/R2.1 QA decision: NEEDS REVISION, HIGH severity.
- R2.3 received CH-4 NEEDS REVISION / HIGH (PR #7). R2.4 is submitted for independent CH-1 and CH-4 review only.
- PO decisions listed in §13 remain pending.
- Implementation approval: **NOT GRANTED**.
- Financial pilot: **NO-GO**.
- Stop after R2.2 submission. No implementation work is authorized.


---

# R2.3 Addendum — CH-4 findings remediation

**R2.3 reviewed input:** R2.2 commit `abd9a784627fc366edc3b1cf2f651b9e3c8a2543`  
**Authority:** CH-1 accepted CH-4 PR #5 findings and assigned this design-only revision.  
**Implementation approval:** NOT GRANTED. **Financial pilot:** NO-GO.

> This addendum supersedes conflicting/incomplete R2.2 detail. Earlier R2.2 material is retained as revision history. Where policy or exact schema is unknown, this specification deliberately fails closed and leaves the decision pending.

## 18. R23-P0-01 — Complete provenance field matrix

### 18.1 Field vocabulary and immutable meaning

The ledger direction field `type` is `due` or `paid`; `origin` is `memo`, `manual`, or `legacy_unclassified`. Amount is positive magnitude; direction supplies accounting sign. These are structural conventions, not authorization.

The target ledger provenance columns are:

- `created_by_user_id`: authenticated actor who initiated the ledger-producing action.
- `approved_by_user_id`, `approved_at`, `approval_method`: no-reference due approval evidence only.
- `approval_operation_id`: durable pending operation which was approved; required only for no-reference manual due.
- `approval_payload_hash`: immutable server-computed hash of the exact canonical pending request.
- `manual_reference_raw`, `manual_reference_normalized`, `manual_reference_kind`: manual due reference fields.
- `reference_exception`, `reference_exception_reason_code`, `reference_exception_reason_text`, `independent_manual_due_confirmed`: no-reference exception controls.
- `source_memo_id`: memo-origin provenance; never caller-supplied as a substitute for actual memo relation.
- `legacy_source` / legacy import metadata (if approved in target schema): historical provenance only, not a trusted approval token.

The exact column names/types must be reconciled against the schema before implementation. This document does not authorize creating a migration.

### 18.2 Allowed origin/type truth table

| origin | type | Valid? | Source | Creator | Approver evidence | Manual reference | Exception fields | Hash/approval operation |
|---|---|---|---|---|---|---|---|---|
| memo | due | Yes | Required valid memo FK; shop/customer exact | Required for new RPC write | All NULL | All NULL | false; reason/confirmation NULL or non-applicable | NULL |
| memo | paid | No | Memo payment is not represented by memo-origin ledger row in this design | — | — | — | — | — |
| manual | due, referenced | Yes | No memo source | Required | All NULL | raw, normalized, kind NOT NULL | false; reason fields NULL; confirmation true server-validated | NULL |
| manual | due, no-reference approved | Yes, only via approval RPC | No memo source | Required | approver, timestamp, method, operation ID, hash all NOT NULL; creator != approver | raw/normalized NULL; kind = explicit no-reference sentinel only if PO approves | true; reason code/text NOT NULL; independent confirmation true | NOT NULL; exact durable operation/hash match |
| manual | due, no-reference pending | Ledger row forbidden | No ledger entry yet | pending creator required in operation table | approver fields NULL | NULL | reason/confirmation stored in pending operation | operation hash NOT NULL; ledger absent |
| manual | paid | Yes | No memo source | Required | All NULL | All NULL | false; no-reference reason/confirmation NULL | NULL |
| legacy_unclassified | due | Historical only | Preserve historical source values; no inferred memo FK | NULL if unavailable; preserve if known | All NULL; never synthesize approval | NULL unless explicitly historical raw data is preserved in a separate non-authoritative field | false/NULL; do not fabricate confirmation | NULL |
| legacy_unclassified | paid | Historical only | Preserve historical source values | NULL if unavailable; preserve if known | All NULL | NULL unless separately retained as historical raw data | false/NULL | NULL |
| any other origin/type | any | No | — | — | — | — | — | — |

**Important:** legacy rows may have absent provenance because the old system did not record it. They remain explicitly unknown. Never invent creator, approver, approval timestamp, approval method, reason code, reference kind, or payload hash to satisfy new constraints. If legacy rows have partial historical reference text, preserve it in a clearly marked historical field or source snapshot, not in a field that makes it appear newly verified.

### 18.3 Explicit NULL / NOT NULL field rules

| Field | memo/due | manual/due referenced | manual/due no-ref posted | manual/paid | legacy |
|---|---|---|---|---|---|
| creator | NOT NULL (new) | NOT NULL | NOT NULL | NOT NULL | NULL permitted only if historically unknown |
| approver | NULL | NULL | NOT NULL | NULL | NULL |
| approved_at | NULL | NULL | NOT NULL | NULL | NULL |
| approval_method | NULL | NULL | NOT NULL | NULL | NULL |
| approval_operation_id | NULL | NULL | NOT NULL | NULL | NULL |
| approval_payload_hash | NULL | NULL | NOT NULL | NULL | NULL |
| source_memo_id | NOT NULL | NULL | NULL | NULL | preserve old value if present; do not infer |
| reference_raw | NULL | NOT NULL | NULL | NULL | NULL unless historical raw evidence kept separately |
| reference_normalized | NULL | NOT NULL | NULL | NULL | NULL |
| reference_kind | NULL | NOT NULL | PO-approved no-ref enum/sentinel | NULL | NULL |
| reference_exception | false | false | true | false | false/unknown represented separately |
| exception reason code/text | NULL | NULL | NOT NULL | NULL | NULL |
| independent confirmation | not applicable/NULL | true | true | NULL | NULL |
| approval evidence | NULL | NULL | complete, server-validated | NULL | NULL |

**Historical exception:** If the schema currently has a NOT NULL constraint that cannot represent missing historical provenance, implementation must not invent values. Before implementation, CH-1/DBA must approve one of: nullable historical provenance; separate legacy provenance table; or an explicit unknown sentinel that cannot be interpreted as approval. This is PO/DBA-pending. No implementation until selected.

### 18.4 CHECK expressions and NULL semantics

PostgreSQL CHECK accepts a row when expression is TRUE **or NULL**. Therefore every nullable branch must be guarded with explicit `IS NULL`/`IS NOT NULL` predicates; a comparison such as `origin = 'manual' AND type = 'due' AND approved_by_user_id <> created_by_user_id` is not sufficient because NULL may propagate.

Design pattern (illustrative, not migration SQL):

- Structural checks use explicit boolean predicates and never rely on nullable comparisons.
- Branches are expressed as total predicates: required fields use `IS NOT NULL`; forbidden fields use `IS NULL`; enum/value tests use non-null columns or explicit null guards.
- All enum/type/origin columns are NOT NULL.
- For no-reference approval: `approved_by_user_id IS NOT NULL`, `approved_at IS NOT NULL`, `approval_method IS NOT NULL`, `approval_operation_id IS NOT NULL`, `approval_payload_hash IS NOT NULL`, `approved_by_user_id IS DISTINCT FROM created_by_user_id`.
- CHECK can enforce row shape, but cannot prove auth identity, membership, role, approval event existence, operation state, or server-computed hash. Those are RPC/ACL/transaction responsibilities.
- CHECK must not compare caller-provided identity fields and treat that as authorization.

### 18.5 Approval evidence binding and posting transaction

The approved operation table is authoritative. The final ledger row must reference exactly one durable operation by immutable operation ID, shop ID and operation type. The approval hash is computed from server-canonicalized payload, including customer, shop, amount, currency/unit semantics if applicable, reason code/text, confirmation and canonicalization version.

Atomic approval/post transaction:
1. Verify trusted actor context and accepted JWT subject.
2. Lock operation row; verify pending state, expiry, hash, creator/approver separation.
3. Lock shop, customer, then any inventory only if the operation truly needs inventory (manual due does not).
4. Lock/recheck membership/role row per §19 and confirm revocation has not won.
5. Recompute hash from stored canonical payload; compare to immutable submitted hash.
6. Insert ledger row with `approval_operation_id` and `approval_payload_hash`.
7. Insert append-only approval event containing same operation ID/hash and trusted approver.
8. Transition operation to posted and save canonical ledger ID/result.
9. Commit. If any step fails, transaction rolls back ledger, event and state transition together.

A direct insert or alternate writer cannot create a “valid-looking” no-reference due: browser/service roles have no direct insert permission; trigger validates required structural linkage; approval ledger insertion is exposed only through the approved posting RPC; RPC verifies authenticated actor, operation state, membership, hash and separation. Unknown writers are disabled. Owner/superuser remains a documented break-glass boundary.

### 18.6 Negative INSERT/UPDATE matrix — every provenance field

All tests below are **PROPOSED / NOT EXECUTED**. Run as independent synthetic sessions after implementation. For each case, expect SQLSTATE class 23 (constraint violation) or 42501 (permission denied), or documented RPC domain error; no partial ledger/audit/request effect.

| ID | Attempted mutation | Expected |
|---|---|---|
| PNV-01 | Set creator NULL on new memo/manual row | Reject |
| PNV-02 | Supply forged creator ID different from auth.uid() | RPC ignores/rejects; actor is trusted auth subject |
| PNV-03 | Set approver on referenced manual due | Reject |
| PNV-04 | Set approved_at on referenced due/payment/memo/legacy | Reject |
| PNV-05 | Set approval_method on non-exception row | Reject |
| PNV-06 | Set approval_operation_id on non-exception row | Reject |
| PNV-07 | Set approval_payload_hash on non-exception row | Reject |
| PNV-08 | No-ref row with approver NULL | Reject |
| PNV-09 | No-ref row with approved_at NULL | Reject |
| PNV-10 | No-ref row with approval_method NULL | Reject |
| PNV-11 | No-ref row with operation ID NULL | Reject |
| PNV-12 | No-ref row with payload hash NULL | Reject |
| PNV-13 | No-ref row with approver = creator | RPC rejects; DB structural check rejects if identities are present |
| PNV-14 | No-ref row with mismatched operation ID/shop/customer/amount | RPC rejects hash/link mismatch |
| PNV-15 | No-ref row with payload hash not equal canonical hash | RPC rejects |
| PNV-16 | Set source_memo_id on manual due/payment | Reject |
| PNV-17 | Set source_memo_id NULL on memo-origin due | Reject |
| PNV-18 | Set source_memo_id to memo in another shop/customer | FK/RPC reject |
| PNV-19 | Memo-origin paid row | Reject |
| PNV-20 | Manual referenced due with raw reference NULL | Reject |
| PNV-21 | Manual referenced due with normalized reference NULL | Reject |
| PNV-22 | Manual referenced due with kind NULL | Reject |
| PNV-23 | Manual referenced due with exception=true | Reject |
| PNV-24 | No-ref due with non-NULL raw/normalized reference | Reject unless policy explicitly allows retained display-only raw; default reject |
| PNV-25 | No-ref due with reason code/text NULL | Reject |
| PNV-26 | No-ref due with independent confirmation false/NULL | Reject |
| PNV-27 | Manual payment with any reference/exception/approval field set | Reject |
| PNV-28 | Legacy row with synthetic approver/approval timestamp/hash | Reject |
| PNV-29 | Legacy row missing historical creator/approver | Preserve as unknown; do not invent; only allowed via migration-approved representation |
| PNV-30 | UPDATE existing posted row creator/approver/approval/source/reference/hash | Deny; append-only correction path only |
| PNV-31 | UPDATE origin/type/amount/customer/shop/source on posted row | Deny |
| PNV-32 | NULL or unexpected non-NULL value for each reason/method/confirmation enum | Reject unless explicitly in approved enum |
| PNV-33 | CHECK expression input NULL in each nullable branch | Reject if branch requires field; prove no CHECK passes by NULL |
| PNV-34 | Direct INSERT from authenticated/service/alternate SECURITY DEFINER path | 42501 or trigger rejection; no ledger row |
| PNV-35 | UPDATE exception ledger to change operation/hash evidence | Deny; immutable evidence |

## 19. R23-P0-02 — Trusted identity and SECURITY DEFINER contract

### 19.1 Identity chain

1. **Client:** untrusted. May submit operation ID and business fields, never actor ID, role, approval timestamp, payload hash or authorization result as authoritative.
2. **Supabase/PostgREST:** request must carry valid JWT. For end-user RPC, JWT subject must be accepted by platform auth validation.
3. **Business actor:** derive from `auth.uid()` under supported Supabase context. Reject NULL subject for user-authorized action. Service-role/system operations use a separate explicit system actor model and cannot impersonate an end-user approval.
4. **Database execution context:** record/check `session_user`, `current_user` and SECURITY DEFINER owner only for execution diagnostics/trust controls. Neither DB role is the business actor.
5. **SECURITY DEFINER owner:** dedicated least-privilege NOLOGIN role (candidate name `dokantools_rpc_owner`), not postgres/table owner/superuser, not service_role, not migration principal, no BYPASSRLS and no migration-role membership. Exact role creation/feasibility is DBA approval pending.
6. **Membership:** read authoritative shop membership/owner table. The client cannot update membership/role; mutations require separately authorized admin RPC. Membership source and schema must be catalog-verified.
7. **Actor-role binding:** authenticated actor ID is the membership key. Role and active status are read from DB rows; caller-provided role is ignored.
8. **Creator/approver separation:** compare authenticated UUID subjects, not display names or DB roles.
9. **Role revocation:** approval and membership revocation serialize on the same membership row lock; whichever transaction acquires the row lock and commits first determines authority at approval linearization point.
10. **No impersonation:** function owner never becomes the business approver. Approval event stores auth.uid()-derived subject.

### 19.2 SECURITY DEFINER function contract (proposed)

For each approval-related RPC, catalog manifest must record: exact signature, owner role, SECURITY DEFINER status, fixed search_path, fully qualified relation/function references, ACL, execute grants and caller validation.

- Use a fixed minimal search_path (candidate `pg_catalog, public` only if reviewed; better schema-qualified references and a minimal dedicated trusted schema). No writable schema may precede trusted objects.
- Fully qualify tables, helper functions, operators where extension/operator resolution is relevant.
- Revoke EXECUTE from PUBLIC, anon and unintended roles.
- Grant EXECUTE only to authenticated role for user-facing RPC; service/system RPC separately scoped. Do not grant direct ledger table INSERT/UPDATE/DELETE.
- Owner is NOLOGIN, non-superuser, no BYPASSRLS, not table owner where avoidable, no membership in privileged roles.
- Every function overload is enumerated; a safe overload does not imply other overloads are safe.
- Function code checks `auth.uid()`, tenant membership, action-specific role and current status. RLS is defense-in-depth, not sole authorization.
- Trigger functions are invoker/definer reviewed separately; trigger owner and table owner must not be migration principal. Exact ownership strategy is DBA-pending.
- Function owner may INSERT approved rows only through constrained function; routine UPDATE/DELETE on audit/evidence tables is revoked. If PostgreSQL ownership mechanics require a privileged owner, the capability is explicitly documented and governed, not claimed impossible.

### 19.3 Membership mutation and revocation serialization

Global lock extension: membership/authorization row is acquired after the shop lock and before customer lock for approval; membership administration must acquire shop row first, then membership row, and never lock customer/inventory.

- Approval: operation `FOR UPDATE` → shop `FOR KEY SHARE`/approved shop lock mode → membership `FOR UPDATE` (or reviewed compatible mode) → customer `FOR UPDATE`.
- Revocation: shop row `FOR UPDATE` → target membership row `FOR UPDATE` → update active/role → commit.
- If approval obtains membership lock first and validates active role, revocation waits; approval may commit before revocation. If revocation commits first, approval sees inactive role and rejects. This is a defined linearization, not a promise that a previously opened screen retains authorization.
- Membership role-change and shop-owner transfer must use same serialization protocol.
- If a separate shop lock is unnecessary in a future optimized implementation, removal requires proof of equivalent serialization and QA approval; do not bypass the current order.

## 20. R23-P0-03 — Migration principal boundary

### 20.1 Role/credential model

- Dedicated migration principal should be NOLOGIN by default; if a runner requires login, use an ephemeral deployment credential with tightly scoped access, never shared with app/service/RPC owner.
- Role membership must be directional and minimal: migration operator/runner may `SET ROLE` to the dedicated migration role only during approved migration. Application roles, service_role, RPC owner, trigger owner, table owner, and other routine roles must not be members of migration role and must not inherit or SET ROLE into it.
- Migration role should be NOINHERIT where applicable; membership options `INHERIT`, `SET`, `ADMIN` must be explicitly inspected. No ADMIN OPTION outside tightly controlled DBA authority; no ADMIN OPTION to app/service roles.
- Do not grant migration role to function owner or any SECURITY DEFINER owner. Do not use a SECURITY DEFINER function owned by migration role.
- Ownership: migration role must not own production ledger table, schema, trigger function or application RPC. A separate DBA-controlled migration runner owns DDL changes. Default privileges must not silently grant future objects to migration role.
- Exact runner identity, CI/deployment identity and credential lifecycle are DBA/platform owner decisions, pending.

### 20.2 Temporary authorization activation/closure

Migration authorization is not a caller-set GUC or function parameter. It is based on DB role/credential/controlled deployment context and a reviewed migration transaction/phase.

1. Verify no app session can assume migration role.
2. Start approved maintenance window and disable financial writes.
3. Authenticate runner using approved migration credential; record runner, commit, migration ID and start timestamp externally.
4. Apply narrowly scoped backfill, validating source row IDs and invariants.
5. Verify row count, values, hashes and balance unchanged.
6. Close window, revoke/remove role memberships and ephemeral credential, set role NOLOGIN if it was temporarily LOGIN, and commit/verify permanent trigger.
7. Confirm ordinary roles and all SECURITY DEFINER owners cannot reach migration authority.
8. External audit record captures operator, approval, SQL migration hash, database target, start/end, outcome and exception.

### 20.3 Nested SECURITY DEFINER and role attacks

Permanent guard must not depend on a function that a nested SECURITY DEFINER chain can call under migration authority. No SECURITY DEFINER owner has migration membership; no function can accept arbitrary caller-set flag/GUC as authorization; no public helper can grant role/privilege. Trigger logic must inspect the effective trusted migration execution role only within approved migration context, and all ordinary SECURITY DEFINER paths must remain outside that context.

**Residual:** a PostgreSQL superuser or sufficiently privileged DBA/table owner can disable trigger, change owner/grants, or impersonate roles. Do not claim protection against superuser intervention. Use external privileged-access management, dual approval, platform audit and incident review.

### 20.4 Adversarial tests

- MIG-01: authenticated role attempts SET ROLE migration principal → denied.
- MIG-02: service_role attempts SET ROLE → denied.
- MIG-03: RPC owner attempts SET ROLE/inherited migration privilege → denied.
- MIG-04: ADMIN OPTION attempt to grant migration role to another role → denied.
- MIG-05: nested SECURITY DEFINER chain invokes backfill helper → denied.
- MIG-06: function owner attempts insert/update legacy row → trigger/ACL deny.
- MIG-07: ordinary app role calls migration helper during window → denied.
- MIG-08: after backfill, runner credential/role membership removed; migration origin insert/update fails.
- MIG-09: trigger disabled by simulated owner-level break-glass → classify as privileged boundary; external alert/audit expected, not ordinary-role protection.
- MIG-10: inspect pg_auth_members, role attributes, function owners, table/schema owners and default privileges; no unintended path exists.

All PROPOSED / NOT EXECUTED.

## 21. R23-P0-04 — Global lock graph and workflow transitions

### 21.1 Canonical hierarchy

Global ordering, unless independent operation explicitly terminates at a lower prefix:

`Operation/request key → Shop → Membership (if authorization mutation/check is serialized) → Customer → Catalog/Inventory identity rows in deterministic sorted order → Ledger/stock/audit inserts → operation completion`

Lock modes:
- operation row: `FOR UPDATE`; if absent, unique-key insert arbitration followed by re-read/lock.
- shop row: `FOR KEY SHARE` for stable tenant existence where safe; use `FOR UPDATE` when serializing global shop-level financial/membership changes. Exact mode must be tested against FK and competing writes.
- membership row: `FOR UPDATE` for approval/revocation serialization.
- customer row: `FOR UPDATE` for balance writers.
- inventory/catalog rows: `FOR UPDATE`, ordered by canonical UUID/key; unique constraints arbitrate creation.
- FK parent checks may acquire implicit key-share locks; implementation must account for them and avoid introducing reverse order.
- advisory locks only if keyed, documented and always acquired at corresponding hierarchy level. Unique-key arbitration preferred for identity/request uniqueness.

### 21.2 Workflow lock table

| Endpoint | Lock prefix and mode | Lower locks? | State/role serialization |
|---|---|---|---|
| Submit manual due | operation unique key/row → shop → membership → customer | Yes | Creator authorization; inserts pending operation only; no ledger balance write |
| Approve manual due | operation FOR UPDATE → shop FOR UPDATE/approved mode → membership FOR UPDATE → customer FOR UPDATE | Yes | Recheck role, expiry and pending status; ledger + audit + operation transition atomic |
| Cancel manual due | operation FOR UPDATE → shop → membership only if shop-owner override → customer only if required by invariant (otherwise no) | No balance change | Cancellation competes only on operation row; terminal transition winner |
| Expire/reject | operation FOR UPDATE → shop/membership only if actor-authorized rejection | No customer lock | Expiry worker uses server time; no ledger writes; transition state atomically |
| Recover/query operation | operation row read (MVCC; no write lock); shop membership read | No | Same operation ID; authorized tenant-scoped lookup |
| Memo transaction | operation claim → shop → customer (if due/payment balance affected) → sorted inventory rows → memo/ledger/stock/audit writes → operation completion | Yes | Atomic request; due writer and stock updates must follow same hierarchy |
| Customer payment | operation claim → shop → membership/role if required → customer FOR UPDATE | Yes | Recompute aggregate due/paid under lock; same ID idempotent; different IDs serialize customer balance |
| Customer create-or-get | operation unique key → shop → customer identity unique-key arbitration | No ledger | No customer balance lock needed; unique shop-scoped identity and conflict/review policy |
| Catalog create/update | catalog operation key → shop → catalog identity unique arbitration → catalog row | No stock lock unless stock transition follows | Catalog identity update is versioned; catalog audit/state atomic in approved RPC |
| Stock create/opening | stock operation key → shop → catalog identity → stock item identity → opening action unique key → inventory | Yes | Opening movement is exactly once per business action |
| Stock adjustment/restock | operation key → shop → catalog/stock item FOR UPDATE → movement insert | No customer | Restock uses unique movement ID; never reuses opening action |
| Legacy reconciliation | reconciliation operation → shop → customer rows sorted → affected ledger rows sorted | Yes | Migration classification itself must not alter balances; reconciliation financial changes are out-of-scope and disabled |
| Future balance writer | request key → shop → membership (if auth) → customer → affected rows | Yes | Must be reviewed/added to writer inventory before activation |

**Prefix rule:** a workflow that ends at operation/shop (e.g. cancel) must not later acquire customer/inventory locks in a separate continuation after commit. If it needs a lower lock, it must acquire it in the original ordered transaction. Recovery/query uses read-only MVCC and does not mutate business state.

### 21.3 Deadlock and retry protocol

- No workflow may acquire customer then shop, inventory then customer, or membership then shop.
- Multiple customers/items are locked in ascending stable UUID order.
- A request claim row is inserted/locked before shop lock. If claim already exists, same payload returns canonical status; changed payload/type rejects.
- Concurrent distinct IDs for same customer serialize on customer lock; distinct IDs for same product serialize on unique identity/opening-action constraints.
- Approval, cancellation and expiry all lock the same operation row first.
- Role revocation follows shop→membership order; approval follows operation→shop→membership→customer.
- Retry only known transient SQLSTATEs (e.g. deadlock/serialization) with bounded exponential backoff and same request ID/payload; do not automatically retry domain/constraint/authorization errors.
- If transaction outcome is unknown due to connection loss, query/retry same operation ID; never generate a new ID for a potentially committed write.
- Deadlock/serialization retry returns canonical idempotent outcome. Retry exhaustion yields “outcome unknown; reconcile operation” and no new business ID.
- The complete graph must be re-audited whenever new triggers, FK cascades, RPCs or balance writers are introduced.

## 22. R23-P0-05 — Durable catalog/stock business identity

### 22.1 Identity model and unresolved policy

Product identity/variant rules remain PO-06 and PO-10 pending. Do not treat normalized name as universally unique and do not auto-merge.

Candidate design, subject to PO approval:
- Catalog identity: immutable internal `catalog_item_id`; unique identity key scoped by shop and approved identity namespace.
- Stock identity: `stock_item_id` linked to catalog identity; inventory state is not a separate duplicate product definition.
- Catalog operation: `catalog_operation_id` unique by shop/operation type; canonical payload hash.
- Stock operation: `stock_operation_id` unique by shop/operation type; canonical payload hash.
- Opening stock business action: stable `opening_action_id` unique per catalog/stock identity (or approved stock identity) independent of request ID.
- Restock movement: distinct `movement_operation_id` unique per shop/action; movement type `restock`, never `opening`.
- Unresolved operation identity: unique operation row for business action + identity key, with status `catalog_saved`, `stock_pending`, `stock_created`, `stock_failed_confirmed`, or `stock_result_unknown`.

Server-enforced uniqueness required (names illustrative):
- unique(shop_id, operation_type, operation_id);
- unique(shop_id, catalog_identity_namespace, approved_identity_key) for catalog identity;
- unique(catalog_item_id) on stock identity if PO chooses one-stock-record-per-catalog item;
- unique(catalog_item_id, opening_action_id) or unique(shop_id, opening_action_id);
- unique(shop_id, movement_operation_id);
- unique(shop_id, stock_operation_id);
- unique(shop_id, unresolved_business_action_key) where active unresolved states block duplicate creation.

Exact columns/index predicates are PO/DBA-pending. Unique constraints are required; application “check then insert” is insufficient.

### 22.2 Identity, versions and concurrency

- Same operation ID + same canonical payload → return canonical operation/result.
- Same ID + changed payload/type → reject payload mismatch.
- Different IDs + same approved business identity → unique conflict; return canonical existing item only if PO-approved create-or-get semantics, otherwise return conflict requiring user selection.
- Concurrent different IDs must not create duplicate catalog identity, stock identity or opening movement.
- Catalog identity update must be a versioned operation. If stock creation is unresolved, block identity change or require a reconciliation decision; do not mutate identity key underneath pending operation.
- Barcode/SKU uniqueness scope (shop-wide, variant-wide, nullable/blank handling), package/unit, brand, size, color and variants are PO-pending. A barcode may be shared only if explicitly allowed by PO policy; do not assume.
- Empty/whitespace SKU/barcode should normalize to NULL, not a shared empty string.
- Distinct legitimate variants must remain distinct; identity collision is surfaced, never auto-merged.
- Catalog-only item has catalog identity but no stock record/movement/quantity. Stocked item references catalog identity and has stock state.
- Opening stock is a one-time initial action. New request ID cannot repeat opening stock for same business identity.
- Restocking is a separate movement with distinct ID, quantity and audit; it may occur repeatedly according to policy.
- Browser reload or response loss queries server by operation ID/business action; local storage/UI state is non-authoritative.
- A stock failure may be labelled failed only when rollback/absence of commit is proven. Ambiguous network result remains `stock_result_unknown`, blocking new opening-stock ID until reconciliation.

### 22.3 Recovery state machine

`catalog_saved → stock_pending → stock_created`

Other allowed branches:
- `catalog_saved → catalog_only` only by explicit catalog-only action/policy.
- `stock_pending → stock_failed_confirmed` only if no stock/opening movement committed.
- `stock_pending → stock_result_unknown` on ambiguous result.
- `stock_result_unknown → stock_created` after canonical query confirms commit.
- `stock_result_unknown → stock_failed_confirmed` only after verified absence and operation reconciliation.
- no new operation ID may supersede unresolved stock action.
- `stock_failed_confirmed` retry reuses the same stock operation/action identity unless a reviewed business correction creates a new action.

Catalog row, operation state and audit event commit atomically for catalog RPC. Stock item, opening movement, stock operation result and audit event commit atomically for stock RPC. If direct catalog writes remain enabled, do not claim full catalog audit coverage; preferred design is revoke direct writes.

## 23. R23-P1 — Adversarial concurrency and write-path tests

All cases **PROPOSED / NOT EXECUTED**. Concurrent cases require two independent DB sessions and deterministic barriers.

| Test ID | Sessions / setup | Schedule/action | Expected SQLSTATE/RPC | Final ledger/stock/audit/rollback |
|---|---|---|---|---|
| ADV-01 | A1 creator submits pending O; A2 approver has role | A2 locks membership; concurrently revoke role in B | One linearized result: approval commits before revocation OR revocation commits first and approval denies | Exactly one outcome; no stale-role post; membership/approval audit reflects order |
| ADV-02 | O pending; sessions approve vs cancel | Both lock O concurrently | One terminal state wins; loser returns already-terminal/conflict | 0 or 1 ledger rows, never duplicate; audit exactly matches winner |
| ADV-03 | O pending with expiry boundary; approve vs expire worker | Both lock O | posted or expired, never both; SQLSTATE/domain result consistent | If posted, one ledger/event; if expired, none; status terminal |
| ADV-04 | Customer has aggregate due; approval due vs payment | Independent sessions follow O→shop→membership→customer | Payment succeeds only if balance invariant permits after serialization | Final balance correct, no overpayment unless PO policy permits; audit order serial |
| ADV-05 | Memo due writer vs no-ref approval for same customer | Concurrent transactions | Customer lock serializes | Both may post if no policy cap; aggregate exact; no partial writes |
| ADV-06 | Approval and membership revocation, with diagnostic lock timeout | Execute order inversion intentionally in negative test | Deadlock detector/lock timeout catches unsafe inversion; correct implementation must not deadlock | No partial transaction; retry bounded; membership/ledger state valid |
| ADV-07 | App/service/RPC owner roles; migration principal NOLOGIN | Attempt SET ROLE, inherited privilege, ADMIN OPTION, nested definer call | 42501/permission denied | No legacy mutation; role catalog confirms no authority |
| ADV-08 | Authenticated/service/function owner attempts UPDATE/DELETE audit evidence | Direct and via helper RPC | 42501 or append-only trigger rejection | Original evidence unchanged; no financial effect |
| ADV-09 | For every provenance field, insert valid baseline then set forbidden non-NULL or NULL | Direct INSERT and UPDATE field-by-field | 23514/23503/42501 or documented RPC rejection | No invalid row; no partial audit/ledger; see PNV-01..35 |
| ADV-10 | Stock create sessions use different operation IDs but same approved identity | Race catalog/stock creation | Unique violation/conflict; one canonical identity only | One catalog identity/stock identity/opening movement; loser no partial rows |
| ADV-11 | Distinct variants share name but have differing PO-approved variant keys | Concurrent create | Both distinct if approved identity keys differ; conflict if same key | No auto-merge; rows/keys reflect PO policy |
| ADV-12 | Opening movement committed; client response lost; new request ID attempts same opening | Query/retry | Reject duplicate business action / return canonical opening result | One opening movement, no duplicate quantity; audit remains one action |
| ADV-13 | Stock pending; catalog identity update attempted | Update identity in independent session | Reject/defer while unresolved | Operation remains unresolved; no changed key or duplicate stock |
| ADV-14 | Customer create operations C1/C2 different IDs and conflicting phone/name data | Concurrent create-or-get | Unique key arbitration; conflict/review result, not silent merge | No unintended duplicate under PO-approved key; no cross-shop merge; audit records conflict |
| ADV-15 | Failure injection after ledger, approval audit, request completion, stock movement | Raise exception before commit at each step | Transaction error | No partial commits; exact pre-state restored; same-ID retry safe only after rollback confirmed |

Evidence must include session IDs, operation IDs, payload hashes, request schedule, RPC response/SQLSTATE, committed rows, before/after balances and stock quantity, audit IDs, and rollback verification. Synthetic data only.

## 24. P1 audit and catalog write paths

- Application/authenticated/service roles have no routine UPDATE/DELETE on approval/audit tables.
- Audit/approval event insert is available only through reviewed RPCs; trigger enforces append-only against ordinary roles.
- Function owner does not have routine UPDATE/DELETE on audit/evidence rows. If it owns a table or can bypass trigger, treat as privileged residual capability and change ownership/ACL or explicitly obtain DBA exception; do not claim “function owner cannot mutate” without catalog proof.
- Corrections are new events with actor, reason, timestamp and reference to prior event. Do not edit historical event.
- Direct catalog INSERT/UPDATE/DELETE is revoked if RPC audit coverage is claimed. Catalog create/update, operation-state update and audit event must commit atomically.
- Break-glass changes require dual authorization, ticket/change ID, time-limited privilege, external logging and post-action review. DB internal audit alone is insufficient if privileged operator can alter it.

## 25. Customer create-or-get clarification

- Operation ID stable and scoped by shop + operation type.
- Canonical payload includes identity candidate fields and a canonicalization version; hash is server-generated.
- Same ID/same payload returns existing canonical customer ID and original operation outcome.
- Same ID/changed payload rejects.
- Different IDs with conflicting candidate identity must not silently merge. If a PO-approved identity unique constraint detects collision, return `CUSTOMER_IDENTITY_CONFLICT` with safe existing-record selection/review flow.
- Customer identity fields/key and normalization are PO-07 pending. No default phone-only or phone+name key is approved by this design.
- A customer create may remain committed if a later memo/Baki operation fails, because it is a distinct non-financial operation; UI must show it as a separate durable result and not imply memo/payment success.
- Cross-shop customer identity never merges; all identity uniqueness is shop-scoped unless explicitly approved otherwise.

## 26. PO decisions — fail-closed modules and explicit status

| PO | Options | Suggested default (not approved) | Impact / blocked module | Status |
|---|---|---|---|---|
| PO-01 approval authority | owner-only; owner+delegated manager; approved member role | owner-only if role model absent | No-reference due submit may remain pending; posting RPC disabled until role approved | PENDING |
| PO-02 expiry | short fixed TTL; configurable TTL; no expiry | short server TTL | approval UX and worker; cannot revive expired operation | PENDING |
| PO-03 reference uniqueness | customer-scoped; shop-global by kind; cross-kind conflict policy | customer-scoped with selected global kinds; cross-kind review | reference index and duplicate validation blocked | PENDING |
| PO-04 aggregate payments | customer aggregate; memo allocation; overpay allowed/rejected | aggregate customer ledger; reject overpayment unless approved | payment validation and balance display blocked pending policy | PENDING |
| PO-05 legacy display/balance | include/exclude legacy in total; separate historical total | preserve rows and clearly label unknown origin; default balance semantics need PO | dashboard/customer balance display blocked | PENDING |
| PO-06 inventory identity | SKU/barcode; normalized name+variant; manual key | explicit shop-scoped key with variant attributes | catalog/stock uniqueness indexes and create UX blocked | PENDING |
| PO-07 customer key | phone; phone+name; other key; no dedupe | PO-defined shop-scoped identity | customer create-or-get unique key blocked | PENDING |
| PO-08 second actor/manager | owner-only; delegated manager; distinct member | owner-only until roles approved | membership schema/approval ACL blocked | PENDING |
| PO-09 no-reference thresholds/reasons | no cap; amount cap; daily cap; required reason list | mandatory reason + independent approval; no cap chosen | thresholds/reason enum remain unset; implementation blocked | PENDING |
| PO-10 catalog-only/stocked | same identity; separate entities | same catalog identity, stock is separate state | catalog-stock linkage/index blocked | PENDING |

No option is approved by CH-3. A suggested default is explicitly not an authorization. If PO decisions are absent, dependent writes remain disabled/fail-closed.

## 27. Corrected F22-01 through F22-11 traceability — R2.4

**Source:** Complete CH-4 R2.2 QA report in PR #5 and corrected R2.3 QA report in PR #7. This replaces the incorrect provisional R2.3 §27. Actual finding labels are used; no identities inferred.

| Finding | Actual CH-4 finding | R2.3 response | R2.4 correction | Sections/tests | Status |
|---|---|---|---|---|---|
| F22-01 | CHECK did not define complete approval-field matrix | §§18.2–18.6; PNV-01–35 incomplete | Total field/state matrix and explicit NULL/NOT NULL/ENUM; CHECK NULL semantics closed | §§31; PNV-01–35; T45 | Addressed design; runtime unverified |
| F22-02 | Trusted DB identity contract for two-step approval | §19 auth.uid/SECDEF/membership | Same-transaction auth subject, membership and approval check; DB execution identity distinct | §§19,32; T28–29,T40–43,T63,ADV-01/07 | Partially addressed; DBA/runtime unverified |
| F22-03 | Migration guard role membership/ownership closure | §20 role/trust model | Full fail-safe handoff state machine and recovery | §§20,33; T44/T56/T63,MIG-01–10 | Addressed design; runtime unverified |
| F22-04 | Composite FK sound but CHECK/nullability incomplete | §18; legacy source contradiction | Legacy source_memo_id NULL unless proven; separate candidate metadata; wrong-shop/customer tests split | §§18,30–31,34; PNV-16–19/29/33/34,T45,LEG-01–08 | Addressed design; runtime unverified |
| F22-05 | Global lock order needs workflow lock graph | §21; lock mode unresolved | Exact lock purposes/modes/endpoints; customer mutex; deterministic schedules | §§21,35; T08/T09/T33/T34/T46/T47,ADV-01–06,LOCK-01–10 | Addressed design; runtime unverified |
| F22-06 | Atomic financial idempotency vs durable pending workflows | R2.2 §8 retained; R2.3 scattered | Atomic request claim remains transaction-local; durable workflows distinct; versioned replay/recovery | §§8,22,36; T02/T03/T09/T11/T15–17/T35–37/T49–60,IDEM-01–08 | Addressed design; runtime unverified |
| F22-07 | Catalog/stock recovery and identity closure | §22 | Server opening-action ID, restock distinction, recovery listing, versioned identity | §§22,37; T16–18/T35–38/T49–52/T60–61,CAT-01–10,ADV-10–13 | Partially addressed; PO-06/10 pending |
| F22-08 | Catalog audit boundary/direct catalog write paths | §22.3/§24 | Audit guarantee only if direct writes revoked and RPC atomic | §§24,37; T18/T38/T58/T61/T63 | Addressed design; ACL runtime unverified |
| F22-09 | Customer create-or-get recovery and duplicate identity | §25/ADV-14 | Full same-ID replay, distinct-ID collision and local-state-loss recovery | §§25,36,38; T54/T62,ADV-14,CUST-01–05 | Partially addressed; PO-07 pending |
| F22-10 | Audit immutability, privileged owner and append-only correction | §24/ADV-08 | Ordinary vs function/table owner vs superuser boundary and external break-glass | §§11,24,39; T53/T57/T63,ADV-08,AUD-01–05 | Addressed design; runtime/DBA unverified |
| F22-11 | PO decisions and fail-closed feature dependencies | §26/§29 | Explicit PO gate dependencies; no default is approval | §§26,40; PO gate checks | PO-pending; governance addressed |

## 28. R2.4 revision history and source authority

- R2.2 independent report: PR #5; exact report authored at commit 75b3b1ec5d61a14f6222b01d60b869f08678e819.
- R2.3 independent report: PR #7; reviewed R2.3 head 18fbb6aca6919e39bacca9f889b8a02573d9fd97.
- PR #7's actual corrected F22 mapping is adopted above. R2.3's provisional §27 mapping is superseded.
- R2.4 is a documentation-only amendment. R2.3 remains unchanged for review history.

## 28A. R2.3 retained test coverage note (superseded by R2.4 §§38–40)

- T01–T39 from R2.2 are retained; semantics are superseded where this R2.3 addendum changes provenance, trusted identity, migration-role boundary, lock ordering, catalog/stock identity or audit restrictions.
- T40–T63 retained from R2.2; revised by R2.3 matrix/negative provenance cases.
- PNV-01–35 add per-field direct INSERT/UPDATE negative tests.
- MIG-01–10 add migration-role adversarial coverage.
- ADV-01–15 add two-session concurrency, role revocation, approval/cancel/expiry, payment/memo races, audit mutation, stock identity/opening duplicate, customer collision and failure injection.
- Every test remains **PROPOSED / NOT EXECUTED**. No test has passed in PostgreSQL, Supabase, browser, staging or production.
- The legacy R2.2 T01–T63 cases do not yet all carry complete row-by-row expected values in this design file. The runtime test harness specification must expand them to the required per-test evidence format before implementation authorization. This is a remaining documentation gap, not a claimed completion.

## 29A. R2.3 prior approval gate (superseded by R2.4 §43)

Required before implementation:
1. CH-1 review of R2.3 and resolution of design comments.
2. CH-4 independent QA approval of R2.3, including exact F22-01–F22-11 mapping.
3. PO approvals PO-01 through PO-10, including identity/role/payment policies.
4. DBA/security approval of exact schema, role ownership, ACL, SECURITY DEFINER and migration trust boundaries.
5. Completion of T01–T63 detailed test specifications and approved synthetic staging acceptance plan.
6. Implementation authorization explicitly granted by CH-1.

Until all gates are satisfied:
- no application code or SQL migration;
- no database/staging/production access or mutation;
- no merge/deployment;
- no financial pilot;
- no runtime PASS claim.

**Implementation approval remains NOT GRANTED. Financial pilot remains NO-GO. Stop after R2.3 draft PR submission.**



## R2.4 consolidated correction sections

## 29. Legacy source memo semantics: authoritative FK vs candidate metadata

### Normative rule
For legacy_unclassified rows, enforced source_memo_id MUST be NULL unless a memo relationship is positively proven by an approved deterministic process and separately approved reclassification. Unverified historical memo hints never participate in the composite FK and never cause automatic origin reclassification. Short UUID prefixes, amount/date similarity, note text or fuzzy matching are not proof.

### Candidate metadata table (design-only)
Preferred table: legacy_ledger_source_candidates:
- candidate_id UUID PK; ledger_entry_id FK; shop_id; source_hint_kind enum; source_hint_raw (exact original); candidate_memo_id UUID nullable WITHOUT memo FK; verification_status enum (unverified/verified/rejected); evidence_kind/digest; created_at/created_by; review timestamp/actor/ticket/reason; supersedes_candidate_id.
- candidate_memo_id intentionally has no memo FK because candidate data may be wrong, nonexistent, deleted or cross-tenant. It is not authoritative.
- Ordinary auth/service roles have no INSERT/UPDATE/DELETE. Migration role may insert only during approved window. Post-migration corrections append a new record with supersedes pointer; original stays immutable.
- Shop-scoped sanitized read only if PO/UI permits; no candidate hint can affect balance, FK, memo label or accounting.
- Verified candidate metadata does not itself change ledger origin. Reclassification is out of M0-01 and requires separately approved deterministic migration/accounting review.

### Existing historical source_memo_id migration
1. Snapshot row IDs, old values, ledger data and balance.
2. For every legacy row with old source_memo_id, preserve exact value as unverified candidate metadata.
3. Set enforced source_memo_id=NULL for legacy rows.
4. Do not alter amount/type/shop/customer/date/note or origin.
5. Record counts, hashes, source hints moved, source column nulled and exceptions.
6. If mismatch/failure, writers remain disabled; no blind retry.

### LEG-01–08
LEG-01 auth INSERT legacy with source_memo_id → deny; no ledger/candidate write.
LEG-02 auth UPDATE legacy source_memo_id → deny.
LEG-03 service/alternate SECDEF attempts same → deny.
LEG-04 migration fixture with prior source ID → source_memo_id NULL; candidate preserved/unverified; balance identical.
LEG-05 candidate points wrong shop/customer/nonexistent memo → candidate remains non-authoritative, no enforced FK; no reclassification.
LEG-06 auth edits candidate value/status → 42501/append-only rejection.
LEG-07 candidate correction appends superseding record; prior row digest unchanged.
LEG-08 verified candidate alone does not change origin; origin remains legacy.

## 30. Total provenance and CHECK matrix

### 30.1 Persisted field vocabulary
creator_id=created_by_user_id; approver_id=approved_by_user_id; approved_at; approval_method; approval_operation_id; approval_payload_hash; canonicalization_version; hash_algorithm; reference_raw; reference_normalized; reference_kind; reference_exception; exception_reason_code/text; independent_confirmation; independent_confirmation_at; source_memo_id; legacy_candidate_metadata; legacy_import_batch_id; legacy_snapshot_digest. Actual schema names/types require DBA reconciliation.

### 30.2 Pending operation (not a ledger row)
creator_id NN (trusted auth subject); approver_id NULL; approved_at NULL; approval_method NULL; approval_operation_id NN; hash NN (server SHA-256); canonicalization_version NN; hash_algorithm=sha256; reference raw/normalized NULL; reference_kind approved no-reference enum; exception TRUE; reason code/text NN; independent_confirmation TRUE; confirmation timestamp server NN; source_memo_id NULL; legacy fields NULL; status pending_approval; ledger_entry_id NULL. Pending submit has zero ledger/balance effect.

### 30.3 Ledger total matrix
Legend: NN=NOT NULL; NULL=must be NULL; ENUM=approved enum; HIST=preserve historical value only if evidenced, otherwise unknown/NULL via approved legacy representation.

| origin/type/state | creator | approver | approved_at | method | approval_operation_id | hash | canon version | ref raw/norm/kind | exception | reason | confirmation/time | source_memo_id | legacy fields |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| manual/due/referenced posted | NN | NULL | NULL | NULL | NULL | NULL | NULL | raw NN, norm NN, kind ENUM NN | false | NULL | confirmation NN; timestamp per approved schema | NULL | NULL |
| manual/due/no-ref pending | operation only; no ledger row | N/A | N/A | N/A | NN | NN | NN | raw/norm NULL; kind no-ref ENUM | true | NN | true + server timestamp NN | NULL | NULL |
| manual/due/no-ref posted | NN | NN | NN | ENUM NN | NN | NN | NN | raw/norm NULL; kind no-ref ENUM | true NN | NN | true NN + timestamp NN | NULL | NULL |
| manual/due/no-ref cancelled/expired/rejected | operation only; no ledger row | operation history only | operation history only | operation history | NN | NN | NN | NULL/no-ref ENUM | true | NN | true + timestamp | NULL | NULL |
| manual/paid posted | NN | NULL | NULL | NULL | NULL | NULL | NULL | all NULL | false NN | NULL | NULL | NULL | NULL |
| memo/due posted | NN for new write | NULL | NULL | NULL | NULL | NULL | NULL | all NULL | false NN | NULL | N/A/NULL | NN exact memo FK | NULL |
| memo/paid | PROHIBITED | — | — | — | — | — | — | — | — | — | — | — | — |
| legacy/due historical | HIST | NULL | NULL | NULL | NULL | NULL | NULL | NULL unless separate historical field | false/approved unknown representation | NULL | NULL unless evidenced | NULL unless approved proof/reclassification | candidate may be unverified |
| legacy/paid historical | HIST | NULL | NULL | NULL | NULL | NULL | NULL | NULL unless separate historical field | false/approved unknown representation | NULL | NULL unless evidenced | NULL unless approved proof/reclassification | candidate may be unverified |
| other origin/type/state | prohibited | — | — | — | — | — | — | — | — | — | — | — | — |

No fake creator/approver UUID, approval time, hash, method or memo source may be fabricated for legacy rows. If baseline NOT NULL constraints cannot represent unknown history, implementation is blocked pending DBA choice: nullable historical provenance, separate legacy table, or explicit unknown sentinel that cannot be interpreted as approval.

### 30.4 PostgreSQL CHECK NULL semantics
CHECK accepts TRUE or NULL. Every valid branch must explicitly guard nullable fields with IS NULL/IS NOT NULL and approved enum checks so predicate is total TRUE/FALSE. origin/type/exception boolean NOT NULL. CHECK does not validate auth.uid, membership, operation status, expiry, hash recomputation, amount equality or event existence; these are server-side RPC/transaction invariants. approver IS DISTINCT FROM creator is only structural, not authorization.

### 30.5 PNV-01–35 detailed negative test inventory
Common fixture: synthetic S_A/C_A1/M_A1; creator U_A, separate approved U_M; cross-shop S_B/C_B1/M_B1. Fresh operation per test. Capture JWT subject (not token), session_user/current_user/function owner, SQLSTATE/domain code, before/after ledger/operation/audit/balance. All proposed/not executed.

| ID | mutation | actor/path | expected | after-state |
|---|---|---|---|---|
| PNV-01 | creator NULL on new ledger | auth RPC/direct | reject 23502/23514/RPC | no row; historical legacy NULL only migration fixture |
| PNV-02 | creator set to U_M while auth subject U_A | auth RPC | ignore/reject caller actor | no forged actor |
| PNV-03 | approver set on referenced due | auth direct | reject | no row |
| PNV-04 | approved_at set on nonexception row | auth direct | reject | no row |
| PNV-05 | method set on nonexception row | auth direct | reject | no row |
| PNV-06 | approval operation ID set on nonexception row | auth direct | reject | no row |
| PNV-07 | hash set on nonexception row | auth direct | reject | no row |
| PNV-08 | no-ref posted row approver NULL | approve RPC/direct | reject | pending/no ledger |
| PNV-09 | no-ref posted row approved_at NULL | approve RPC/direct | reject | no ledger |
| PNV-10 | no-ref method NULL | approve RPC/direct | reject | no ledger |
| PNV-11 | no-ref operation ID NULL | approve RPC/direct | reject | no ledger |
| PNV-12 | no-ref hash NULL | approve RPC/direct | reject | no ledger |
| PNV-13 | creator=approver both non-NULL | auth subject U_A | RPC rejects self; CHECK only shape | no post |
| PNV-14 | same operation ID but wrong type/shop/customer/amount | auth U_M | reject operation/payload mismatch | original immutable |
| PNV-15 | supplied/stored hash != recomputed canonical hash | auth U_M | reject | no post |
| PNV-16 | manual due/payment source memo non-NULL | auth/direct | CHECK/FK reject | no row |
| PNV-17 | memo due source memo NULL | memo RPC/direct | reject | full memo txn rollback |
| PNV-18a | source memo wrong shop | auth/direct | FK/RPC reject 23503 | no cross-shop row |
| PNV-18b | memo same shop but wrong customer | auth/direct | composite FK/RPC reject | no row |
| PNV-19 | memo origin + paid direction | direct/RPC | reject | no row |
| PNV-20 | referenced due raw reference NULL | auth | reject | no row |
| PNV-21 | referenced due normalized reference NULL | auth | reject | no row |
| PNV-22 | referenced due kind NULL | auth | reject | no row |
| PNV-23 | referenced due exception=true | auth | reject | no row |
| PNV-24 | no-ref due raw/norm unexpectedly non-NULL | auth | reject by current policy | no row |
| PNV-25 | no-ref reason code/text NULL | auth | reject | pending/no post |
| PNV-26 | independent confirmation false/NULL/timestamp NULL | auth | reject | no post |
| PNV-27 | manual payment with reference/exception/approval fields | auth | reject each independently | no paid row |
| PNV-28 | legacy row synthetic approver/time/method/hash | migration fixture/direct | reject | no false approval |
| PNV-29 | legacy creator missing; ordinary app tries placeholder/NULL update | app vs migration context | app update denied; historical unknown preserved | no fabrication |
| PNV-30 | update each posted provenance field individually | auth/service/SECDEF | 42501/trigger deny | row digest unchanged |
| PNV-31 | update origin/type/amount/customer/shop/source individually | auth/service | deny | ledger/balance unchanged |
| PNV-32 | NULL/unknown reason/method/ref-kind/confirmation enum | direct/RPC | reject unless matrix branch permits NULL | no invalid row |
| PNV-33 | force NULL in each nullable CHECK operand/branch | direct SQL | reject if required; allow only matrix-defined NULL | prove no accidental NULL-pass |
| PNV-34 | direct insert via auth/service/function owner/table owner/import/nested SECDEF | each session | deny ordinary paths; owner is privileged boundary | no mutation except isolated break-glass fixture |
| PNV-35 | update no-ref operation/hash/linkage individually direct/alternate SECDEF | auth/service/SECDEF | deny | original evidence unchanged |

## 31. Approval operation-to-ledger linkage, payload and replay

- Operation unique key: (shop_id, operation_type, operation_id); operation_type immutable no-reference manual due.
- Ledger linkage columns: shop_id, approval_operation_type, approval_operation_id. Composite FK to operation's unique (shop_id, operation_type, operation_id).
- Partial unique ledger index on (shop_id, approval_operation_type, approval_operation_id) for posted manual/due/reference_exception=true, guaranteeing at most one ledger row per operation.
- Pending/cancelled/expired/rejected operation has zero ledger rows; posted has exactly one. Ledger result ID is stored in operation in same transaction; FK back from operation may be deferred/optional but transaction invariant validates exact row.
- Bound payload: shop, operation type/id, creator subject, customer, amount, due/manual, exception=true, reason code/text, confirmation, canonicalization version. Status/approver/result are excluded from immutable request payload.
- SHA-256 over canonical JSON v1: UTF-8, deterministic key order, UUID lowercase canonical, decimal amount string exact, UTC RFC3339 timestamps, NFKC on approved text, explicit null vs absent, no binary float. Hash algorithm and canonicalization version stored.
- Server computes at submit, stores canonical payload and digest immutable. Approval recomputes using stored version and verifies payload columns; client hash ignored.
- Version upgrade: existing operation retries use stored canonicalization version; new requests use current version. Never silently rehash old operation. Same ID + changed payload/type/shop/customer/amount/version rejects.
- Replay pending returns same pending ID; posted returns same canonical ledger ID/result and no second ledger or approval event; optional access telemetry is nonfinancial.
- Failure at ledger/audit/operation transition rolls back all. Unknown connection outcome queries same operation ID, never generates new one.
- CHECK creator/approver inequality is not authorization; auth.uid and membership/role are checked in the posting transaction.

## 32. Migration handoff state machine

Required sequence:
WRITERS_DISABLED → MIGRATION_AUTHORITY_ACTIVE → BACKFILL_COMPLETE → PERMANENT_GUARD_ACTIVE → MIGRATION_AUTHORITY_REVOKED → INDEPENDENTLY_VERIFIED → WRITERS_REENABLED.

| transition | precondition/actor | DB/action | evidence | commit boundary | failure/recovery | writer status |
|---|---|---|---|---|---|---|
| enter disabled | CH-1/DBA approved operator | disable financial RPC/grants/feature gate, drain transactions | grant/flag/active-session snapshot | commit and verify | any active writer → abort and disable/drain | off |
| activate migration authority | controlled runner, ephemeral credential | role active only for runner; no app/SECDEF owner membership | pg_roles/pg_auth_members, identity, ticket | credential/role activation | role graph unclear → revoke; stay off | off |
| backfill complete | preflight clean | classify only; legacy source_memo_id=NULL; candidate hints table; no amount/type/customer/shop edits | before/after row IDs/counts/hash/balance/source-hint report | backfill commit after validation | mismatch → rollback if possible; else reviewed repair/restore, stay off | off |
| permanent guard active | backfill verified | install/enable permanent trigger; reject legacy insert/origin update; freeze legacy rows | trigger definition/hash/enabled state, owner/SECDEF catalog, negative test | DDL commit | guard absent/disabled → no progression | off |
| migration authority revoked | permanent guard active | revoke role membership/credential; NOLOGIN; remove SET/INHERIT/ADMIN paths | role membership and credential closure evidence | revoke commit | uncertain closure → stay off, repeat closure | off |
| independently verified | reviewer independent of runner | inspect guard, owners, ACL, function overloads, roles, legacy source NULL, candidate metadata, balances | signed catalog snapshots + MIG test evidence | verification record | any discrepancy → return to off and remediate | off |
| re-enable | CH-1 + DBA/security | enable only approved RPCs; unknown writers stay disabled | direct-write denial, grant diff, writer inventory | enable commit | any failure → disable again, incident ticket | only now on |

No GUC, session variable, JWT custom claim, function argument or client flag grants migration authority. Only reviewed DB role/credential and controlled deployment context. No app/service/function/trigger/table owner may SET ROLE/inherit migration authority. Migration principal cannot own SECURITY DEFINER function. PostgreSQL table owner/superuser can disable triggers; external dual approval/audit remains residual.

Failure cases:
- Backfill failure pre-commit: rollback and verify source; remain writers disabled.
- Backfill committed but validation mismatch: no ad hoc rollback; preserve snapshot, reviewed forward repair/restore; disabled.
- Permanent guard install failure: temporary guard remains, no writer reopen.
- Role revoke uncertain: permanent guard plus role closure must be proven before reopen.
- Independent verify fails: revert to WRITERS_DISABLED, correct, rerun.
- Partial writer enable: disable all financial writers, audit grants/session caches, reverify.
- Runner connection loss: inspect DB durable state and external audit; never infer commit from client timeout.

## 33. Exact financial lock protocol and graph

### Purpose/modes
- Operation/request row: idempotency/workflow mutex; unique-key insert arbitration for absent row, then re-read canonical record. Does not serialize balances.
- Shop row: stable tenant existence via FOR KEY SHARE for ordinary financial action; not a balance mutex. FOR UPDATE only for shop-wide owner transfer, membership/role administration or invariant that truly requires global serialization.
- Membership row: FOR UPDATE when role revocation must serialize with approval.
- Customer row: FOR UPDATE mandatory for every same-customer balance writer before aggregate read and due/paid ledger write.
- Catalog/stock row: FOR UPDATE for identity/quantity movement, sorted by stable UUID.
- Audit/ledger: append after business locks; never use ledger scan as mutex.
- FK/unique index/trigger implicit locks must be inventoried and tested.

### Canonical order
operation/request → shop (only where required) → membership (when required) → customer(s) sorted UUID → catalog/stock identities sorted UUID → business rows/ledger/movement/audit/result → commit.

- Payment: request claim → shop KEY SHARE → membership if authorization must serialize → customer FOR UPDATE → read aggregate → PO-04 validation → paid ledger/audit/result.
- Manual referenced due: request claim → shop KEY SHARE → membership if required → customer FOR UPDATE → unique reference arbitration → due ledger/audit/result.
- Memo due: request claim → shop KEY SHARE → customer FOR UPDATE if receivable changes → stock rows FOR UPDATE sorted → memo/due/stock/audit/result.
- No-ref approval: operation FOR UPDATE → shop KEY SHARE → membership FOR UPDATE → customer FOR UPDATE → ledger/audit/operation posted/result.
- Membership revoke: shop FOR UPDATE → membership FOR UPDATE → role update/audit.
- Cancel/expire/reject: operation FOR UPDATE and authorization; no lower locks if no balance write. Never commit operation-only then later acquire customer/stock in a continuation.
- Read/recovery: authorized MVCC read; no write locks.
- Multi-customer/item locks sorted ascending UUID.
- Shop KEY SHARE does not mutually exclude balance writers; customer FOR UPDATE is the balance serialization primitive. Do not impose shop FOR UPDATE on every financial action.

### Endpoint lock graph
| endpoint | lock order | note |
|---|---|---|
| pending submit | operation unique arbitration → shop KEY SHARE → membership/read auth → customer existence/tenant check | no ledger/balance |
| approve | operation FOR UPDATE → shop KEY SHARE → membership FOR UPDATE → customer FOR UPDATE | approval/revocation serialized |
| cancel/expire/reject | operation FOR UPDATE → authorization | terminal state only, no balance |
| payment | operation claim → shop KEY SHARE → membership if required → customer FOR UPDATE → aggregate read/write | same customer serial |
| manual due | operation claim → shop KEY SHARE → auth membership → customer FOR UPDATE → ref unique → ledger | same customer serial |
| memo | operation claim → shop KEY SHARE → customer FOR UPDATE → sorted stock rows FOR UPDATE → writes | customer before stock |
| stock sale/adjustment | operation claim → shop KEY SHARE → stock row FOR UPDATE | no customer unless ledger also affected |
| customer create/get | operation claim → shop KEY SHARE → unique identity arbitration | no balance lock |
| catalog create/update | operation → shop KEY SHARE → catalog identity unique arbitration/version row | unresolved stock blocks identity update |
| opening stock | stock op → shop KEY SHARE → catalog lock → stock identity lock → server opening action unique → movement | opening exactly once |
| restock | movement op → shop KEY SHARE → stock row FOR UPDATE → restock movement | distinct movement ID |
| membership revoke | shop FOR UPDATE → membership FOR UPDATE | serial with approval |
| legacy classification | migration-only → legacy rows sorted FOR UPDATE | no financial alteration |

### Positive deterministic schedules
LOCK-01 due holds customer lock and commits; payment waits, reads post-due aggregate and follows PO-04.
LOCK-02 payment first; payment validates old balance, due waits; no negative balance.
LOCK-03 two payments 70 on balance 100: one posts, other re-reads and rejects; final 30.
LOCK-04 two different customers in same shop: customer locks independent; both may commit; no shop-wide mutex.
LOCK-05 memo due vs payment: same customer serial; stock locks after customer.
LOCK-06 approval vs cancel/expire: same operation row; one terminal state; posted→one ledger, expired/cancelled→zero.
LOCK-07 role revoke vs approval: shop→membership lock order; approval either commits before revoke or denies after.
LOCK-08 same stock item movements: stock FOR UPDATE serializes qty/movement.
LOCK-09 distinct catalog request IDs same identity: unique constraint one identity; loser conflict or canonical result per PO.
LOCK-10 multiple customer/item rows: ascending UUID lock order; no inversion.

### Negative inversion tests
LOCK-N01 intentionally customer→shop inversion in isolated harness; deadlock/timeout expected only in unsafe test; no partial rows.
LOCK-N02 membership→shop inversion vs revocation; unsafe harness detects.
LOCK-N03 stock→customer inversion vs memo; unsafe harness detects.
LOCK-N04 request unique conflict path acquiring lower lock out of order; production path must avoid.
LOCK-N05 cancellation commits operation row then continuation acquires customer; forbidden architecture.
All proposed/not executed.

## 34. Catalog/stock identity and recovery
- Catalog identity and stock identity separate; one stock row per catalog only if PO-10 approves. Variants must have distinct approved catalog identity.
- Catalog operation and stock operation IDs distinct; same ID+same payload canonical result; changed payload rejects.
- Opening action ID generated server-side once and stored on durable operation; client cannot set/reset/regenerate.
- Unique keys (after PO): shop+catalog identity key; catalog item→stock identity if PO-10 says one-to-one; unique opening_action_id; shop+stock operation; shop+movement operation; unique opening movement business action. Check-then-insert alone is insufficient.
- Opening movement is exactly one initial quantity action. Restock uses a separate movement ID/type/restock quantity delta; never reuse opening action.
- Response loss/ambiguous commit -> stock_result_unknown and server reconciliation; no new opening ID.
- Catalog identity update uses expected_version and is blocked while stock operation unresolved. Lock catalog before stock.
- direct catalog writes revoked if audit completeness claimed; catalog row+operation+audit atomic in RPC.

CAT-01 same catalog ID/payload replay → same ID.
CAT-02 same ID changed payload → reject.
CAT-03 distinct IDs same approved identity concurrent → one canonical/conflict.
CAT-04 opening commit response loss → same stock operation returns same movement.
CAT-05 new ID attempts repeat opening → reject.
CAT-06 restock new movement ID → quantity delta, no opening duplication.
CAT-07 same restock ID replay → no duplicate delta.
CAT-08 identity update during unresolved stock → reject/defer.
CAT-09 stale expected_version → conflict/no write.
CAT-10 local storage wiped, multiple unresolved → server lists all with stable IDs; no new opening ID.

## 35. Customer create-or-get and references (PO pending)
- Customer operation key shop+operation_type+ID; canonical payload/hash/version immutable.
- Same ID same payload returns original customer; changed payload rejects.
- Different IDs colliding under PO-approved identity key return review/conflict; no auto merge.
- PO-07 identity key remains pending; no phone-only/phone+name policy assumed.
- Customer create can persist separately from later memo/Baki failure; UI must show distinct durable outcome.
- Cross-shop customer records never merge.
- CUST-01 same ID replay; one customer.
- CUST-02 changed payload/version same ID rejects.
- CUST-03 distinct IDs same identity conflict/review per PO.
- CUST-04 same phone/name in different shops remains separate.
- CUST-05 local storage lost; recovery list finds canonical customer ID.

## 36. Audit immutability
- auth/anon/service roles no UPDATE/DELETE ledger/audit/approval/provenance.
- SECDEF owner minimum capabilities; if owner/table owner can bypass, disclose/DBA-govern; do not claim impossible.
- correction is new event referencing prior, reason/actor/time; no original mutation.
- catalog audit guarantee only when direct catalog writes revoked.
- break-glass owner/superuser is privileged residual; dual approval, external ticket, SQL hash, target, start/end/outcome, review.

AUD-01 auth/service UPDATE/DELETE audit → 42501/trigger; digest unchanged.
AUD-02 alternate SECDEF mutation → deny; owner/path captured.
AUD-03 append correction event; original remains.
AUD-04 direct catalog write deny if RPC audit claim.
AUD-05 isolated DBA break-glass classified privileged; external evidence, not normal role protection.

## 37. PO-01–PO-10 and blocked modules
| PO | Options | suggested default (not approval) | blocked module/index | status |
|---|---|---|---|---|
| PO-01 approval authority | owner only/manager/delegated member | owner only pending role model | no-reference due | PENDING |
| PO-02 expiry | fixed/configurable/none | short server TTL | expiry worker/revival | PENDING |
| PO-03 references | customer/shop global/cross-kind | customer scope; selected global kinds | reference indexes | PENDING |
| PO-04 payment | aggregate/allocation/overpay | aggregate, reject overpay | payment writer/balance UX | PENDING |
| PO-05 legacy | include/exclude/separate | label unknown; accounting decision | balance/dashboard | PENDING |
| PO-06 inventory identity | SKU/barcode/name+variant | shop-scoped explicit variant identity | catalog/stock unique keys | PENDING |
| PO-07 customer identity | phone/phone+name/other/no dedupe | explicit shop-scoped | create-or-get index | PENDING |
| PO-08 second actor | owner/delegated manager/member | owner only until approved | membership/approval | PENDING |
| PO-09 exception cap/reasons | no cap/amount/daily/reason list | required reason; threshold unresolved | risk control | PENDING |
| PO-10 catalog/stock | shared identity/separate | catalog identity, stock state separate | stock FK/cardinality | PENDING |

PO decision requires named PO, date, rationale and approval evidence. Developer recommendation is not approval. Dependent writes/indexes remain disabled/fail-closed.

## 38. Consolidated test plan T01–T63

All tests are PROPOSED / NOT EXECUTED. The original detailed T01–T27, T28–T39, and T40–T63 are retained in prior revisions and are fully expanded here by test fixture/action/outcome references. To avoid duplicating unchanged tables verbatim, R2.4 maintains the exact original T01–T27 definitions from R2, the T28–T39 definitions from R2.1 clarification, and T40–T63 definitions from R2.2; the following additions supersede their old assumptions:
- T01/T04/T19/T23/T24/T30/T31/T32/T45 must use exact composite FK and source memo rules §§29,30,34.
- T08/T09/T25/T33/T34/T46/T47 use lock graph §33, deterministic barriers, customer FOR UPDATE and final balance/movement checks.
- T13/T44/T48/T56/T58/T63 use all overload/SECDEF/role owner paths.
- T16/T17/T18/T35–38/T49–52/T60/T61 use server operation recovery and server-allocated opening action ID §§34.
- T28/T29/T40–43/T55 use operation-ledger cardinality, canonical hash/version and replay rules §31.
- T39/T19 use legacy source_memo_id=NULL and candidate metadata §29.
- T59 failure injects at every transaction write boundary.
- Every test requires the evidence contract §38.1 and is not passed.

### T01–T63 test inventory
T01 memo+due+stock atomic success; T02 same-ID same-payload replay; T03 changed-payload replay rejection; T04 duplicate memo due source; T05 referenced manual due; T06 duplicate reference; T07 memo alias/manual misclassification; T08 concurrent different-ID payments; T09 same-ID concurrent payment; T10 changed payment replay; T11 legacy NULL payload fail-closed; T12 cross-tenant RPC; T13 direct write ACL; T14 anonymous read; T15 financial transaction failure rollback; T16 stock response loss; T17 verified stock rollback/retry; T18 catalog-only; T19 ambiguous legacy classification; T20 baseline upgrade; T21 fresh install; T22 interrupted migration; T23 memo customer mismatch; T24 due-bearing memo customer NULL; T25 stock sale/adjustment concurrency; T26 memo cancellation/edit restriction; T27 aggregate balance calculation; T28 two-actor no-reference due; T29 self/no second actor approval denied; T30 customerless memo with due rejected; T31 zero-due customerless memo allowed; T32 composite FK tenant/customer mismatch; T33 payment race; T34 due/payment race; T35 durable stock operation after reload; T36 stock response lost canonical recovery; T37 same-ID retry after confirmed rollback; T38 catalog-only semantics; T39 legacy UI/source unknown; T40 self approval; T41 forged approver; T42 unauthorized approver; T43 altered/replayed operation; T44 migration guard bypass; T45 full CHECK/FK matrix; T46 memo due vs payment; T47 manual due vs payment; T48 direct balance writer bypass; T49 catalog saved reload; T50 stock commit response loss; T51 unresolved opening action new ID blocked; T52 concurrent identity duplicate; T53 audit immutability/correction; T54 customer create-or-get response loss; T55 expired approval; T56 post-migration role closure; T57 audit update/delete; T58 full catalog/function/ACL inventory; T59 failure injection; T60 local-storage-loss recovery; T61 RPC catalog audit completeness; T62 customer identity collision; T63 role/overload/SECDEF boundary.

## 39. Full adversarial test details

### PNV-01–35
See §30.5. Every field mutation is independent, INSERT and UPDATE where applicable; auth/service/alternate SECDEF tested; expected 23502/23503/23514/42501 or stable RPC domain code; no partial financial or operation effect. Legacy missing creator is preserved as unknown only through migration-approved fixture; ordinary app cannot write it.

### MIG-01–10
MIG-01 auth SET ROLE migration principal denied; MIG-02 service SET ROLE denied; MIG-03 RPC owner has no SET/inherit path; MIG-04 ADMIN OPTION grant denied; MIG-05 nested SECDEF backfill helper denied; MIG-06 function owner legacy insert/update denied; MIG-07 caller GUC/helper during migration window denied; MIG-08 after credential revocation legacy write denied; MIG-09 superuser/table-owner break-glass documented as privileged residual and external alert; MIG-10 catalog role/owner/default privilege inventory proves no path. Evidence: role snapshots, session_user/current_user, SQLSTATE, external ticket and no-row assertions.

### ADV-01–15
ADV-01 role revocation vs approval membership-lock linearization; ADV-02 approval vs cancel; ADV-03 approval vs expiry; ADV-04 approved due vs payment; ADV-05 memo due vs no-ref approval; ADV-06 intentionally inverted lock schedule and rollback; ADV-07 migration role escalation; ADV-08 audit UPDATE/DELETE via direct/SECDEF; ADV-09 full provenance negative matrix; ADV-10 distinct stock IDs same identity race; ADV-11 distinct approved variants; ADV-12 duplicate opening after lost response/new ID; ADV-13 identity update while stock pending; ADV-14 conflicting customer IDs; ADV-15 failure injection at ledger/audit/result/stock movement. Each concurrency test uses two independent sessions/barrier, fixed seed IDs, commit order, SQLSTATE, final rows/balance/stock/audit and rollback evidence.

### Additional lock/candidate/catalog/customer/audit tests
- LOCK-01–10 positive schedules and LOCK-N01–05 inversions in §33.
- LEG-01–08 candidate source handling in §29.
- CAT-01–10 catalog/stock/opening/restock/recovery in §34.
- CUST-01–05 identity/recovery in §35.
- AUD-01–05 append-only/privileged boundaries in §36.
All are proposed, not executed.

## 40. Test evidence and execution prerequisites
For every test: synthetic tenant/shop/customer/memo/item IDs; DB version and migration commit; authenticated JWT subject (never token), session_user/current_user/function owner; request/operation ID, canonical payload digest/version; exact RPC/SQL and result/SQLSTATE; deterministic barrier timestamps and pg_locks snapshot for concurrency; committed row IDs/counts across ledger/memo/stock/request/audit/candidate metadata; before/after aggregate balance and stock quantity/movement count; canonical IDs/status; rollback/absence of partial effects; signed test report. Exact RPC domain errors must be frozen before runtime test execution. No tests executed in this design revision.

## 41. Migration failure/recovery/rollback
- No SQL migration authored/executed in R2.4.
- Preflight exact baseline schema, constraints, triggers, functions/overloads, ACL/roles, duplicate source, candidate memo hints, balance snapshots.
- Use transactional DDL where supported; separately inspect nontransactional index validity. No IF NOT EXISTS to hide mismatched object.
- Failure before commit: rollback and verify; writers stay off.
- Failure after partial DDL/backfill commit: inspect durable catalog and migration state; reviewed forward repair or verified restore, never blind rerun.
- Do not delete ledger rows or reverse financial history to rollback. After financial writes, stop and use approved accounting correction or restore with explicit data-loss acceptance.
- Re-enable writers only after state machine §32 reaches independently verified.

## 42. Residual risk and runtime verification plan
Residual: owner/superuser can disable trigger; no-reference collusion risk; legacy candidate metadata may be wrong; PO-04/05 accounting policy unresolved; identity false conflicts; customer FOR UPDATE throughput cost; network response loss. Runtime verification later: schema convergence, constraints/FKs, auth/JWT, SECDEF owners/search_path/ACL, role graph, migration handoff, all T/PNV/MIG/ADV/LOCK/LEG/CAT/CUST/AUD tests, two-session deterministic concurrency, failure injection, local storage loss, backup/restore. No runtime PASS claim.

## 43. Approval gate and stop condition
Required: CH-1 R2.4 approval; CH-4 independent approval; PO-01–10 explicit decision; DBA/security role/schema/ACL approval; runtime test harness and synthetic acceptance plan; explicit CH-1 implementation authorization. Until then no code, SQL migration, database access/mutation, merge, deployment or financial pilot. Implementation approval NOT GRANTED; financial pilot NO-GO.
