# DokanTools V1 — Release Readiness Runbook

**Status:** PRE-RELEASE; no production authorization  
**Baseline delivery commit:** `449b6cc405f9aca91676ea20e4cb6afe80e8544e`  
**Target branch:** `delivery/dokantools-v1-2026-11-19`  
**Invoice issuance:** MUST REMAIN OFF

This runbook is a controlled preparation document. It does not assert that a hosted production environment exists, that a production deployment has occurred, or that a backup/restore drill has passed.

## 1. Environment inventory and configuration

### Application configuration

The repository's `.env.local.example` currently defines only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both are public client configuration values. Set them in the selected hosting provider's runtime/build environment using the correct target Supabase project. Do not put a Supabase service-role key, database password, access token, or other secret in a `NEXT_PUBLIC_*` variable or client bundle.

No production hosting provider, service ID, target Supabase project ID, production URL, or secret values are recorded in this repository baseline. Identify and approve these before deployment; do not infer them from the isolated QA project.

### Supabase configuration checklist

Before any production migration:

- [ ] Record project name, project ref, region, database engine/version, and environment owner.
- [ ] Confirm the target is explicitly designated production; do not use `dokantools-phase4-isolated-qa` as production.
- [ ] Confirm project status is healthy and database connectivity is available.
- [ ] Confirm Auth provider(s), email confirmation policy, Site URL, and exact redirect/callback URLs for the deployed domain.
- [ ] Enable leaked/compromised-password protection and review password policy before customer access.
- [ ] Confirm RLS is enabled for every tenant/customer-owned table and policies are consistent with the release migration chain.
- [ ] Confirm Storage buckets and policies only if the selected app path uses Supabase Storage; do not create buckets speculatively.
- [ ] Confirm required database extensions from the migration chain; avoid enabling unused extensions.
- [ ] Confirm runtime invoice control is OFF and API guard returns `423 INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL`.
- [ ] Record the exact project ref and configuration evidence in the release record; redact secrets.

The connected Supabase project observed during readiness work was `dokantools-phase4-isolated-qa` (`kidrysdtgmhmpogwxzzx`), region `ap-southeast-1`, PostgreSQL 17. Its remote migration ledger showed only `20261119_phase4_draft_memo_scope` and `20261119_phase4_catalog_index_alignment`; this does not match the full V1 repository migration sequence. It is not a validated V1 deployment target. A security advisor reported leaked-password protection disabled on that QA project.

## 2. Build and deployment

Use the deployment provider already approved for the application. Provider-specific build settings must be verified in its dashboard; this runbook does not assume Vercel, Render, or another provider.

Repository-verified commands:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run verify:sql
npm run perf
npm run build
npm run start
```

CI uses Node.js 22. For a hosted release, use the same supported Node major and a clean lockfile install. The production start command is `npm run start`; the application must be bound/configured according to the hosting provider's port and health-check contract.

Deployment sequence:

1. Confirm release decision, target URL, project refs, secrets, and rollback owner.
2. Export/backup the target database using the provider-supported backup mechanism and verify that the backup is available.
3. Run the migration rehearsal against a disposable database with the exact target schema/migration state.
4. Deploy the application to a non-production preview/staging environment first.
5. Run the post-deployment smoke checklist below.
6. Confirm invoice issuance remains disabled through API and database checks.
7. Capture deployment ID, deployed commit SHA, environment name, smoke-test evidence and logs.
8. Production deployment remains a separate PO-controlled action.

## 3. Database migration plan

The V1 repository forward migration files, in lexical/time order, are:

1. `20261019_inventory_catalog.sql`
2. `20261019_reliability_foundation.sql`
3. `20261102_p0_idempotency.sql`
4. `202611110001_invoice_first_foundation.sql`
5. `202611180001_item_categories.sql`
6. `202611220001_category_integrity_and_shop_map_validation.sql`

Use the repository's Supabase CLI configuration and migration ledger. Do not apply `supabase/schema.sql` as a substitute for the forward migration chain on an existing database. Do not run rollback scripts from the forward migration directory; rollback material is quarantined under `supabase/rollbacks`.

Rehearsal procedure:

1. Create or reset a disposable, isolated PostgreSQL/Supabase database; verify the target identity before connecting.
2. Capture its initial migration ledger and schema state.
3. Run the repository CI migration inventory and dry-run checks.
4. Apply the full forward migration chain in order.
5. Run `supabase/tests/verify_v1_migration_parity.sql` and the relevant category/tenant/stock identity tests.
6. Verify RLS with at least two distinct authenticated synthetic users.
7. Verify invoice issue OFF at API and database runtime-control layers.
8. Compare migration ledger and schema against the expected release state; save logs and exact commit SHA.
9. Do not connect the rehearsal to production credentials or production data.

## 4. Backup, restore and rollback

### Backup/restore acceptance

- [ ] Identify backup mechanism, frequency, retention, RPO and RTO for the actual Supabase plan/project.
- [ ] Create a pre-migration backup/snapshot using the supported dashboard/API mechanism.
- [ ] Verify the backup timestamp, project identity and availability.
- [ ] Restore into a separate disposable project/database—not over the source.
- [ ] Verify restored migration ledger, key table counts/integrity, RLS policies, Auth configuration and application connectivity.
- [ ] Record measured restore duration and any data-loss window.
- [ ] Attach sanitized evidence.

No backup or restore drill is claimed complete by this runbook. If the plan does not provide a restorable backup, stop and escalate the infrastructure/plan requirement; do not silently substitute a schema-only dump for a full recovery plan.

### Rollback

Application rollback:
1. Record current deployed SHA and deployment ID before release.
2. Keep the previous known-good deployment available.
3. If smoke tests fail, route traffic back to the previous deployment using the provider's documented rollback mechanism.
4. Verify health and invoice issuance OFF after rollback.

Database rollback:
- Do not assume migrations are safely reversible.
- Prefer a tested forward-fix migration for compatible schema changes.
- For destructive/corrupting failure, restore the verified pre-migration backup into the approved recovery target and follow the provider's cutover procedure.
- Never run a rollback SQL file against production without a reviewed, exact-target recovery plan and PO authorization.

## 5. Post-deployment smoke tests

Run against the intended non-production deployment first:

- [ ] Homepage returns expected response; no server startup/runtime errors.
- [ ] Sign-in and sign-out work; redirect URLs are correct.
- [ ] Authenticated user can create/edit/reload Shop Profile.
- [ ] Logo upload/replace/remove works if enabled in the deployed path.
- [ ] Shop public profile remains opt-in; verify anonymous access boundaries.
- [ ] Category and catalogue create/edit/reload work for the owner.
- [ ] Second tenant cannot read or mutate the first tenant's category/catalogue records.
- [ ] Draft Memo calculates expected total; save/reload/edit/delete works.
- [ ] Generate fresh A6 PDF; verify content, QR and Maps link.
- [ ] Share/download controls are enabled only for a current generated PDF.
- [ ] Native Android share and WhatsApp are tested separately using the external acceptance record.
- [ ] Invoice issue endpoint returns 423 for a valid request; adjustment-bearing invoice request remains rejected.
- [ ] Confirm no invoice rows were created during smoke testing.
- [ ] Review application and database logs; no unexpected 5xx, auth failures or RLS errors.

## 6. Release controls and decision

Production deployment, hosted production migration, customer pilot and invoice activation require separate PO authorization. This package does not authorize any of them. Invoice issuance must remain OFF.

Release decision may be considered only after the tracker is closed with evidence, external acceptance is physically complete, hosted target/configuration is identified, migration and restore rehearsals pass, and no release-blocking defect remains.
