# DokanTools V1 — Release Readiness Tracker

**Delivery branch:** `delivery/dokantools-v1-2026-11-19`  
**Delivery candidate SHA at PR #52 merge:** `81cf30a3feb9779e0b0ef7f43c88302298be84ed`  
**PR #52:** MERGED — release readiness documentation  
**Invoice issuance:** OFF  
**Tracker status:** OPEN — blocked by no approved hosted target and incomplete physical acceptance/recovery evidence

## Work-item register

| ID | Workstream | Owner | Status | Exact blocker / dependency | Evidence | Closure condition |
|---|---|---|---|---|---|---|
| RR-01 | Software CI/regression on delivery HEAD | Engineering | PASS | None for current CI scope | [Run #205](https://github.com/Hasnat26/DokanTools/actions/runs/45321068072), exact HEAD, 5/5 PASS | Reopen only if a new delivery commit introduces regression |
| RR-02 | Android native share | PO/authorized tester | BLOCKED — EXTERNAL DEPENDENCY | Physical Android handset + tester + approved non-production URL | [Issue #51](https://github.com/Hasnat26/DokanTools/issues/51); acceptance record | Real Android native share sheet evidence recorded |
| RR-03 | WhatsApp recipient delivery/open | Authorized sender + consenting recipient | BLOCKED — EXTERNAL DEPENDENCY | Second device/account and recipient availability | [Issue #51](https://github.com/Hasnat26/DokanTools/issues/51); acceptance record | Recipient confirms received and opened same PDF; sanitized evidence |
| RR-04 | Physical A6 print | QA/tester | BLOCKED — EXTERNAL DEPENDENCY | A6-capable printer, paper and test session | [Issue #51](https://github.com/Hasnat26/DokanTools/issues/51); acceptance record | Physical output verified for scale, clipping, margins, QR and readability |
| RR-05 | Frontend hosting target | PO/infra owner | APPROVED — CLOUDFLARE PAGES | Cloudflare Pages is the approved static frontend target; Pages project/domain and deployment owner not configured | PO architecture decision; [PR #55](https://github.com/Hasnat26/DokanTools/pull/55); wrangler.toml | Configure approved Pages project/preview origin and record project, URL and owner; no production promotion without separate release approval |
| RR-06 | Legacy Supabase environment | Engineering/infra | REQUIRED FOR LEGACY FEATURES ONLY | Shop administration, catalogue, stock, memo, baki and public profile remain Supabase-backed; local invoice route does not require Supabase | [Architecture audit](./ARCHITECTURE-AUDIT-BROWSER-FIRST-LOCAL-FIRST.md); [PR #55](https://github.com/Hasnat26/DokanTools/pull/55) | Keep legacy environment documented; do not make Supabase a dependency of local invoice create/calculate/save/PDF/share |
| RR-07 | Disposable V1 QA migration/RLS rehearsal | Engineering/DB owner | PASS | CI-only scope; not hosted target proof | [Run #204](https://github.com/Hasnat26/DokanTools/actions/runs/45320209787), corrected PR #52 head, 5/5 PASS; [Run #205](https://github.com/Hasnat26/DokanTools/actions/runs/45321068072), delivery HEAD, 5/5 PASS | Reopen only if migration/QA changes invalidate evidence |
| RR-08 | Target-matched migration rehearsal | Engineering/DB owner | BLOCKED — NO APPROVED TARGET | Approved non-production target with compatible schema/history absent | [Runbook migration section](./V1-RELEASE-READINESS-RUNBOOK.md); historical migration chain documented | Execute supported migration path against approved matching disposable target; verify ledger, schema, RLS, integrity and smoke tests |
| RR-09 | Backup/restore drill | Infra/DB owner | NOT RUN | Provider/target and backup capability not identified | Provider-neutral PostgreSQL logical dump/restore commands and acceptance checklist documented in [runbook](./V1-RELEASE-READINESS-RUNBOOK.md); no target execution | Execute native provider backup plus separate-target restore; record integrity, RPO/RTO and measured duration |
| RR-10 | Application/database rollback rehearsal | Infra/release owner | NOT RUN | Provider/target and deployment mechanism not identified | [Runbook recovery section](./V1-RELEASE-READINESS-RUNBOOK.md) | Perform approved non-production rollback and post-rollback smoke test |
| RR-11 | Release readiness documentation | PM/Engineering | PASS | PR #52 merged | [PR #52](https://github.com/Hasnat26/DokanTools/pull/52), merge SHA `81cf30a3feb9779e0b0ef7f43c88302298be84ed` | Reopen only for substantive evidence/doc changes |
| RR-12 | Invoice issuance OFF | Engineering/DB owner | PASS — OFF | No PO activation | Delivery baseline Runs #204/#205 validated API 423 and DB OFF; migration PR #55 removes static invoice API and retains `src/lib/invoice-issuance-guard.mjs` with `INVOICE_ISSUANCE_ENABLED = false` | Keep issuance unavailable and guard OFF; any activation requires separate PO approval |
| RR-13 | PO deployment/release decision | PO | BLOCKED — EXTERNAL DEPENDENCY | RR-02–RR-10 evidence and approved target incomplete | This tracker + [runbook](./V1-RELEASE-READINESS-RUNBOOK.md) | PO makes explicit release/hold decision after evidence package is complete |

## PO-approved architecture migration — PR #55

- Decision: browser-first, local-first PWA; Cloudflare Pages preferred static frontend; IndexedDB local drafts; client-side calculation and A6 PDF; customer-owned Google Drive manual backup.
- Draft PR: [#55](https://github.com/Hasnat26/DokanTools/pull/55), base delivery branch, not main.
- Migration branch: `feature/browser-first-local-first-pwa-2026-11-24`.
- Exact-head migration CI: pending at this tracker revision; do not claim acceptance from the delivery baseline CI.
- Local invoice route: no Supabase imports or invoice API calls; issuance remains OFF.
- Google OAuth client ID and authorized Cloudflare origin are not yet configured; Cloudflare Pages preview has not been deployed.
- Local invoice browser acceptance and Drive OAuth real-account acceptance must pass before migration stage closure.

## Verified CI and review

- Run #199: `45166285135`, 5/5 PASS on PR #47 merge commit.
- Run #200: `45167700162`, 5/5 PASS on PR #50 documentation head.
- Run #201: `45168427329`, 5/5 PASS on original delivery baseline `449b6cc405f9aca91676ea20e4cb6afe80e8544e`.
- Run #202: `45319503461`, 5/5 PASS on PR #52 initial head; disposable QA path only.
- Run #204: `45320209787`, 5/5 PASS on corrected PR #52 head `f5bdc1ee3c4012605b0ef7982beca09e8e17477b`.
- Codex reviewed corrected PR #52 head and reported no major issues; the migration-baseline P2 was corrected and its review thread resolved.
- Run #205: `45321068072`, 5/5 PASS on exact delivery HEAD `81cf30a3feb9779e0b0ef7f43c88302298be84ed`.

## Hosting inventory — read-only

| Provider/resource | Verified finding | Classification |
|---|---|---|
| Render `My Workspace` | Only listed service was `industrial-rfq-intelligence` (`srv-db497867bikc73e0il6g`), repo `Hasnat26/industrial-rfq-intelligence`; unrelated. The disposable `dokantools-acceptance-disposable` DB is not a target. | No DokanTools Render service found; Cloudflare Pages is now the approved frontend target |
| Supabase connected projects | Only `dokantools-phase4-isolated-qa` (`kidrysdtgmhmpogwxzzx`), PostgreSQL 17.12, `ap-southeast-1`; its ledger has only Phase 4 migrations and is not a V1 target. | QA-only; not approved for V1 deployment |
| Repository configuration | `.env.example` contains public Supabase URL/anon-key placeholders. No provider-specific DokanTools deployment service/domain/production project is identified in the reviewed tree/docs. | Target and deployment owner remain unidentified |

No service, database, environment variable, deployment or hosted data was modified. No infrastructure was created or paid resource incurred.

## External coordination

Issue #51 remains open and unassigned. A follow-up comment records PR #52 merge and Run #204 evidence and requests a tester/session with physical Android, consenting recipient device and A6 printer. Physical acceptance remains NOT RUN.

## Release gate

The software/documentation CI package is verified on the historical delivery HEAD. PR #55 is a separate architecture migration and remains under exact-head CI/acceptance. This is **not** physical acceptance, hosted migration/recovery proof, or deployment authorization. Do not classify the V1 release as fully ready until the blocked/not-run work items close with evidence. Production deployment, production migration, customer pilot and invoice activation require separate PO authorization. Invoice issuance remains OFF.
