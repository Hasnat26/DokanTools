# DokanTools V1 — Release Readiness Runbook

**Status:** PRE-RELEASE; no production authorization  
**Baseline delivery commit:** `449b6cc405f9aca91676ea20e4cb6afe80e8544e`  
**Target branch:** `delivery/dokantools-v1-2026-11-19`  
**Invoice issuance:** MUST REMAIN OFF

This is a controlled preparation document. It does not assert a hosted production deployment or successful backup/restore drill.

## 1. Environment inventory and configuration

### Application configuration

The repository's `.env.local.example` defines only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are public client configuration values. Do not place a Supabase service-role key, database password, access token, or other secret in a `NEXT_PUBLIC_*` variable or client bundle.

No production hosting provider, DokanTools service ID, target Supabase project ID, production URL, or secret values are recorded in the verified delivery baseline.

### Render read-only inspection

The PO-authorized Render workspace `My Workspace` (`tea-db496260tbcc73djj330`) was inspected read-only. Its service listing contained one service:

- `industrial-rfq-intelligence`, service `srv-db497867bikc73e0il6g`, repository `Hasnat26/industrial-rfq-intelligence`, branch `main`, Singapore region, URL `https://industrial-rfq-intelligence.onrender.com`.

This service is unrelated to DokanTools. No DokanTools service was found in the workspace listing. The separate `dokantools-acceptance-disposable` database is not a production target. No Render service, database, environment variable, deployment, or hosted data was modified. Render inspection does not establish that another provider is or is not hosting DokanTools.

### Supabase configuration checklist

Before any hosted migration:

- [ ] Record the approved project name/ref, region, database engine/version and owner.
- [ ] Confirm target environment classification and health.
- [ ] Confirm Auth providers, email confirmation policy, Site URL and exact redirect/callback URLs.
- [ ] Enable leaked/compromised-password protection and review password policy before customer access.
- [ ] Confirm RLS on every tenant-owned table and policies match the selected migration baseline.
- [ ] Confirm Storage buckets/policies only if the deployed app uses Storage.
- [ ] Confirm required extensions.
- [ ] Verify invoice runtime control OFF and valid API request returns `423 INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL`.
- [ ] Save sanitized configuration evidence; never include secrets.

The connected Supabase project observed earlier was `dokantools-phase4-isolated-qa` (`kidrysdtgmhmpogwxzzx`), PostgreSQL 17 in `ap-southeast-1`. Its remote migration ledger contained only two Phase 4 migrations, so it is not a validated V1 target. A security advisor reported leaked-password protection disabled on that QA project.

## 2. Build and deployment

Use the provider already approved for the application; do not assume Render or create infrastructure.

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

CI uses Node.js 22. Use the same supported Node major and clean lockfile install for staging. Verify provider-specific port, health-check and environment configuration before deployment.

Deployment sequence:

1. Confirm approved provider, target URL, project refs, secret configuration and rollback owner.
2. Verify a provider-supported pre-migration backup and its availability.
3. Complete target-compatible migration and restore rehearsals.
4. Deploy to an approved non-production environment.
5. Run post-deployment smoke tests.
6. Verify invoice issuance remains OFF through API and database checks.
7. Record deployment ID, SHA, environment, smoke evidence and logs.
8. Production deployment remains a separate PO-controlled action.

## 3. Migration rehearsal — supported baseline and sequence

**Important correction (Codex P2 review):** Do not apply the six historical files under `supabase/migrations` to a clean database as a standalone sequence. The first historical migration alters an existing `public.shops` schema and assumes the original schema is already present. Preloading the current `supabase/schema.sql` is not a valid substitute because later historical migrations can recreate existing policies. This direct-clean-database procedure is unsupported.

The repository's reproducible disposable V1 QA path is the dedicated `qa/supabase-runner` project configuration and its QA migration directory. It provides an explicit baseline plus forward QA migrations; it is distinct from the six-file historical production migration directory.

### CI-supported disposable QA rehearsal

Use only an isolated local/disposable database, never a hosted target:

1. Verify checkout SHA and ensure no hosted Supabase credentials/target are configured.
2. Start the local Supabase stack with the repository's QA runner configuration:
   `supabase --workdir qa/supabase-runner start -x studio,storage-api,realtime,imgproxy,mailpit,edge-runtime,logflare,vector`.
3. Verify migration parity and rollback quarantine using:
   `node scripts/verify-qa-migration-parity.mjs` and `node scripts/verify-forward-migrations.mjs`.
4. Inspect the QA runner migration ledger/dry-run:
   `supabase --workdir qa/supabase-runner migration list` and `supabase --workdir qa/supabase-runner db push --dry-run`.
5. Reset only the disposable local QA database using:
   `supabase --workdir qa/supabase-runner db reset`.
   This applies the QA runner's explicit baseline and migration sequence—not the six historical migration files directly.
6. Run `supabase/tests/verify_v1_migration_parity.sql` against the local QA database.
7. Create two synthetic Auth users; run the authenticated Chromium workflow and category/RLS/stock-integrity regression.
8. Verify API and database invoice issuance remain OFF; retain logs and exact commit SHA.
9. Stop the disposable local Supabase stack.

Run #202 on PR #52 exact head completed this QA procedure successfully, including migration parity, local reset, two synthetic users, authenticated browser workflow, A6 PDF and invoice-off checks.

### Hosted/target-matched rehearsal — still not completed

A target-matched migration rehearsal requires an identified, approved non-production Supabase project whose existing schema and migration history represent the intended upgrade path. No such DokanTools V1 target has been identified. The Phase 4 QA project is not suitable. Therefore do not claim hosted migration rehearsal or production schema compatibility complete.

The six historical forward migration files remain documented for lineage/reference:

1. `20261019_inventory_catalog.sql`
2. `20261019_reliability_foundation.sql`
3. `20261102_p0_idempotency.sql`
4. `202611110001_invoice_first_foundation.sql`
5. `202611180001_item_categories.sql`
6. `202611220001_category_integrity_and_shop_map_validation.sql`

Do not apply these directly to an empty database. Do not use `supabase/schema.sql` as a replacement for a validated migration baseline. Rollback SQL remains quarantined under `supabase/rollbacks`; never execute it against production without a reviewed recovery plan and PO authorization.

## 4. Backup, restore and rollback

### Backup/restore acceptance

- [ ] Identify backup mechanism, frequency, retention, RPO/RTO for the approved target.
- [ ] Create and verify a disposable backup/snapshot.
- [ ] Restore into a separate disposable target, not over the source.
- [ ] Verify migration ledger, schema, key data integrity, RLS, Auth configuration and application connectivity.
- [ ] Measure restore duration and recovery point.
- [ ] Attach sanitized evidence.

No backup/restore drill is claimed complete. If the approved plan does not provide a restorable backup, stop and escalate rather than substituting a schema-only dump.

### Provider-neutral PostgreSQL logical backup/restore rehearsal (procedure only; NOT RUN)

This procedure is a **supplemental logical-dump rehearsal**, not a substitute for the selected provider's native snapshot/point-in-time backup. Do not execute it against any hosted source until the source and separate restore target are explicitly approved and classified non-production. No approved DokanTools V1 target is currently identified.

#### Prerequisites

- PostgreSQL client tools `pg_dump`, `pg_restore` and `psql` from major version 17, matching the identified PostgreSQL engine.
- An approved disposable source database representing the intended schema/migration history.
- A separate, empty disposable restore database with required extensions available.
- Database URLs supplied securely by the approved secret manager/session environment; do not paste credentials into commands, tickets, logs or shell history.
- A restricted local backup directory with adequate capacity. Use synthetic data only.
- Approved test owner and a recorded start/end time.

#### Export and integrity

Run in a controlled shell after setting `SOURCE_DATABASE_URL` and `BACKUP_DIR` securely:

```bash
set -euo pipefail
umask 077
mkdir -p "$BACKUP_DIR"
pg_dump --version
pg_restore --version
psql --version

date -u +"backup_started_utc=%Y-%m-%dT%H:%M:%SZ" > "$BACKUP_DIR/metadata.txt"
pg_dump --format=custom --no-owner --no-acl \
  --dbname="$SOURCE_DATABASE_URL" \
  --file="$BACKUP_DIR/dokantools-v1-logical.dump"
pg_restore --list "$BACKUP_DIR/dokantools-v1-logical.dump" \
  > "$BACKUP_DIR/dump-contents.txt"
sha256sum "$BACKUP_DIR/dokantools-v1-logical.dump" \
  | tee "$BACKUP_DIR/SHA256SUMS"
date -u +"backup_finished_utc=%Y-%m-%dT%H:%M:%SZ" >> "$BACKUP_DIR/metadata.txt"
```

Record the source environment classification, exact source SHA/release, PostgreSQL version, migration ledger, dump size and elapsed time. Verify the checksum before restore. Protect and dispose of the dump under the approved retention policy.

#### Restore to a separate disposable database

Set `RESTORE_DATABASE_URL` to the separately provisioned empty target. Never restore over the source:

```bash
set -euo pipefail
sha256sum --check "$BACKUP_DIR/SHA256SUMS"
date -u +"restore_started_utc=%Y-%m-%dT%H:%M:%SZ" > "$BACKUP_DIR/restore-metadata.txt"
pg_restore --exit-on-error --no-owner --no-acl \
  --dbname="$RESTORE_DATABASE_URL" \
  "$BACKUP_DIR/dokantools-v1-logical.dump"
date -u +"restore_finished_utc=%Y-%m-%dT%H:%M:%SZ" >> "$BACKUP_DIR/restore-metadata.txt"

psql -X -v ON_ERROR_STOP=1 "$RESTORE_DATABASE_URL" \
  -c "select version, name from supabase_migrations.schema_migrations order by version;"
psql -X -v ON_ERROR_STOP=1 "$RESTORE_DATABASE_URL" \
  -c "select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;"
```

If the provider's managed Auth/roles/extensions or privileges are not represented in the logical dump, restore them using the provider-supported configuration/migration procedure. Do not claim a complete service recovery from a database dump alone.

#### Acceptance and evidence

- [ ] Dump checksum verified and archive listing readable.
- [ ] Restore completed into a separate target; elapsed restore duration recorded.
- [ ] Migration ledger matches the expected approved baseline.
- [ ] Schema/object parity and required extensions verified.
- [ ] Synthetic data integrity checks pass.
- [ ] RLS enabled and policies reviewed on tenant-owned tables.
- [ ] Two synthetic authenticated users prove tenant isolation through the application/API (not a privileged DB-owner session).
- [ ] Application smoke tests pass against restored target.
- [ ] API guard and database invoice runtime control remain OFF; valid issue request returns 423 and creates no invoice row.
- [ ] Sanitized logs, checksum, dump size, source/restore classifications and test sign-off retained.

**Limitations:** These commands have not been executed for DokanTools V1. They do not establish provider-native backup retention, point-in-time recovery, Auth/storage restoration, cutover, or RPO/RTO. Those require the approved provider/target. A failed restore is NOT PASS and must be recorded with root cause and corrective action.

### Rollback

Application:
1. Record deployed SHA and deployment ID.
2. Keep the prior known-good deployment available.
3. On failed smoke tests, roll back using the selected provider's documented mechanism.
4. Verify health and invoice issuance OFF.

Database:
- Do not assume migrations are reversible.
- Prefer a tested forward fix for compatible changes.
- For data/schema corruption, restore a verified pre-migration backup into an approved recovery target and follow the provider's cutover procedure.
- Never run rollback SQL on production without exact-target review and PO authorization.

## 5. Post-deployment smoke tests

Run first against the approved non-production deployment:

- [ ] Homepage and server logs healthy.
- [ ] Sign-in/sign-out and redirect URLs work.
- [ ] Shop Profile create/edit/reload works.
- [ ] Logo upload/replace/remove works if enabled.
- [ ] Public profile remains opt-in; anonymous access boundaries verified.
- [ ] Category/catalogue create/edit/reload works.
- [ ] Second tenant cannot read/mutate first tenant's data.
- [ ] Draft Memo total and save/reload/edit/delete work.
- [ ] Fresh A6 PDF content, QR and Maps link verified.
- [ ] Share/download enabled only for current generated PDF.
- [ ] Physical Android/WhatsApp and printer tests recorded separately.
- [ ] Valid invoice issue request returns 423; adjustment-bearing request remains rejected.
- [ ] No invoice rows created.
- [ ] No unexpected 5xx, Auth or RLS errors.

## 6. Release controls

Production deployment, hosted production migration, customer pilot and invoice activation require separate PO authorization. This package authorizes none of them. Invoice issuance must remain OFF.

Technical readiness requires the tracker to close with evidence, external acceptance complete, approved hosted target identified, target-compatible migration and restore rehearsals passed, and no release-blocking defect.
