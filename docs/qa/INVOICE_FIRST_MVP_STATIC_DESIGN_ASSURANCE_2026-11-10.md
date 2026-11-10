# DokanTools Invoice-First Web MVP — CH-4 Independent Static Design Assurance

**Report ID:** DT-MVP-CH4-STATIC-ASSURANCE-2026-11-10-01  
**Manifest:** DT-MVP-CH4-FROZEN-2026-11-10-01  
**Manifest authority:** GitHub Issue #27 comment 6766702882  
**Review role:** CH-4 — Independent QA & Design Assurance Lead  
**Review type:** Static requirements, architecture, security, data-integrity and testability review  
**Overall disposition:** **NEEDS REVISION**  
**Implementation / DB / test / merge / deployment / pilot authorization:** NOT GRANTED

---

## 1. Executive disposition

The frozen identities are valid. All three candidate PR heads, their target file blobs, main HEAD and the three mandatory SSOT blobs were independently re-fetched and matched the manifest. No artifact moved during the identity check.

The review finds that the current document set is substantially stronger than the original v0.1 design. PR #33 corrects the earlier global idempotency-key defect at the design level; transaction boundaries, per-shop transactional numbering, immutable invoice/line facts, append-only lifecycle/audit, public DTO minimization, HMAC validation order, revocation/key compromise, financial arithmetic and recovery are now described in meaningful detail. PR #30 resolves the substantive menu-lifecycle concern by explicitly PO-gating menu actions and duplicate rules. The PR #32 AC-10 correction is also present and correctly scoped to A1 changes rather than removal of existing application capabilities.

However, the integrated design is not yet acceptable without revision. The most important remaining defect is an internal contradiction over whether generated-logo default selection requires explicit owner confirmation. The document states both that Generated is the default without opt-in and that a generated selection operation requires owner confirmation. A second material gap is the absence of a fully specified transaction/locking protocol that guarantees invoice issuance snapshots one complete shop-profile revision while a profile/logo/tagline update may be concurrent. Several capability gates remain intentionally open because the PO has not answered the corresponding decisions. Those gates must remain capability-specific; they do not all block unrelated invoice work.

### Separate PR dispositions

| PR | Scope reviewed | CH-4 disposition | Rationale |
|---|---|---|---|
| #30 | UX specification revision 0.2, UX-01–UX-64 | **ACCEPT WITH CONDITIONS** | Menu lifecycle P2 is substantively addressed. Clarify UX-42 preview semantics and retain PO/technical gates; no runtime acceptance. |
| #33 | Technical design v0.2 with controlled addenda v0.3, v0.3.1 and v0.3.2 | **NEEDS REVISION** | Generated-logo default/confirmation contradiction; profile/header snapshot concurrency protocol incomplete; stale CH-1 acceptance statements remain in the controlled addenda. |
| #32 | Governance register and Phase A1 package | **NEEDS REVISION** | A1 mobile grammar permits format-only values; register still contains stale PR #28/PR #30/CH-4 status references. The A1 scope itself is separable and can be accepted with conditions after these corrections. |

**Integrated recommendation: NEEDS REVISION.** This is a design/documentation disposition only. It is not runtime QA, implementation readiness, production readiness, merge approval or release authorization.

---

## 2. Exact frozen artifact identity verification

### 2.1 Candidate artifacts

| Artifact | Frozen HEAD | Fetched blob SHA | Result |
|---|---|---|---|
| PR #30 UX | c7b0d8bddad3afcdf48b0b8fba8331ad46dda309 | 3b34e6b9075b65ee027ac368fb964a5f9e98ae8f | MATCH |
| PR #33 technical design | 898c834c30ec84599a6fa7c333d3da18ca235c30 | 9a1753d3bcba680961b39b91e320d1f59d70cd14 | MATCH |
| PR #32 governance / A1 | 38068e159939aa963807b4cbdfc3fc26cbd3abee | 1782e4eb3816f5ce03d900aebbbafd1e0a427a78 | MATCH |

All three PRs were OPEN / UNMERGED and targeted main when checked. Each candidate file was fetched by its exact frozen commit SHA, not by a moving branch name.

### 2.2 Main and mandatory authority files

| Authority | Frozen identity | Re-fetched blob SHA | Result |
|---|---|---|---|
| Main HEAD | 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 | Current main HEAD = 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 | MATCH |
| WORKER_SINGLE_SOURCE_OF_TRUTH.md | — | 5714e127aad7a81d3e26da2ac2d77fe875927fdc | MATCH |
| PROJECT_SOURCE_OF_TRUTH.md | — | 0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5 | MATCH |
| docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md | — | efe0d261c50a4cfc706e82c832a6f052c676127c | MATCH |

Main remained at the frozen commit. No manifest invalidation occurred.

### 2.3 Historical PR #28

PR #28 HEAD 2b1e0be89e2487bedf841dbc8247d646529ae7cc / blob 348ec933a2798ba2c790707397d723e8377a8442 is retained as historical evidence only. The manifest explicitly makes PR #33 the current technical-design successor. This review does not replace the frozen PR #33 review with PR #28 and does not close or alter PR #28.

---

## 3. Scope, method and assurance limitations

Reviewed the complete frozen UX, technical-design and governance/A1 documents, the exact PO mockup and mandatory SSOT files, Issue #31 decision history, PR descriptions, relevant inline review threads, and the frozen manifest. The review checked requirement authority, cross-document consistency, testability, threat boundaries, transaction guarantees, capability dependencies and evidence claims.

No automated tests, browser tests, PDF generation/rendering, live database access, SQL, schema or migration work, security probes, builds, deployments or pilot activity were executed. No test scenario is reported as passed. No application behavior is independently verified. Every acceptance scenario in the design remains PROPOSED / NOT EXECUTED unless the report explicitly says it is a document-level requirement check.

The GitHub report branch and PR created for this deliverable contain documentation only. No application code, database or project implementation artifact was changed.

---

## 4. PO-confirmed requirements and UX-01–UX-64 coverage

### 4.1 Confirmed invoice content

The frozen PO mockup confirms the Bangla invoice layout and the following content: shop name, address, mobile and Google Maps location; exact heading খাবারের বিল; bill number, date and time; food/item, quantity and price; total bill amount; an individual bill-verification/details QR; and exact footer ধন্যবাদ, আবার আসবেন!.

The QR is bill-specific. A shop/profile/promotional QR is not an acceptable substitute. The mockup does not approve paper size, the meaning of the single মূল্য column, quantity/unit rules, offline behavior, link lifetime, cancellation semantics or public verification wording. The UX and technical design correctly preserve those as pending decisions.

### 4.2 Criterion-level coverage matrix

Status meanings:
- **MAPPED** — criterion has a design section and proposed acceptance oracle.
- **PARTIAL** — criterion exists but needs more precise boundary, state or evidence definition.
- **PO-GATED** — behavior must remain unavailable/provisional until an explicit PO decision.
- **TECH-GATED** — design is stated but requires technical evidence or a pinned artifact.
- **GAP** — criterion lacks sufficient test mapping or an unambiguous oracle.
- All statuses are design/testability statuses, not execution results.

| UX ID | CH-4 assessment | Evidence / qualification |
|---|---|---|
| UX-01 | PARTIAL | O-01 setup journey exists; add exact unauthenticated/first-shop transition and failure oracle. |
| UX-02 | PARTIAL | Four fields are mapped; field-specific format/requiredness rules remain partly PO/PM-gated. |
| UX-03 | GAP | Adjacent required-field errors and preservation are stated, but no complete per-field negative/boundary matrix. |
| UX-04 | GAP | Save failure/retry is stated; no explicit failure classes, retry idempotency or persistence-loss oracle at UX level. |
| UX-05 | MAPPED | Profile changes are not to imply historical invoice changes; technical snapshot contract still needs concurrency closure. |
| UX-06 | MAPPED | Menu-only screen excludes stock, purchase price and stock adjustments. |
| UX-07 | PO-GATED | Menu fields and create/edit actions depend on PO-06. |
| UX-08 | PO-GATED | Active/inactive presentation depends on PO-06. |
| UX-09 | PO-GATED | Deactivate/reactivate/delete/archive/restore remain gated by PO-06. |
| UX-10 | PARTIAL | Empty/search states are defined; lifecycle-specific empty states remain PO-gated. |
| UX-11 | PO-GATED | Menu write failure behavior is conditional on approved menu write behavior. |
| UX-12 | PO-GATED | Composer eligibility depends on PO-06; no inferred active-only selection. |
| UX-13 | PARTIAL | Review shows all lines and total; add stale-price and concurrent menu-change test oracle. |
| UX-14 | MAPPED | Unapproved financial/customer/inventory fields are excluded. |
| UX-15 | MAPPED | Double tap must not create multiple bills; technical idempotency contract maps to it. |
| UX-16 | MAPPED | Unknown outcome retains same request identity and checks/replays it. |
| UX-17 | PARTIAL | Persisted bill number/date/time and reopen behavior stated; exact status recovery endpoint/oracle remains technical. |
| UX-18 | MAPPED | Historical line/profile snapshots are required; header revision atomicity remains a technical finding. |
| UX-19 | MAPPED | PO-confirmed fields mapped; price presentation remains PO-04-gated. |
| UX-20 | MAPPED | Exact Bangla heading and footer literals are mandatory. |
| UX-21 | PO-GATED | One-page target depends on PO paper size and normal-bill/readability definition. |
| UX-22 | MAPPED | No clipping/truncation; paginate long bills and repeat context. |
| UX-23 | PO-GATED | Individual bill QR identity is confirmed; functional public verification is gated by link/expiry/key decisions. |
| UX-24 | PARTIAL | Same persisted data and semantic document required; visual/render equivalence still needs authorized evidence. |
| UX-25 | PARTIAL | Font/QR readiness and failure state are defined; pinned runtime/font artifacts remain absent. |
| UX-26 | PO-GATED | Share fields are specified, but exact WhatsApp message/footer wording remains PO-pending. |
| UX-27 | MAPPED | Failure/cancel preserves invoice and provides copy/native-share/print fallbacks. |
| UX-28 | MAPPED | No customer record or phone required for issue/share. |
| UX-29 | PO-GATED | Public no-login access depends on PO-12, PO-I11 and security gates. |
| UX-30 | MAPPED | Bill QR must not be confused with shop QR. |
| UX-31 | PO-GATED | State taxonomy exists; revoked/expired disclosure depends on PO-11/12. |
| UX-32 | MAPPED | No verified display before successful server response. |
| UX-33 | PO-GATED | Verification must not imply payment/delivery; exact customer wording awaits PO-I11. |
| UX-34 | MAPPED | Public DTO excludes customer, ledger, stock and owner-account data. |
| UX-35 | MAPPED | 320 CSS px no-horizontal-scroll target is explicit. |
| UX-36 | MAPPED | Practical 44×44 CSS px target is explicit. |
| UX-37 | PARTIAL | Persistent labels/keyboards/errors specified; accessibility evidence and field-specific matrix remain future work. |
| UX-38 | PARTIAL | Text status and Bangla readability stated; zoom/contrast/font evidence not executed. |
| UX-39 | PARTIAL | Network-state matrix exists; criterion-level mapping for each network-dependent screen is not fully enumerated. |
| UX-40 | TECH-GATED | Generated default without upload/explicit Blank; category and deterministic artifact constraints apply. |
| UX-41 | PO-GATED / TECH-GATED | Name/type-driven generation; accepted shop-type taxonomy remains PO-pending. |
| UX-42 | PARTIAL | “Owner previews ... before invoice use” can be read as mandatory preview; frozen manifest says preview is informative, not opt-in. Clarify wording. |
| UX-43 | MAPPED | Valid uploaded asset takes priority over Generated. |
| UX-44 | MAPPED | Replacement retains prior selected asset until new asset succeeds. |
| UX-45 | MAPPED | Removal requires explicit Generated or Blank choice. |
| UX-46 | MAPPED | Blank emits no logo, mark or placeholder across surfaces. |
| UX-47 | MAPPED | Blank can be cleared to resume Generated. |
| UX-48 | MAPPED | Regeneration applies only to Generated; upload is not overwritten. |
| UX-49 | PO-GATED | Only approved shop-type taxonomy may be used. |
| UX-50 | PO-GATED | Missing/unsupported type prompts only from approved choices; no inference. |
| UX-51 | TECH-GATED / PO-GATED | Format rejection specified; accepted raster formats/limits require PO-L03 and technical pinning. |
| UX-52 | TECH-GATED / PO-GATED | Size/dimension rejection specified; exact limits remain proposed pending PO-L03. |
| UX-53 | MAPPED | Failed upload preserves prior logo and tagline and permits retry. |
| UX-54 | MAPPED | Owner-authored Bangla/English/mixed tagline; no generated/rewrite behavior. |
| UX-55 | MAPPED | Blank tagline omits text and separator. |
| UX-56 | MAPPED | Tagline edit/clear is independent of logo operations. |
| UX-57 | PO-GATED | 80 grapheme-cluster cap is explicitly proposed, not approved. |
| UX-58 | TECH-GATED | Cross-surface Bangla/mixed-script rendering requires pinned font/renderer and evidence. |
| UX-59 | MAPPED | Logo and tagline state are independent. |
| UX-60 | MAPPED | Full header preview is specified. |
| UX-61 | PO-GATED / TECH-GATED | Same issued header across preview/customer/PDF/print depends on PO-L02 and snapshot implementation. |
| UX-62 | PO-GATED / TECH-GATED | Later profile edits depend on historical-header policy and immutable asset retention. |
| UX-63 | TECH-GATED | Aspect ratio/reflow behavior specified; visual evidence not executed. |
| UX-64 | MAPPED / TECH-GATED | Missing/corrupt asset must warn/fail safely; renderer behavior needs evidence. |

The UX document's own UX-01..UX-39 crosswalk records 14 MAPPED, 12 PARTIAL, 5 GAP and 8 PO-GATED. CH-4 agrees that this is a design crosswalk, not executed coverage. UX-40..UX-64 are mapped in the technical addendum R.9, but UX-42 needs the wording correction identified above. No criterion is runtime-verified.

---

## 5. Technical design assurance

### 5.1 Invoice immutability and audit

**Assessment: DESIGN ADEQUATE WITH IMPLEMENTATION GATES.**

PR #33 §4 defines immutable invoice and line snapshots, append-only invoice lifecycle events and audit records. It denies direct ordinary-role mutation and describes narrowly scoped SECURITY DEFINER RPCs, fixed search path, owner checks and atomic event/audit insertion. It prohibits cascade deletion of invoice facts/history. The digest is correctly treated as an integrity check rather than a replacement for DB permissions.

The design correctly separates invoice facts from revocation state and says correction requires a new invoice. It also says no partial revoke/audit state may commit. These are appropriate design requirements, not proof of deployed privileges or trigger/RPC behavior.

Residual gates: physical schema, constraints/triggers, RLS/grants, privileged break-glass controls, digest serialization/version and backup/restore evidence require later authorized design/implementation/QA.

### 5.2 Number allocation and transaction boundary

**Assessment: DESIGN ADEQUATE AT CONTRACT LEVEL.**

PR #33 §§5.1–5.4 uses a per-shop counter row with row locking, a unique shop/bill-number guard, and one transaction for identity claim, counter increment, invoice, lines, issued event, audit and completion. Failed/rolled-back creation consumes no number; committed numbers are never reused, including after revocation. Same-shop concurrent allocation is serialized; different shops allocate independently.

The lock order is explicit: requested-shop authorization → idempotency identity arbitration → per-shop counter → invoice/lines → lifecycle/audit → registry completion. The losing idempotency contender does not allocate a number. This is a coherent design contract.

No concurrency test was run. Database isolation, lock behavior, retry handling and rollback guarantees remain NOT VERIFIED.

### 5.3 Idempotency and retry recovery

**Assessment: EARLIER P2 DESIGN DEFECT CORRECTED IN THE PINNED TEXT.**

PR #33 §§6.2–6.4 and addendum R.2 define the identity as PRIMARY KEY (idempotency_namespace, request_id), with namespace invoice-create/v1. Shop and operation are comparison attributes, not key components. The design requires requested-shop authorization before registry comparison, exact-match replay only, generic conflict for authorized mismatches, no UUID-existence disclosure for unauthorized shops, no number allocation on conflict, permanent tombstones, and issuance disablement when backup/restore cannot prove registry completeness.

This addresses the earlier PR #33 P2 finding: reuse of a request UUID across shops/operations can no longer fall through to a new identity under the documented uniqueness contract. The response matrix also covers same-owner cross-shop, cross-operation, cross-owner, changed payload, concurrency and incomplete/tombstone cases.

The contract depends on an actual database uniqueness constraint and a private atomic create RPC. The checked-in legacy transaction_requests model is explicitly identified as insufficient by itself. No migration or runtime behavior was inspected or tested.

### 5.4 Financial calculations and input boundaries

**Assessment: DETERMINISTIC TECHNICAL PROPOSAL; BUSINESS SEMANTICS STILL PO-GATED.**

PR #33 §7 uses exact NUMERIC storage, lexical grammar, server-side revalidation, no binary floating-point as calculation authority, per-line rounding to two decimal places using PostgreSQL NUMERIC semantics, then exact summation of persisted line totals. It rejects negative, exponent, grouping-separator, NaN/Infinity, over-scale and overflow values. It supplies 18 golden vectors, including half-cent rounding, per-line versus aggregate rounding and boundary failures.

The design is internally coherent for its stated technical envelope. The 100-line ceiling is expressly provisional, not PO-approved. Zero price/zero-total rejection is a safe interim rule, not a final business decision. Fractional quantity up to three decimal places is a technical proposal, not a PO-approved unit/quantity policy. The printed/public meaning of মূল্য remains blocked by PO-04.

The UX must additionally state how a menu price change between selection and issue is resolved. PR #30 §9.3 says stale menu data must be identified and refreshed/reviewed, but the UX does not define whether issue is blocked, whether a changed line is repriced or whether the owner's reviewed draft price is retained. Do not silently reprice a bill or trust stale client price. CH-2/CH-3 should define a stale-price response contract after PO-06/PO-05/PO-04 decisions.

### 5.5 Security, authorization, tenancy and public DTO

**Assessment: STRONG DESIGN DIRECTION; NO RUNTIME SECURITY ASSURANCE.**

PR #33 §§4, 6, 8 and 9 describe:
- authentication-derived owner identity and requested-shop ownership checks;
- no trust in client-supplied owner IDs;
- private RPC-only idempotency arbitration;
- generic conflict/denial responses and no registry-existence disclosure;
- HMAC-SHA256 with 256-bit random server-side keys, key IDs, constant-time comparison and MAC-before-database lookup;
- per-link and invoice-level revocation, key rotation and compromise response;
- explicit public DTO allow-list and separate minimal revoked state;
- no direct anonymous table reads;
- no-store, no-referrer, noindex, nosniff, CSP/frame restrictions and CDN cache bypass;
- redaction of the entire capability URL from app/proxy/hosting/error/analytics logs;
- distributed rate limits and generic failures;
- text escaping and HTTPS Maps URL allow-list.

These are appropriate controls. HMAC does not encrypt the URL or prevent disclosure by forwarding; the design correctly identifies the QR URL as a bearer capability. A valid signature proves the signed capability, not confidentiality, payment, delivery or merchant regulatory status.

Residual risks: deployed RLS/grants/RPC privileges, KMS/secret isolation, CDN bypass, distributed rate limiting, access-log redaction, CSP, timing behavior and cross-tenant storage policies have not been inspected. The public DTO exposes the shop fields present in the PO mockup; the PO should remain aware that QR possession grants access to that allow-listed shop/bill projection.

### 5.6 Backup, restore and tombstone retention

**Assessment: DESIGN REQUIREMENT IS APPROPRIATE; OPERATIONAL PROOF REQUIRED.**

PR #33 §6.3 says committed idempotency identities are never recycled, minimal tombstones remain after result purge, backup/restore must preserve every acknowledged identity, and issuance must be disabled if registry completeness cannot be proven. This is the correct fail-closed principle.

The actual backup RPO, restore verification, tombstone retention/immutability and reconciliation procedure are not evidenced. Treat these as production-release gates, not assumed capabilities.

---

## 6. Logo and tagline design assurance

### 6.1 Logo state model

The intended effective resolution is explicit Blank override, otherwise valid Uploaded, otherwise Generated default. Blank must never render a placeholder. Uploaded replacement retains the old selection until the new asset is fully validated and stored. Regeneration applies only to Generated and cannot overwrite Uploaded. This is a sound state model.

PR #33 §§B.1–B.3, C.4 and R.3 generally match UX-40/43/45/46/47/48. The explicit state model is materially better than deriving state from a nullable logo_url.

**However, the design contradicts itself about owner confirmation.** See finding CH4-DES-01. The effective default must be implementable without a hidden opt-in step, consistent with the frozen manifest.

### 6.2 Shop type and generated logo

No category may be inferred from shop name, tagline, address or invoice activity. The checked-in schema's legacy shop_type values are evidence of existing data shape, not a PO-approved Invoice-First taxonomy. UX-49/50 and PO-L01 correctly remain gated.

If the stored category is absent, legacy-only or unsupported, PR #33 R.4 permits a category-neutral template only if CH-1/CH-2 approve it; otherwise generation is blocked with an actionable category-selection error. Until PO-L01 and the fallback are resolved, the default Generated state may not be renderable for every shop. This is a capability-specific blocker, not permission to infer food category.

### 6.3 Upload security

PR #33 §D specifies raster-only initial upload, rejection of SVG/active content, untrusted MIME/filename handling, magic-byte detection, resource-limited decoding, dimensions/pixel caps, EXIF/GPS metadata stripping, normalized PNG re-encoding, digest/version recording, private object storage, tenant checks and immutable asset retention. These are appropriate controls.

The proposed 2 MiB / 2048×2048 / 4.19 MP limits are technical proposals, not PO-approved limits. PO-L03 remains pending. Logo upload must remain disabled until accepted formats/limits/ownership wording are decided and the trusted decoder/storage implementation is independently verified. A browser-side file check alone is insufficient.

### 6.4 Tagline

PR #33 §E defines optional plain text, blank/whitespace normalization to NULL, NFC normalization, no generation/translation, separation from logo state, context-safe escaping, grapheme-aware counting and a proposed 80 grapheme-cluster limit. UX-54–59 cover language and independence.

The 80 limit is not approved. Emoji, bidi/control characters, line breaks and multiline policy require an explicit accepted/rejected corpus; the design correctly says not to silently strip/rewrite visible text. Tagline should remain an optional capability and may be omitted until PO-L04 is decided. It must never be sent as logo-generation input.

### 6.5 Historical invoice header snapshot

PR #33 §§F/H and HDR-01..06 define an immutable header snapshot including logo mode, immutable asset bytes/version/digest, generated-artifact provenance, tagline snapshot and document schema version. They correctly prohibit re-rendering historical invoices from the current profile or substituting a current logo when a historical asset is missing.

PO-L02 is still pending, so this historical-header promise is not yet an approved business commitment. The design also needs a precise concurrency protocol to guarantee that invoice issue captures one coherent profile revision while a profile edit/upload/tagline update occurs concurrently. The presence of a proposed profile_revision field and HDR-06 test is not by itself a transaction/locking algorithm. See CH4-DES-02.

---

## 7. Bengali, PDF, print and customer experience

**Assessment: DESIGN SPECIFICATION IS GOOD; REPRODUCIBILITY AND PRINT RELEASE ARE BLOCKED BY MISSING APPROVAL/ARTIFACTS.**

Positive design controls:
- Exact heading/footer literals are preserved as text, not image-only content.
- Noto Sans Bengali v3.011 source commit and OFL provenance are pinned.
- The exact font binary SHA-256 is explicitly not asserted until the file is vendored.
- Server-side Chromium/Playwright rendering is proposed with pinned container digest, local font, fixed locale/timezone and no external network.
- One semantic InvoiceDocument projection drives preview/PDF/print.
- Long names wrap; long bills paginate; rows are not split; QR/total/footer are kept together where possible.
- The addendum distinguishes visual/text reproducibility from byte-for-byte PDF hash reproducibility when PDF metadata varies.
- QR quiet-zone, contrast and physical scan tests are specified but not executed.

Outstanding release gates:
1. Vendor exact font binary and OFL; record and verify binary SHA-256.
2. Pin Chromium/Playwright/container image digest.
3. Decide PO paper profile and readable-size threshold (PO-01).
4. Decide normal bill corpus/maximum line expectations and page numbering.
5. Decide printed price semantics (PO-04), quantity/unit policy (PO-05), timezone/display policy and WhatsApp wording.
6. Run the Bengali corpus, PDF text/font inspection, pagination, target browser/print and physical QR scan only under later QA authorization.

No PDF was generated or inspected in this review. Browser-native print is correctly treated as a fallback rather than a reproducible artifact.

---

## 8. PO decision dependency matrix

Issue #31 contains CH-1 proposals and decision requests, but no PO-authored approval/modification/defer response was found. All requested decisions remain PENDING-PO. Recommendations or technical design text are not approvals.

| Decision | Current status | Capability affected | Safe interim / what may proceed |
|---|---|---|---|
| PO-02 online/offline promise | PENDING | Offline issue and public verification promise; release claim | Fail closed offline. Online-only design may continue as a proposal; no offline issuance claim. Final customer promise/release remains gated. |
| PO-04 meaning of মূল্য | PENDING | Printed/public price columns | Store unit price and line amount internally; do not finalize printed/public column semantics. |
| PO-05 quantity, units, repeated lines | PENDING | Composer quantity semantics and line display | Keep technical decimal vectors as proposals; no final unit/fraction/repeated-item behavior. |
| PO-06 menu fields/lifecycle | PENDING | Menu CRUD, active/inactive selection, deletion/archive/restore | Keep menu lifecycle controls absent/gated; do not infer active-only selection. |
| PO-11 revoke/correct and customer state | PENDING | Owner revocation UI and customer revoked page | Keep invoice facts immutable; do not expose unapproved cancellation details. Public revocation behavior remains gated. |
| PO-12 link lifetime | PENDING | Public bill QR/link availability and expiry | Non-expiring bearer link is only an explicitly risky interim proposal, not approval. Do not release public link until decided. |
| PO-I11 verification wording | PENDING | Customer-facing verified state/copy | No claim of payment/delivery verification. Final wording blocked. |
| PO-I06A key-compromise acknowledgement | PENDING | Production signing-key use/public verification risk acceptance | Engineering controls remain mandatory; public verification production release blocked pending risk decision. |
| PO-L01 category taxonomy | PENDING | Category-dependent generated logo | No category inference. Generated category-specific output gated; neutral fallback only after CH-1/CH-2 approval. |
| PO-L02 historical header snapshot | PENDING | Historical logo/tagline reprint/public/PDF promise | Do not promise historical logo/tagline behavior until policy and retention are approved. Existing invoice fact immutability remains. |
| PO-L03 upload formats/limits/rights | PENDING | Uploaded logo feature | Keep upload disabled; generated/blank design can be developed separately subject to category/default gates. |
| PO-L04 tagline policy/80 grapheme proposal | PENDING | Tagline input and length limit | Keep tagline optional or omit until policy/limit and line-break/control behavior are approved. Do not enforce 80 as approved policy. |

### Capability separation

- **Shop profile / A1:** independent of the invoice/menu/public-verification PO decisions, but subject to A1 PM decisions and its own technical findings in §10.
- **Invoice core data model and transactional design:** can continue as design work; final customer-facing invoice cannot be accepted while PO-04/05 and relevant display rules remain unresolved.
- **Menu:** blocked by PO-06/PO-B01–B07 and duplicate policy.
- **Offline issuance:** excluded by safe interim; no offline issuance capability.
- **Public bill QR/verification:** blocked by PO-12, PO-I11, PO-I06A and security/runtime evidence. The mockup confirms the QR's identity/content role, not the protocol/lifetime/risk acceptance.
- **Logo generation:** blocked where approved category or neutral fallback is absent; no category inference.
- **Logo upload:** blocked by PO-L03 and technical/storage/security evidence.
- **Historical logo/tagline header:** blocked by PO-L02 and atomic snapshot/retention evidence.
- **Tagline:** optional capability blocked by PO-L04 policy and rendering/security evidence.
- **PDF/print:** blocked by PO-01 and font/renderer artifacts plus authorized rendering/print evidence.
- **WhatsApp:** fallback behavior can be designed; final message copy remains PO-gated.

---

## 9. Cross-document consistency and menu-lifecycle thread

### 9.1 PR #30 menu lifecycle P2

The original PR #30 inline finding 4523203685 / thread PRRT_kwDOVhBFWs61okrS states that deactivation, deletion and reactivation were presented as requirements even though PO-B01–B07 were not established in the authority register.

**CH-4 conclusion: the substantive concern is resolved in UX revision 0.2.** Section 4.2 now explicitly labels lifecycle presentation PO-GATED, prohibits inferring owner-facing behavior from the existing is_active column, withholds Add/Edit/Deactivate/Activate/Delete as a frozen contract, and leaves duplicate-name policy to PO-07. UX-07–UX-09 and the PO decision register preserve those gates. The old inline thread remains OUTDATED / UNRESOLVED in GitHub; this report recommends that CH-1 resolve it with a reference to this exact UX blob after recording the disposition. CH-4 did not modify the thread.

### 9.2 PR #33 idempotency P2

The prior PR #33 finding 4524063634 / thread PRRT_kwDOVhBFWs61qlql is RESOLVED by CH-1. Independent static inspection confirms that the exact v0.3.2 text now uses namespace+request UUID as the sole identity key, checks requested-shop authorization before registry comparison, uses generic conflict responses and retains tombstones. The old thread is outdated because its original lines changed. No runtime conclusion is implied.

### 9.3 PR #32 AC-10 P2

The PR #32 finding 4523839564 / thread PRRT_kwDOVhBFWs61qEd7 is RESOLVED. The exact A1-AC-10 wording correctly says that A1 must not introduce/change/regress unrelated existing flows and that acceptance is judged on A1 diff/regression evidence, not by requiring existing memo/PDF, WhatsApp, stock, customer-ledger or Master QR capabilities to be absent.

### 9.4 Remaining cross-document inconsistencies

- PR #33 addendum R.11 still says “No CH-1 acceptance or CH-4 freeze is claimed,” and earlier controlled-addendum status text still refers to CH-1 re-review being required. The frozen manifest now records CH-1 acceptance for CH-4 static review. Update the stale statements without altering the technical decision itself.
- PR #32 §§12.9–12.10 still describe the pending CH-4 review as a review of PR #28 v0.2 and the Phase A1 package, and list PR #30 as pending engineering. The frozen manifest supersedes PR #28 with PR #33 for current technical review and pins PR #30 revision 0.2. Update the authority register to preserve historical PR #28 evidence but point current status to PR #33 and this final CH-4 review.
- PR #33 §G.2 and §I contain the generated-logo owner-confirmation contradiction identified in CH4-DES-01.
- UX-42 needs wording consistent with the frozen manifest that preview is informative, not a separate opt-in.

---

## 10. PR #32 / Phase A1 review — separate from Invoice-First MVP

Phase A1 is a profile-only work package: create/view/edit shop name, address, mobile number and Google Maps URL in the existing Next.js/Supabase application. It excludes menu, invoice, QR, PDF, print, WhatsApp, customer ledger, inventory and other dashboard functionality. This review keeps A1 separate from the active Invoice-First MVP.

### 10.1 Positive design controls

- A1-AC-03 prohibits item_catalog, stock, memo, customer and ledger side effects.
- A1-AC-05 updates the same shop row and preserves unrelated fields.
- A1-AC-08 requires cross-tenant negative tests.
- A1-AC-10 is correctly corrected to scope regression assurance to A1 changes and preserve existing non-A1 capabilities.
- The package acknowledges that repository SQL/schema is not proof of deployed Supabase RLS/grants.
- It prohibits unauthorized SQL/migrations, service-role exposure, user_id trust and unapproved unique user_id indexes.

### 10.2 A1 readiness findings

The exact PR #32 §12.6 repository snapshot records that existing createShop inserts default item_catalog rows; the current profile form requires only shop_name and lacks a complete edit flow; live RLS/schema/grants are unverified; normalizeBdPhone is a WhatsApp helper, not a validator; and shop cardinality is not database-enforced.

These are source-snapshot findings, not runtime verification. A1 implementation must use an isolated create path, require/validate the approved fields, support create/view/edit, preserve unrelated fields and prove zero catalog/stock/ledger side effects. Live tenant isolation cannot be accepted until separate read-only staging inspection and later authorized two-user tests occur.

The proposed mobile grammar in §12.8 rejects letters and permits digits plus common formatting characters, but does not explicitly require at least one digit after stripping formatting. Thus values such as only plus signs, spaces, hyphens and parentheses could pass the stated character allow-list. Require at least one ASCII digit, while leaving Bangladesh-specific prefix/length rules to an explicit PM/PO decision.

### 10.3 A1 acceptance/testability

A1-AC-01..10 are a useful future test package, not executed evidence. A1-AC-06/07 cover invalid values, preservation and retry, but the package should add a field-by-field matrix for all four fields: empty/whitespace, malformed, valid, boundary, save failure, retry, reload and edit preservation. No live RLS proof exists. The current A1 PM decisions A1-PM-01..05 remain separate approval gates.

---

## 11. Findings register

Severity vocabulary: BLOCKER / P0 / P1 / P2 / P3 / OBSERVATION. “Blocks” refers to a design/capability gate, not runtime status.

### CH4-DES-01 — Generated default versus explicit confirmation contradiction

- **Severity:** P1
- **Artifact:** PR #33 exact HEAD 898c834c30ec84599a6fa7c333d3da18ca235c30, blob 9a1753d3bcba680961b39b91e320d1f59d70cd14.
- **Sections/evidence:** §§B.1 and C.4 say Generated is the default and preview does not gate the mode; §R.3 says no separate opt-in. In contrast, §G.2 says select_generated_logo “requires owner-confirmed selection” and regenerate_logo uses “preview then explicit selection”; §I's PM-LOGO-02 says generated fallback is “subject to explicit owner selection.” UX-40/42 and the frozen manifest define Generated as default and preview as informative, not opt-in.
- **Principle affected:** Single authoritative state-transition contract; UX-40/42; no hidden owner opt-in.
- **Failure scenario:** One implementation follows C.4 and automatically resolves Generated; another follows G.2/I and waits for confirmation. A new shop may show a generated preview but fail invoice issue until the owner confirms, contradicting the specified default.
- **Impact:** Logo state inconsistency, blocked invoice issue, inconsistent owner/customer/PDF/print output and avoidable support burden.
- **Required correction:** Distinguish implicit default resolution from explicit owner actions. Initial no-upload/no-Blank profile resolves to GENERATED without opt-in. Preview is informational. Explicit confirmation is required only for a separate user action if one is actually defined. Regeneration should create a deterministic new candidate/version and not silently change an already issued snapshot. Update G.2, I and LG test descriptions consistently.
- **Owner:** CH-3, with CH-2 cross-check.
- **Closure evidence:** One state-transition table and one service contract with no conflicting selection/confirmation semantics; crosswalk to UX-40/42/45/47/48 and LG-08/09/12.
- **Blocks:** Generated-logo capability and invoice issue when Generated is the resolved required header mode; does not block unrelated A1 or invoice calculations.

### CH4-DES-02 — Invoice/header snapshot concurrency protocol is not fully specified

- **Severity:** P1
- **Artifact:** PR #33 exact HEAD/blob above.
- **Sections/evidence:** §§F.1–F.2 require an immutable header snapshot; §G.1 proposes profile_revision; §G.2 defines update operations with expected_profile_revision and an internal get_invoice_header_snapshot projection; HDR-01 and HDR-06 require atomic snapshot and concurrent profile-edit/issue behavior. However, the invoice-create transaction/lock order in §§5–6 does not specify how it locks or version-checks the shop profile revision while capturing shop fields, logo state/asset version and tagline. The design does not define the serialization outcome for a concurrent profile update and invoice issue.
- **Principle affected:** Atomic snapshot consistency; immutable invoice evidence; no mixed-version header.
- **Failure scenario:** An invoice issue reads shop name/address from profile revision N, a profile update commits revision N+1 and changes logo/tagline, then issue reads the new asset/tagline. The resulting invoice may contain a header assembled from two profile revisions, despite each individual row being valid.
- **Impact:** Historical invoice misrepresentation, non-reproducible reprint/PDF, customer disputes and broken audit evidence.
- **Required correction:** Define one explicit transaction protocol: lock or compare-and-snapshot one profile revision; read all header fields and logo/tagline references from that revision; ensure referenced immutable asset is durable; insert invoice/header snapshot within the same issue transaction; define lock order against profile updates and upload finalization; retry/fail on revision change. Do not rely on an application-level sequence of unrelated reads.
- **Owner:** CH-3.
- **Closure evidence:** Documented lock/isolation/version protocol, deadlock order, concurrent issue/edit acceptance vectors and proof that snapshot references cannot be garbage-collected.
- **Blocks:** Invoice issuance with logo/tagline/header snapshot enabled and historical-header assurance; does not block isolated A1 design or non-header technical design.

### CH4-DES-03 — Public QR bearer-link policy remains a release gate

- **Severity:** P1
- **Artifact:** PR #33 §§8–9; Issue #31.
- **Evidence:** §8.1 states the URL is bearer access and HMAC does not encrypt claims. §8.2 proposes expiresAt=0 (non-expiring) while PO-12 is pending. §8.5 says old keys cannot be retired while active non-expiring links remain. PO-I06A acknowledgement is also pending.
- **Principle affected:** Least exposure, informed risk acceptance, key lifecycle and customer privacy.
- **Failure scenario:** A printed QR or forwarded URL remains usable indefinitely until link/invoice revocation; a signing-key compromise requires revoking all affected links and reissuing/re-sharing them.
- **Impact:** Long-tail unauthorized disclosure of allow-listed shop/bill data, operational key-retention burden and customer trust risk.
- **Required correction/control:** Obtain explicit PO-12 and PO-I06A decisions. Keep public verification disabled until expiry/lifetime and compromise risk are accepted and KMS, revocation, rate limiting, redaction, cache bypass and incident response are evidenced. Do not treat the proposed non-expiring interim as approval.
- **Owner:** PO for policy; CH-3 for engineering controls; PM for release gate.
- **Closure evidence:** Explicit PO decision with exact wording plus separately authorized security evidence.
- **Blocks:** Public QR/link verification only; invoice data model and A1 remain separable.

### CH4-DES-04 — PDF reproducibility artifacts are not yet pinned

- **Severity:** P1
- **Artifact:** PR #33 §11.1–11.4 and §§H.1–H.3.
- **Evidence:** Noto Sans Bengali v3.011 source commit and OFL provenance are identified, but the exact TTF binary SHA-256 is not recorded. Chromium/Playwright/container digest is not selected. The document explicitly calls both implementation artifacts release gates.
- **Principle affected:** Reproducibility, font integrity/licensing and stable customer document output.
- **Failure scenario:** A font or renderer update changes Bengali shaping, line wrapping, pagination or embedded font behavior while the same invoice snapshot is expected to reproduce.
- **Impact:** Incorrect/illegible Bengali output, altered printed evidence and customer disputes.
- **Required correction/control:** Vendor the exact licensed font and hash it; include OFL; pin the renderer/container digest and template version; distinguish visual/text equivalence from byte-for-byte PDF identity; execute corpus and print/QR evidence only after separate QA authorization.
- **Owner:** CH-3.
- **Closure evidence:** Font manifest with binary SHA-256/license, renderer digest, fixture corpus and later authorized PDF/print evidence.
- **Blocks:** Reproducible PDF/print release; not invoice persistence or A1.

### CH4-UX-01 — UX-42 preview requirement conflicts with “preview is informative”

- **Severity:** P2
- **Artifact:** PR #30 exact HEAD c7b0d8bddad3afcdf48b0b8fba8331ad46dda309, blob 3b34e6b9075b65ee027ac368fb964a5f9e98ae8f.
- **Section/evidence:** UX-42 says “Owner previews generated logo before invoice use.” Frozen manifest §6 and PR #33 §§B.1/C.4/R.3 state preview is informative and not an opt-in gate.
- **Principle affected:** Unambiguous user journey and consistent default-state contract.
- **Failure scenario:** UX/test interprets preview as a mandatory precondition, while the technical service automatically resolves Generated without owner confirmation.
- **Impact:** Different acceptance outcomes and unnecessary onboarding/issue friction.
- **Required correction:** Rewrite UX-42 to require that a preview is available and accurately reflects the generated mark, while explicitly stating that preview/confirmation is not required for the default Generated state.
- **Owner:** CH-2.
- **Closure evidence:** Revised criterion and aligned UX→technical→LG test mapping.
- **Blocks:** Generated-logo UX acceptance only.

### CH4-A1-01 — A1 mobile grammar permits format-only values

- **Severity:** P2
- **Artifact:** PR #32 exact HEAD 38068e159939aa963807b4cbdfc3fc26cbd3abee, blob 1782e4eb3816f5ce03d900aebbbafd1e0a427a78.
- **Section/evidence:** §12.8 proposed validation says non-empty, rejects letters and permits digits plus +, spaces, hyphens and parentheses, but does not require any digit after stripping allowed formatting.
- **Principle affected:** Input validity and clear test oracle without inventing country-specific numbering policy.
- **Failure scenario:** A value consisting only of allowed punctuation/whitespace passes the stated character grammar.
- **Impact:** Invalid contact value in shop profile and invoice header; avoidable customer-contact failure.
- **Required correction:** Require at least one ASCII digit after stripping allowed formatting. Keep Bangladesh-specific prefix/length rules pending explicit PM/PO decision; do not invent them.
- **Owner:** CH-3, with CH-1 approval of validation boundary.
- **Closure evidence:** Updated validator contract and positive/negative vectors: punctuation-only rejected; valid formatted digits accepted; no unsupported national-format claims.
- **Blocks:** Phase A1 mobile-field acceptance only.

### CH4-GOV-01 — PR #32 authority register contains stale review references

- **Severity:** P2
- **Artifact:** PR #32 exact HEAD/blob above.
- **Sections/evidence:** §§12.9–12.10 still say no independent review of PR #28 v0.2/A1 has occurred and list Issue #27 as pending review of PR #28 v0.2; they describe PR #30 as pending engineering. The frozen manifest makes PR #33 the current technical successor and pins PR #30 revision 0.2 for CH-4 review.
- **Principle affected:** GitHub SSOT accuracy, current-vs-historical artifact provenance and auditability.
- **Failure scenario:** A later implementer/reviewer follows the authority register and treats PR #28 as current technical design or believes CH-4 review is still pending against the obsolete v0.2 candidate.
- **Impact:** Wrong design baseline, duplicated review effort and inconsistent governance status.
- **Required correction:** Preserve PR #28 as historical/unmerged evidence, point current technical review to PR #33 exact HEAD/blob, update PR #30 status to the frozen revision, and record the resulting CH-4 report/PR link and disposition after publication.
- **Owner:** CH-1.
- **Closure evidence:** Updated register on PR #32 with exact SHA/blob references and a status cross-check against Issue #27.
- **Blocks:** Governance baseline accuracy and controlled implementation handoff; does not block independent technical work itself.

### CH4-DES-05 — PR #33 controlled addendum retains stale CH-1 acceptance statements

- **Severity:** P2
- **Artifact:** PR #33 exact HEAD/blob above.
- **Sections/evidence:** Addendum v0.3.1 header says CH-1 acceptance is not granted / re-review required; R.11 says “No CH-1 acceptance or CH-4 freeze is claimed.” The frozen manifest §5 now records CH-1 acceptance of the exact PR #33 HEAD/blob for CH-4 static review.
- **Principle affected:** Document status integrity and frozen-manifest consistency.
- **Failure scenario:** Readers treat the technical candidate as not accepted for CH-4 review or conclude the manifest was not applied.
- **Impact:** Conflicting governance evidence and uncertainty over review authority.
- **Required correction:** Update the stale status language to say that the exact document is accepted for CH-4 static review under the frozen manifest, while explicitly retaining that implementation, runtime QA, merge, deployment and pilot are not authorized.
- **Owner:** CH-3.
- **Closure evidence:** Corrected status text with manifest ID and exact reviewed HEAD/blob; no change to technical contracts without a separate review.
- **Blocks:** Controlled technical-design handoff/status only.

### CH4-A1-02 — A1 profile criteria need field-level test traceability

- **Severity:** P2
- **Artifact:** PR #32 §12.8; PR #30 UX-01..UX-05.
- **Evidence:** A1-AC-06/07 define required-field errors and failed-save preservation, but the package does not provide a complete field-by-field matrix across shop name, address, mobile and Maps URL, including empty/whitespace, malformed, valid, boundary, failure, retry, reload and edit preservation.
- **Principle affected:** Requirement-to-test traceability and complete negative/recovery coverage.
- **Failure scenario:** A single generic “invalid form” test passes while one field lacks correct validation or loses its value on failed save.
- **Impact:** Incomplete shop identity or poor recovery during onboarding.
- **Required correction:** Add a four-field test matrix and map each vector to A1-AC and future unit/UI test IDs. Do not execute tests under this review.
- **Owner:** CH-2 / CH-3.
- **Closure evidence:** Updated A1 test crosswalk and expected validation outcomes.
- **Blocks:** A1 design/testability acceptance only.

### CH4-OBS-01 — IndexedDB outbox data lifecycle needs an explicit privacy contract

- **Severity:** OBSERVATION
- **Artifact:** PR #33 §§6.2–6.4.
- **Evidence:** The browser persists canonical request payload and request identity in IndexedDB for unknown-outcome recovery; terminal states say pending request may be cleared, but logout/session expiry, shared-device exposure, retention/cleanup and owner re-authentication binding are not fully specified.
- **Principle affected:** Data minimization and recovery-store confidentiality.
- **Failure scenario:** A shared shop device retains a pending invoice payload after account logout or owner change and a subsequent user can inspect/replay it through the same browser profile.
- **Impact:** Local disclosure of shop transaction data or incorrect recovery under another authenticated owner.
- **Recommended control:** Define outbox owner/shop binding, logout/session-expiry behavior, terminal cleanup, maximum retention and re-authentication before replay. Do not store bearer URL/MAC/secret in the outbox.
- **Owner:** CH-3.
- **Closure evidence:** Explicit client outbox lifecycle and negative recovery scenarios.
- **Blocks:** IndexedDB recovery UX only; server-side idempotency design remains valid.

---

## 12. Earlier CH-4 v0.1 findings reconciliation

The original review reported one BLOCKER and ten MAJOR findings. The frozen PR #33 design now contains direct design-level responses for immutable invoice facts/audit, transactional numbering, global namespaced idempotency, canonical payload and lost-response recovery, exact decimal/rounding rules, Bengali font provenance/renderer plan, public DTO/tenant boundaries, online-only interim boundary and positive/negative acceptance scenarios.

**CH-4 conclusion:** the prior findings are substantially addressed in the exact PR #33 document at the design-contract level. This is not runtime closure. The design still requires implementation of the specified database/RPC/security controls and authorized evidence. The residual PR #33 findings in §11 concern the later Logo/Tagline integration and status consistency; they do not imply that the earlier P2 idempotency defect remains in the pinned v0.3.2 text.

---

## 13. Design completeness, testability, runtime verification and readiness

| Assurance dimension | CH-4 assessment | Explanation |
|---|---|---|
| PO-confirmed content traceability | ACCEPTED AT DOCUMENT LEVEL | Confirmed Bangla heading/footer, shop identity, bill metadata, line fields, total and bill-specific QR are mapped. |
| UX completeness | ACCEPT WITH CONDITIONS | UX-01..64 present; UX-42 ambiguity and profile test traceability need correction; PO-gated criteria remain gated. |
| Core invoice architecture | ACCEPT WITH CONDITIONS | Transaction, idempotency, immutability, numbering and privacy contracts are coherent at design level. |
| Logo/tagline integrated design | NEEDS REVISION | Generated-default contradiction and snapshot concurrency protocol require correction; PO-L01..L04 remain pending. |
| PDF/print design | ACCEPT WITH CONDITIONS | Good rendering contract; font binary and renderer digest absent; paper profile pending. |
| Security design | ACCEPT WITH CONDITIONS | Strong controls specified; KMS, RLS, storage, CDN/log/rate-limit runtime evidence absent. |
| Phase A1 design package | ACCEPT WITH CONDITIONS | Scope and AC-10 are correct; mobile grammar and field-level test mapping need correction; live RLS unknown. |
| Runtime verification | NOT PERFORMED | Explicitly prohibited by frozen manifest. |
| Implementation readiness | NOT READY / NOT AUTHORIZED | PO decisions, technical corrections, implementation design, DB/security controls and separate authorizations remain. |
| Production readiness | NOT READY | No implementation/runtime evidence, no production security verification, no PDF/print evidence and no PO closure. |
| Merge/release/pilot | NOT AUTHORIZED / NO-GO | This report does not grant any of these permissions. |

---

## 14. Capability-specific blockers and safe sequencing

1. **A1 profile foundation:** can be planned independently of invoice PO decisions. Before implementation, correct the phone grammar, add field-level test mapping, resolve A1-PM-01/02/03, and separately authorize read-only staging RLS inspection and QA execution. Existing createShop side effect and missing edit flow must be corrected in the implementation candidate.
2. **Menu:** remain blocked until PO-06/PO-B01–B07 and duplicate policy are explicitly decided. No lifecycle inference from is_active.
3. **Invoice composer/issue:** technical transaction design is coherent, but final customer-facing quantity and price semantics remain gated by PO-04/PO-05/PO-06. Do not accept stale price silently; define stale-price behavior.
4. **Public QR/verification:** remain blocked pending PO-12, PO-I11 and PO-I06A plus KMS, revocation, redaction, cache, rate-limit and tenant-security evidence.
5. **Offline issuance:** not supported. Do not represent IndexedDB outbox as offline invoice issuance.
6. **Generated logo:** correct the default/confirmation contradiction; resolve category taxonomy/fallback. No category inference.
7. **Uploaded logo:** remain disabled pending PO-L03 and verified raster processing/private storage/tenant isolation.
8. **Tagline:** remain optional/omittable pending PO-L04; do not treat 80 grapheme clusters as approved.
9. **Historical logo/tagline:** no promise until PO-L02 and profile-revision snapshot protocol/asset retention are closed.
10. **PDF/print:** no reproducibility claim until font binary hash, renderer digest, PO page profile and authorized Bengali/PDF/QR print evidence exist.
11. **WhatsApp:** can retain persisted-snapshot share and fallback design; final message wording remains PO-gated.

Pending PO decisions do not prevent unrelated A1 planning or static engineering refinement. They do prevent the affected customer-facing capabilities from being represented as approved or release-ready.

---

## 15. Required owner actions

| Owner | Required action |
|---|---|
| CH-1 | Update PR #32 authority register to reference PR #33 as current successor and this CH-4 report; preserve PR #28 historical status. Resolve PR #30 menu thread after recording the substantive closure against exact UX blob. |
| CH-2 | Clarify UX-42 so preview availability is not confused with required opt-in; add stale menu-price change/review UX; add profile field-level acceptance crosswalk. |
| CH-3 | Resolve generated-logo default/confirmation contradiction across §§G/I; define atomic profile-revision/header snapshot transaction and lock order; update stale CH-1 acceptance text; define IndexedDB outbox privacy lifecycle; complete font/renderer artifact manifest before PDF release. |
| PO | Decide PO-02, PO-04, PO-05, PO-06, PO-11, PO-12, PO-I11, PO-I06A, PO-L01, PO-L02, PO-L03 and PO-L04 using explicit APPROVE/MODIFY/DEFER responses. |
| PM | Keep implementation, DB inspection, tests, merge, deployment and pilot separately gated. Decide A1-PM-01..05 independently of invoice/menu decisions. |

---

## 16. Final recommendation

**Overall: NEEDS REVISION.**

PR #30 is ACCEPT WITH CONDITIONS at the UX design level, with the menu lifecycle P2 substantively resolved but its old inline thread still unresolved in GitHub. PR #33 is NEEDS REVISION because generated-logo default semantics conflict across its own controlled sections and the header snapshot concurrency protocol is not complete. PR #32 is NEEDS REVISION as a governance register because its review references are stale and its A1 phone grammar lacks a digit requirement; the Phase A1 scope itself remains ACCEPT WITH CONDITIONS after correction and PM gates.

The earlier invoice-core CH-4 v0.1 findings are substantially addressed in the frozen technical design at document level. No test, security control, database policy, PDF or customer journey has been runtime-verified. All proposed acceptance scenarios remain NOT EXECUTED.

**This report is not implementation authorization.** Application code, SQL/schema/migrations, live database inspection, builds, tests, browser QA, PDF generation, security probes, merge, deployment, release and financial pilot remain prohibited by the frozen manifest.