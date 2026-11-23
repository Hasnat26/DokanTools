# PR #47 — Post-Merge V1 Software Closeout

**Closeout date:** 2026-11-23  
**Repository:** `Hasnat26/DokanTools`  
**PR:** [#47 — CH-1–CH-4: Configurable Bill/Memo MVP](https://github.com/Hasnat26/DokanTools/pull/47)  
**Target branch:** `delivery/dokantools-v1-2026-11-19`  
**Merge commit / verified branch HEAD:** `2f257211e5f296d49b7ccf30e50fedcb2530a9f5`  
**Post-merge CI:** [Run #199 — 45166285135](https://github.com/Hasnat26/DokanTools/actions/runs/45166285135)  
**Status:** 5/5 required jobs PASS; software closeout evidence complete; external acceptance and PO release decision remain outstanding.

## 1. Merge and CI record

PR #47 was merged using a merge commit. The PR's candidate was `43c04e220f8e7fd3589b1038db230f73aea9812a`; the resulting merge commit and delivery branch HEAD are `2f257211e5f296d49b7ccf30e50fedcb2530a9f5`.

Run #199 completed successfully against the exact merge commit. Required jobs:

| Job | Job ID | Result |
|---|---:|---|
| Chromium authenticated V1 workflow and fresh A6 PDF | 137663956967 | PASS |
| A6 PDF artifact verification | 137663957489 | PASS |
| Unit tests (including A6 PDF assertions) | 137663957547 | PASS |
| PostgreSQL 17 category tenant-integrity regression | 137663957570 | PASS |
| Application build and startup | 137663957626 | PASS |

Unit test result: 113 total; 111 passed, 0 failed, 2 skipped. Chromium test result: 1 expected/pass, 0 skipped, 0 unexpected, 0 flaky; test duration 7.745 seconds (Playwright reported 10.1 seconds including runner overhead).

## 2. Functional validation matrix

Evidence is from the merged-state authenticated Chromium workflow, disposable local Supabase Auth/PostgreSQL, automated unit tests, and the retained A6 PDF artifact. These are CI-controlled test results, not live customer or production tests.

| Function | Result | Evidence |
|---|---|---|
| Shop Profile create/edit and persistence after reload | PASS | Authenticated browser test |
| Shop logo default, upload, replace, remove, persist/reload | PASS | Authenticated browser test |
| Google Maps URL validation and persistence | PASS | Invalid URL rejected; supported HTTPS Maps URL retained |
| Public profile enable/disable and QR destination | PASS | QR decoded and destination matched |
| Category create, rename, persistence, delete | PASS | Authenticated browser test |
| Two catalogue products, edit, category assignment and reload | PASS | Authenticated browser test |
| Inventory-linked catalogue rename/delete protection | PASS | Browser test; blocked operations produce expected user errors |
| Multi-product Draft Memo calculation | PASS | Subtotal, discount, VAT/tax, paid and due calculations/validation |
| Draft save/edit/reload/delete | PASS | IndexedDB lifecycle exercised in browser |
| Print handler invocation | PASS (simulated) | `window.print()` intercepted by test; no OS print dialog or physical printer tested |
| PDF generation, download and content integrity | PASS | Fresh PDF generated; download signature/content verified |
| Share API and unsupported-share fallback | PASS (browser simulated) | `navigator.share/canShare` stubbed; shared PDF bytes/hash matched download |
| Stale PDF invalidation after line removal | PASS | Download/Share disabled; regenerated PDF excludes removed line and shows updated total |
| PDF invalidation after line add/edit | PASS | Download/Share disabled until PDF regenerated |
| Authenticated two-user category tenant isolation | PASS | Local Supabase Auth/PostgREST/RLS test; second user cannot read, insert, update or delete owner's category |
| PostgreSQL category and stock/catalogue integrity | PASS | PostgreSQL 17 regression job |
| Application build, lint, typecheck and startup | PASS | Application CI job |
| Invoice issuance disabled state | PASS | Migration parity + API guard + DB runtime control reviewed below |

### A6 PDF artifact

- [Run #199 evidence artifact ZIP](https://github.com/Hasnat26/DokanTools/actions/runs/45166285135/artifacts/14813994191)
- Artifact name: `dokantools-v1-chromium-a6-45166285135`
- Artifact ZIP SHA-256: `1160a7d43b16484299daa202c39096ec6c98e7ac9669ca0f2e9edcdaec19d5c7`
- Fresh PDF SHA-256: `281ca91e7594acfe29030ae7bdfc3da1b181f9c6bf0f645a52aa8db81a450d3d`
- One page, portrait A6: 297.638 × 419.528 pt; MediaBox and CropBox within 0.1 pt of expected A6.
- 33 text bounding boxes checked; 0 out-of-bounds text; 0 out-of-bounds images.
- Expected bill content, QR decode and Google Maps link annotation verified.
- PDF explicitly states **DRAFT ONLY — NOT AN ISSUED INVOICE**.
- PDF output is English-only; Bengali glyph rendering is not part of this verified acceptance.

## 3. Security, data integrity and invoice control

- Authenticated shop ownership is enforced in the application and RLS-backed data access.
- The disposable local Supabase browser test created two synthetic Auth users and verified category isolation through Auth/PostgREST.
- PostgreSQL 17 category tenant-integrity and stock-linked catalogue guard regression passed.
- Full repository migration chain was applied to disposable local Supabase; migration parity and local dry-run checks passed. No hosted migration was run.
- API `POST /api/invoices` validates the request shape, then returns HTTP `423` with `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL`. This was exercised by the build/startup CI guard.
- Database `invoice_runtime_controls.issue_enabled` is seeded false; table privileges are revoked from `public`, `anon` and `authenticated`. The security-definer transaction RPC checks this control and raises `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL` before invoice writes when false. Authenticated EXECUTE on that RPC exists, so the database control itself is the enforcement point for direct RPC calls; the API additionally has a hard-coded fail-closed guard.
- No alternate invoice-creation API route was found in the `src/app/api` route tree; the invoice route has GET history and POST create, while the invoice-id route is read-oriented.
- No invoice issuance activation, production write, deployment, hosted migration, financial transaction or customer pilot occurred.

## 4. External acceptance — NOT VERIFIED

| Item | Status | Required acceptance |
|---|---|---|
| Android Chrome native share sheet | NOT VERIFIED | Test on a physical Android device/browser; capture device, Android/Chrome version and outcome |
| WhatsApp PDF delivery to a real recipient | NOT VERIFIED | Send to a designated test recipient, verify PDF attachment and recipient-side open |
| Physical A6 printer | NOT VERIFIED | Record printer/model/driver, 100% scale, page size, margins, clipping and readability |
| OS print dialog / print driver | NOT VERIFIED | Manual end-to-end test; CI only intercepts the browser print handler |

Browser Web Share behavior is simulated in Playwright. It does not establish Android native sharing or WhatsApp recipient delivery.

## 5. Documentation and known boundaries

This closeout is the canonical PR #47 post-merge evidence record. Related scope and stage documents should link to this file and must not retain pre-merge statements that PR #47 is open/unmerged or that its authenticated browser/CI checks were not run.

Known product limitations remain: full offline transaction outbox/sync and conflict resolution, backup/restore drill, hosted migration, live environment configuration, production deployment and customer pilot are not completed or authorized. Draft Memo adjustments (discount, VAT/tax, paid/due) remain Draft Memo-only; Invoice-First is total-only under PO-10.

## 6. Release-readiness matrix

| Area | PM classification |
|---|---|
| Software integration | VERIFIED — merged to intended V1 delivery branch |
| Automated validation | VERIFIED — Run #199, 5/5 PASS |
| Functional validation | VERIFIED for the CI-defined scope above |
| Security/data integrity | VERIFIED for local CI/Auth/RLS/PostgreSQL test scope; hosted environment not tested |
| External acceptance | NOT VERIFIED — Android, recipient delivery and physical printer |
| Documentation | This closeout and linked stage/scope documents must be merged before documentation closeout is complete |
| Production readiness | NOT APPROVED — environment/deployment/migration/rollback and restore prerequisites remain outside this software closeout |

## 7. Outstanding PO-controlled decisions

1. Approve or decline production deployment after separate environment, migration, rollback and backup/restore readiness review.
2. Approve or decline invoice issuance activation; the control remains OFF.
3. Approve or decline customer pilot/live customer onboarding.
4. Confirm English-only A6 print is acceptable for the initial release.
5. Review external Android/WhatsApp/printer acceptance evidence when available.

**PM recommendation:** SOFTWARE CLOSEOUT COMPLETE — EXTERNAL ACCEPTANCE PENDING, once this documentation update is merged. This recommendation does not authorize production release or invoice activation.
