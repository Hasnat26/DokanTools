# DokanTools — বর্তমান V1 উন্নয়ন পর্যায়

## বর্তমান অবস্থা

**PR #47 সফটওয়্যার ইন্টিগ্রেশন সম্পন্ন।** PR #47 merge হয়েছে `delivery/dokantools-v1-2026-11-19` ব্রাঞ্চে। Merge commit / verified branch HEAD:

`2f257211e5f296d49b7ccf30e50fedcb2530a9f5`

Post-merge CI [Run #199](https://github.com/Hasnat26/DokanTools/actions/runs/45166285135) — পাঁচটি required job-ই PASS। বিস্তারিত [PR #47 Post-Merge Closeout](./PR47-POST-MERGE-CLOSEOUT.md)-এ আছে।

## যাচাইকৃত সফটওয়্যার

- Shop Profile create/edit, logo upload/replace/remove ও reload persistence.
- Google Maps URL validation; public shop profile opt-in এবং QR destination.
- Category create/rename/delete; product create/edit, category association ও persistence.
- Stock-linked catalogue product rename/delete guard.
- Multi-product Draft Memo; quantity, unit price, subtotal ও optional discount/VAT/tax/paid/due validation.
- IndexedDB draft save/edit/reload/delete.
- Fresh A6 PDF generation/download এবং line remove/edit করলে stale PDF invalidation.
- Browser-এ Share API payload ও unsupported fallback simulation.
- Disposable local Supabase Auth/PostgREST/RLS-এ দুই synthetic user-এর category tenant isolation.
- PostgreSQL 17 category/stock identity integrity regression.
- Full migration chain disposable local Supabase-এ reset/apply; migration parity এবং issuance-off check.

## CI ফলাফল

| Job | Job ID | ফল |
|---|---:|---|
| Chromium authenticated V1 workflow + fresh A6 PDF | 137663956967 | PASS |
| A6 PDF artifact verification | 137663957489 | PASS |
| Unit tests | 137663957547 | PASS |
| PostgreSQL 17 tenant integrity | 137663957570 | PASS |
| Build, lint, typecheck, startup | 137663957626 | PASS |

Unit test: 113 total; 111 passed, 0 failed, 2 skipped. Chromium test: 1 passed, 0 skipped/unexpected/flaky.

## Invoice issuance control

Invoice issuance **OFF**। Valid Invoice-First request HTTP `423` এবং `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL` পায়। Database runtime control false হিসেবে seed করা; authenticated role-এর table privilege revoked; security-definer transaction RPC disabled control যাচাই করে। API-তেও fail-closed guard আছে। কোনো invoice issue, production write বা financial transaction করা হয়নি।

## এখনও অসম্পূর্ণ / NOT VERIFIED

1. Android Chrome native share sheet বাস্তব device-এ পরীক্ষা.
2. বাস্তব WhatsApp test recipient-কে PDF attachment পাঠানো এবং recipient-side open.
3. Physical A6 printer/driver acceptance.
4. Hosted migration, production deployment, environment configuration ও rollback readiness.
5. Backup/restore drill.
6. Full offline transaction outbox/sync ও conflict resolution; এগুলো PR #47-এর verified scope নয়.
7. Customer pilot/live onboarding.

CI-তে print handler এবং Web Share behavior simulated হয়েছে; তাই Android, WhatsApp recipient delivery বা physical printer PASS বলা যাবে না।

## PO-controlled boundary

Production deployment, hosted migration, production data change, invoice issuance activation, customer pilot/live onboarding এবং PO-10 scope change আলাদা PO decision ছাড়া অনুমোদিত নয়।

**PM recommendation:** SOFTWARE CLOSEOUT COMPLETE — EXTERNAL ACCEPTANCE PENDING, documentation closeout PR merge হলে। এটি production release authorization নয়।
