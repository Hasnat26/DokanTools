# DokanTools V1 — Release Readiness Tracker

**Baseline SHA:** `449b6cc405f9aca91676ea20e4cb6afe80e8544e`  
**Current branch:** `delivery/dokantools-v1-2026-11-19`  
**Invoice issuance:** OFF  
**Tracker status:** OPEN — external and hosted-environment evidence outstanding

| ID | Workstream | Owner | Status | Dependency / closure evidence |
|---|---|---|---|---|
| RR-01 | Final CI/regression | Engineering/PM | PASS at baseline | Run #201, exact baseline SHA, 5/5 jobs |
| RR-02 | Android native share | PO/authorized tester | BLOCKED — physical device session | Device/version, native share sheet and PDF share evidence |
| RR-03 | WhatsApp delivery/open | Authorized sender + test recipient | BLOCKED — recipient session | Recipient-side received/opened PDF, sanitized evidence |
| RR-04 | Physical A6 print | QA/tester | BLOCKED — printer access | Printer/driver/settings and physical output evidence |
| RR-05 | Hosted provider/workspace identification | PO/infra owner | BLOCKED — target selection | Confirm provider workspace/service and production/staging URL |
| RR-06 | Hosted env/auth configuration | Engineering/infra | NOT STARTED | Redacted env checklist; auth/redirect/RLS/secret verification |
| RR-07 | V1 migration rehearsal | Engineering/DB owner | PARTIALLY VERIFIED in CI only | Full six-migration rehearsal on disposable DB; schema/RLS parity evidence |
| RR-08 | Backup and restore drill | Infra/DB owner | NOT RUN | Verified backup + restore to separate disposable target + measured RTO/RPO |
| RR-09 | Application rollback rehearsal | Infra/release owner | NOT RUN | Previous deployment rollback demonstrated and smoke-tested |
| RR-10 | Release documentation | PM/Engineering | PREPARED in this PR | Merge runbook, acceptance record, tracker; attach evidence as completed |
| RR-11 | Invoice issuance OFF | Engineering/DB owner | PASS in CI scope | Valid POST returns 423; DB runtime control OFF; no invoice rows created |
| RR-12 | PO production decision | PO | PENDING | Explicit approve/hold after evidence package complete |

## Baseline evidence

- PR #47 merged; PR #50 merged.
- Run #199: `45166285135`, 5/5 required jobs PASS on PR #47 merge commit.
- Run #200: `45167700162`, 5/5 required jobs PASS on docs PR exact head.
- Run #201: `45168427329`, 5/5 required jobs PASS on `449b6cc405f9aca91676ea20e4cb6afe80e8544e`.
- Run #201 job IDs:
  - Application build/startup: `137671333340`
  - Unit tests/A6 assertions: `137671333742`
  - A6 PDF verification: `137671333767`
  - Authenticated Chromium V1 workflow: `137671333788`
  - PostgreSQL 17 tenant-integrity: `137671333839`

## External coordination issue

Use the linked GitHub issue to schedule one short acceptance session with the PO/authorized colleague and test recipient. The session must produce the Android/WhatsApp and physical A6 print evidence in `V1-EXTERNAL-ACCEPTANCE-RECORD.md`. Keep evidence synthetic and redact personal identifiers.

## Release gate

Do not change the status to ready until RR-02 through RR-09 are closed with evidence, RR-11 remains PASS, and no release-blocking defect is open. The final PO decision is separate from technical readiness. Invoice activation is a separate authorization and remains disabled.
