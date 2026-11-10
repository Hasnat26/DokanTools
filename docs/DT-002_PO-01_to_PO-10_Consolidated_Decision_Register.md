# DT-002 — PO-01 to PO-10 Consolidated Decision Register

**Document type:** Controlled governance consolidation; documentation-only  
**Repository:** `Hasnat26/DokanTools`  
**Pull request context:** PR #17 — R2.10 documentation candidate  
**Decision date:** 2026-11-10  
**Canonical decision baseline:** R2.5 `docs/M0-01_Remediation_Design_R2.5.md`, commit `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512`  
**Earlier CH-1-reviewed R2.10 technical candidate:** `docs/M0-01_Remediation_Design_R2.10.md`, commit `8c0cf59a7dcba7b4d353207c42c99a9800434542` (earlier technical review baseline; not the same Git object as the PR-head companion file)  
**Current PR #17 head companion file (`bf5e19e290bef697c86287686e8a9002e5744dbd`):** `docs/M0-01_Remediation_Design_R2.10.md`, blob `1d3aa3ad480d4c5071a19c9f6d1ff1abfdfc9d17`. **Historical CH-1 technical-review baseline:** commit `4935c104cec90ddd4bb069126a6d0c235e00d7a4`; this remains a distinct historical reference and is not the current PR-head reference.

---

## 1. Purpose and authority

This register consolidates the explicit Product Owner (PO) decisions PO-01 through PO-10 and their CH-1 dispositions recorded in PR #17.

It is a **decision-record consolidation only**. It does not amend R2.5 or R2.10, define physical schema, establish implementation-ready technical contracts, close design, or authorize implementation.

**Overall disposition:** 10/10 PO decisions submitted; 10/10 accepted by CH-1 with clarification. PO-01 and PO-08 authority policy is reconciled.

CH-1 acceptance applies to the PO policy choices and the express clarifications recorded below. It does not certify physical feasibility, DBA/security approval, or runtime behavior.

## 2. Consolidated decision register

| PO | Decision area | PO selection | CH-1 disposition | Submission comment | CH-1 comment |
|---|---|---|---|---:|---:|
| PO-01 | Approval authority | A — Shop owner only | ACCEPTED WITH CLARIFICATION | #6758644399 | #6758930635 |
| PO-02 | Approval expiry | A — Fixed 24 hours, UTC | ACCEPTED WITH CLARIFICATION | #6758650229 | #6758654324 |
| PO-03 | Reference uniqueness | A — Customer-scoped | ACCEPTED WITH CLARIFICATION | #6758661860 | #6758663680 |
| PO-04 | Payment / overpayment | A — Aggregate balance; reject overpayment | ACCEPTED WITH CLARIFICATION | #6758753234 | #6758756359 |
| PO-05 | Legacy balance | C — Separate unclassified/unknown | ACCEPTED WITH CLARIFICATION | #6758780579 | #6758782675 |
| PO-06 | Catalog identity | C — Name + explicit variants, shop-scoped | ACCEPTED WITH CLARIFICATION | #6758808045 | #6758810369 |
| PO-07 | Customer identity | A — Phone, shop-scoped | ACCEPTED WITH CLARIFICATION | #6758839616 | #6758841395 |
| PO-08 | Second approver | A — Shop owner only | ACCEPTED WITH CLARIFICATION | #6758858959 | #6758860836 |
| PO-09 | Exception controls | A — Mandatory meaningful reason only | ACCEPTED WITH CLARIFICATION | #6758880184 | #6758882340 |
| PO-10 | Catalog/stock relationship | C — Separate logical identities | ACCEPTED WITH CLARIFICATION | #6758902232 | #6758902905 |

**PO-01 / PO-08 reconciliation record:** CH-1 reconciliation note #6758914733; formal PO-01 acceptance #6758930635.

Comment IDs are recorded as GitHub PR #17 issue comments. The canonical R2.5 source reference is the same for all ten decisions unless a later controlled revision explicitly supersedes it.

## 3. Accepted policies and clarifications

### PO-01 — Approval authority

**Accepted policy:** Only the current shop owner at approval time may second-approve a no-reference financial operation.

- The current owner must be identified through trusted server-side authentication and authoritative shop-ownership state.
- The operation creator and approver must be different authenticated actors; self-approval is prohibited.
- If the current owner created the operation, that owner cannot approve it. No manager, member, inherited role, fallback approver, or automatic exception is authorized. Self-approval remains prohibited; no fallback approver or automatic exception is authorized.
- This policy does not itself authorize a new rejection, cancellation or automatic terminal transition. The precise pending/expiry/rejection/cancellation handling must remain within the already-approved operation lifecycle; any new transition or alternative resolution requires a separate PO decision.
- Client-supplied owner IDs, approver IDs, or role claims are not authoritative.
- Current ownership and authorization must be revalidated inside the approval transaction.

**Open technical dependencies:** ownership transfer/revocation race serialization; authoritative ownership source; trusted auth-subject derivation; SECURITY DEFINER owner/search_path/grants; transaction-context integrity; DBA/security verification. T40–T43 and ADV-01–07 remain unexecuted logical specifications.

### PO-02 — Approval expiry

**Accepted policy:** Fixed TTL of 24 hours, measured using UTC/trusted server time. Expired requests are terminal and cannot be revived; the creator must submit a new request with a new operation ID.

**CH-1 clarification:** The controlled technical contract should freeze `expires_at = submitted_at + 24 hours`, with both values server-generated and immutable. Approval/expiry races must serialize using the operation lock and trusted server time.

**Open technical dependencies:** exact server timestamp source, transaction/worker expiry transition, operation-lock behavior, and DBA/runtime proof. ADV-03 remains unexecuted.

### PO-03 — Reference uniqueness

**Accepted policy:** Customer-scoped uniqueness with explicit reference kinds. Logical key:

`(shop_id, customer_id, reference_kind, reference_normalized)`

- Same shop/customer/kind/normalized reference: reject duplicate.
- Same normalized reference text under a different reference kind: allowed.
- Same reference for a different customer: allowed, subject to shop isolation.
- `shop_id` remains part of the tenant-isolation/uniqueness boundary.

**Open technical dependencies:** reference normalization algorithm, case/space/punctuation rules, empty/whitespace-only handling, precise index/constraint and DBA feasibility. T05–T06 do not constitute runtime evidence.

### PO-04 — Payment / overpayment

**Accepted policy:** Customer-level aggregate outstanding balance is the payment basis. Reject payment exceeding the current outstanding balance. No invoice-level allocation and no customer advance/credit handling in the initial controlled scope.

**CH-1 clarifications:**
- Acquire customer `FOR UPDATE` before aggregate balance read and payment validation.
- Use fresh server-side balance after lock acquisition; client-displayed/cached balance is non-authoritative.
- Concurrent due/payment schedules must serialize and re-evaluate against committed aggregate balance.
- A rejected payment must produce no partial ledger, audit, result, or balance effect.
- Do not infer invoice-level settlement or allocation history from the aggregate payment ledger.

**Open technical dependencies:** aggregate query semantics, lock inventory/order, physical schema feasibility, transaction atomicity and DBA/runtime concurrency proof. T08, T27, T33 and T34 remain unexecuted.

### PO-05 — Legacy balance

**Accepted policy:** Historical due/paid amounts with unverified provenance or accounting classification remain separately identified as unclassified/unknown and are not combined with verified customer aggregate balance or used to validate new payments.

- Preserve historical amounts and source evidence.
- Do not fabricate creator, approver, timestamp, memo linkage, or accounting treatment.
- Reclassification or inclusion requires separately approved accounting policy and supporting evidence.
- This is not deletion, write-off, or permanent exclusion from all accounting reports.

**Unresolved accounting questions:** presentation of legacy due versus paid; netting; eventual recognition and accounting treatment.

**Open technical dependencies:** migration representation and provenance constraints, unclassified UI/query behavior, balance-query semantics and DBA validation. T19 and T39 remain unexecuted logical requirements.

### PO-06 — Catalog identity

**Accepted policy:** Shop-scoped product identity based on product name plus explicit variant attributes.

- Identical normalized name and identical variant attributes within one shop must not create duplicate catalog items.
- Different approved variants (e.g., size, weight, type or packaging) may be distinct catalog identities.
- SKU/barcode is not mandatory.
- No automatic product merge.

**Open technical dependencies:** exact name normalization (case, whitespace, punctuation, Unicode/Bangla normalization, abbreviations); variant attribute model, required attributes, ordering/canonicalization, missing/empty handling; exact uniqueness key/index and concurrency enforcement. PO-10 separately governs catalog-to-stock relationship.

### PO-07 — Customer identity

**Accepted policy:** Phone-based, shop-scoped identity. Logical key:

`(shop_id, normalized_phone)`

- Same normalized phone in different shops may identify separate customers.
- Missing phone means no automatic deduplication; name is not a fallback key.
- A distinct operation ID colliding with an existing same-shop identity is a conflict/manual-review case.
- No automatic merge, overwrite, reassignment, or transfer of financial/history associations.
- Same operation ID + same canonical payload returns original customer ID; changed payload conflicts.
- Shared phone or different names on one phone are ambiguous identity cases, not proof of same person.
- Name is descriptive, not part of uniqueness key.

**Open technical dependencies:** versioned phone canonicalization (accepted syntax, country/default-country handling, validation, canonical storage, extensions and ambiguity); no guessed country code; DBA verification of shop-scoped uniqueness/concurrency. CUST-01–05, T54, T62 and ADV-14 remain unexecuted.

### PO-08 — Second approver

**Accepted policy:** Only the authenticated, currently authorized shop owner may second-approve a no-reference financial operation. Delegated managers, general members, inherited roles and implicit/fallback authority are excluded. Creator and approver must be different authenticated actors; self-approval is prohibited.

**Reconciliation:** PO-01 and PO-08 now express one authority policy: only the current authenticated shop owner may approve, provided that owner is not the operation creator.

**Open technical dependencies:** trusted server-side actor/ownership state; transaction-time revalidation; ownership transfer/revocation race serialization; DBA/security evidence. T40–T43 and ADV-01–07 remain unexecuted.

### PO-09 — Exception controls

**Accepted policy:** Every no-reference financial operation requires a meaningful business justification explaining why a normal reference-backed path is not used.

- Missing, empty, whitespace-only or placeholder justification (e.g., `N/A`, `.`) is invalid.
- No per-operation amount cap or daily cumulative cap in the initial scope.
- No fixed approved reason-code taxonomy is mandated.
- Future caps or taxonomy require separate explicit PO decision.

**Open technical dependencies:** controlled design must define the relationship/storage/validation contract for R2.5 `reason_code` and `reason_text`, without inventing enum values or silently imposing taxonomy. Server-side validation is required; client-side validation alone is insufficient. PNV-25/32, T28–29 and T40–43 remain unexecuted.

### PO-10 — Catalog/stock relationship

**Accepted policy:** Catalog product identity and physical stock-record identity are separate logical identities.

- PO-06 shop-scoped name + explicit variant catalog identity remains unchanged.
- Catalog-to-stock cardinality is not decided: one-to-one, one-to-many and many-to-many are all unapproved.
- This does not authorize multiple stock records, batches, warehouses, locations, or other inventory dimensions.
- Catalog metadata changes must not silently mutate, replace or merge stock identities.
- Opening stock and restock are distinct business actions.

**Open technical dependencies:** exact catalog-to-stock FK/cardinality; stock identity and uniqueness; opening-stock idempotency/duplicate prevention; restock movement linkage; expected-version behavior; recovery semantics; DBA schema review. CAT-01–10, T18, T35, T51, T52 and ADV-10–13 remain unexecuted.

## 4. Consolidated open technical/DBA dependency register

| ID | Dependency | Related decisions | Required evidence before implementation |
|---|---|---|---|
| DEP-01 | Trusted authentication subject and authoritative owner-source contract | PO-01, PO-08 | Document authoritative ownership-source provenance and exact relation/service; shop-owner uniqueness invariant; owner and membership status semantics; revocation representation; trusted mapping from authenticated subject to the authoritative owner record. Define fail-closed behavior for missing, multiple, ambiguous, stale or unavailable ownership state. Prohibit stale-cache decisions and client-asserted identity/role/owner claims. Supply evidence for SECURITY DEFINER ownership, fixed `search_path`, EXECUTE grants/callable surface and transaction-context integrity/binding to the authenticated invocation. This is a required evidence contract, not selection of an implementation. |
| DEP-02 | Creator ≠ approver; owner-is-creator lifecycle | PO-01, PO-08 | Explicit state/UX/error contract; no fallback authority |
| DEP-03 | Ownership transfer/revocation versus approval race and authorization serialization | PO-01, PO-08 | Require evidence identifying the approval authorization linearization point inside the transaction; exact logical shop/ownership/operation lock order (without prescribing an unverified physical mechanism); transfer-first, approval-first and revocation-first concurrency schedules; proof that approval cannot use stale owner state. Cover missing/multiple owner records and ownership-source failure with fail-closed outcomes. For unauthorized/stale-owner approval require rollback/no-post assertions and B0/B1 proof where applicable, including unchanged operation/ledger/event/balance state. Physical lock mapping and concurrency proof require DBA evidence and separately authorized execution; no mechanism is selected here. |
| DEP-04 | Server-controlled 24-hour UTC expiry, expiry actor and approval/expiry race | PO-02 | Define required evidence for the expiry worker/system actor identity and its privilege/callable boundary; trusted UTC clock source and immutable `submitted_at`/`expires_at` semantics; scheduling responsibility, retry behavior and idempotency; approval-versus-expiry concurrency schedules and the exact serialization/linearization behavior. Evidence must show terminal requests cannot be revived and retries cannot create duplicate expiry or competing terminal transitions. These are design/DBA evidence requirements only: no worker implementation, schedule, system identity or privilege is selected or granted by this register. |
| DEP-05 | Reference normalization and uniqueness | PO-03 | Versioned normalization specification; empty-input policy; index feasibility |
| DEP-06 | Aggregate balance read/write and payment serialization | PO-04 | Authoritative ledger query, customer mutex design, rollback semantics |
| DEP-07 | Legacy unknown provenance, source-to-target reconciliation and accounting disposition | PO-05 | Require a source-to-target migration reconciliation artifact with source/target counts, completeness checks, exception totals and digest/reconciliation evidence sufficient to account for every migrated/in-scope record. Define unknown actor/provenance treatment without fabricated attribution. Preserve separate due and paid reporting and exclude unclassified amounts from verified-balance calculations unless separately approved. Obtain explicit accounting-owner disposition for unclassified legacy amounts, including unresolved due/paid classification and recognition/netting treatment. These requirements do not decide accounting treatment or authorize migration. |
| DEP-08 | Catalog name/variant normalization and uniqueness | PO-06 | Versioned field/normalization contract; collision matrix; DBA unique-index design |
| DEP-09 | Customer phone normalization and collision handling | PO-07 | Versioned phone contract; cross-shop/missing/shared-phone cases; DBA uniqueness |
| DEP-10 | Reason text/code storage and meaningful-justification validation | PO-09 | Controlled field contract; server-side validation; no unapproved taxonomy |
| DEP-11 | Catalog-to-stock relationship and cardinality | PO-06, PO-10 | FK/cardinality, identity, uniqueness, opening/restock, version/recovery contract |
| DEP-12 | Idempotent operation recovery and concurrency across catalog/stock | PO-06, PO-10 | Stable IDs, replay/conflict semantics, movement linkage, DBA review |

This register identifies required future evidence; it does not assert that any evidence has been obtained.

## 5. Test references — specification only

The references below are not test results:

- **Approval/security:** T28–29, T40–43, T55, LOCK-07, ADV-01–07.
- **Expiry:** ADV-03 and related approval lifecycle clauses.
- **Reference uniqueness:** T05–06.
- **Payment:** T08, T27, T33–34.
- **Legacy provenance/display:** T19, T39.
- **Catalog identity/stock:** CAT-01–10, T18, T35, T51–52, ADV-10–13.
- **Customer identity:** CUST-01–05, T54, T62, ADV-14.
- **Reason validation:** PNV-25, PNV-32, T28–29, T40–43.

No runtime test is represented as executed or passed by this register.

## 6. Governance boundaries and current status

The following are **not authorized by PO-01–PO-10 acceptance**:

- Implementation or source-code changes.
- SQL execution, schema/index/FK/ACL/role changes, or database access/mutation.
- Builds, runtime testing, QA execution, migration or deployment.
- Design closure, PR merge, APK distribution or financial pilot.

Status carried forward:
- PO policy decisions: 10/10 accepted with clarification.
- PO-01/PO-08 authority policy: reconciled.
- Implementation: **NOT AUTHORIZED**.
- Runtime/DB verification: **NOT EXECUTED / NOT VERIFIED**.
- Design closure: **NOT GRANTED**.
- Financial pilot: **NO-GO**.
- PR #17: remain OPEN / DRAFT / UNMERGED unless separately authorized after independent review.

## 7. Source and decision evidence index

**Canonical design source**
- R2.5: `docs/M0-01_Remediation_Design_R2.5.md`, commit `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512`.
- Earlier CH-1-reviewed R2.10 technical candidate: `docs/M0-01_Remediation_Design_R2.10.md`, commit `8c0cf59a7dcba7b4d353207c42c99a9800434542`. This is the earlier technical review baseline and is not the same Git object as the PR-head companion file below.
- Current PR #17 head companion document at commit `bf5e19e290bef697c86287686e8a9002e5744dbd`: `docs/M0-01_Remediation_Design_R2.10.md`, blob SHA `1d3aa3ad480d4c5071a19c9f6d1ff1abfdfc9d17`. The file remains present at this current PR head with this unchanged blob.
- Historical CH-1 technical-review baseline: commit `4935c104cec90ddd4bb069126a6d0c235e00d7a4`. This is retained as a distinct historical reference and must not be substituted for or conflated with the current PR-head reference above.

**PR #17 decision evidence**
- PO-01: submission #6758644399; reconciliation #6758914733; formal acceptance #6758930635.
- PO-02: submission #6758650229; acceptance #6758654324.
- PO-03: submission #6758661860; acceptance #6758663680.
- PO-04: submission #6758753234; acceptance #6758756359.
- PO-05: submission #6758780579; acceptance #6758782675.
- PO-06: submission #6758808045; acceptance #6758810369.
- PO-07: submission #6758839616; acceptance #6758841395.
- PO-08: submission #6758858959; acceptance #6758860836.
- PO-09: submission #6758880184; acceptance #6758882340.
- PO-10: submission #6758902232; acceptance #6758902905.

All decision comments are in [PR #17](https://github.com/Hasnat26/DokanTools/pull/17).

---

**Prepared by:** CH-1 / Chief Reviewer  
**Review purpose:** Controlled DT-002 decision consolidation for subsequent independent CH-4 review.  
**Disposition:** PO decision consolidation only; no implementation or design closure authority.