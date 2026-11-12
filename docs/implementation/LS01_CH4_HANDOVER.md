# LS-01 → CH-4 Local Supabase Integration Handover

## Status and scope

LS-01 provisions a disposable local Supabase stack only. The CI job starts the Supabase API gateway (Kong), GoTrue, PostgREST and PostgreSQL using Supabase CLI 3.1.0. PostgreSQL major version is pinned to 17. This environment is not a hosted Supabase project and is not production evidence.

CH-4 owns the subsequent Owner A/B integration tests. LS-01 does not create test users or exercise tenant-isolation scenarios.

## Local endpoints

| Service | URL / connection | Use |
|---|---|---|
| Supabase API gateway | `http://127.0.0.1:54321` | Local API ingress |
| GoTrue health | `GET /auth/v1/health` | Service readiness |
| GoTrue admin | `POST /auth/v1/admin/users` | Create disposable test identities |
| GoTrue password sign-in | `POST /auth/v1/token?grant_type=password` | Obtain genuine access tokens |
| PostgREST | `http://127.0.0.1:54321/rest/v1` | Actual HTTP API/RLS |
| PostgreSQL | `127.0.0.1:54322/postgres` | Local migration/catalog verification |

The CLI's local `supabase status -o env` output provides `API_URL`, `DB_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY`. Never print or upload this file. Only the local API URL, DB URL and anon key are passed to the smoke script. The service-role key is not used for Owner A/B requests.

## Test identity bootstrap contract

CH-4 may create two disposable users through GoTrue's local admin endpoint using the local-only service-role key:

```http
POST /auth/v1/admin/users
apikey: <LOCAL_SERVICE_ROLE_KEY>
Authorization: Bearer <LOCAL_SERVICE_ROLE_KEY>
Content-Type: application/json

{"email":"<unique-owner-a-email>","password":"<ephemeral-password>","email_confirm":true}
```

Repeat for Owner B with a distinct email and password. Then obtain each owner's genuine JWT through password sign-in using the anon key:

```http
POST /auth/v1/token?grant_type=password
apikey: <LOCAL_ANON_KEY>
Content-Type: application/json

{"email":"<owner-email>","password":"<ephemeral-password>"}
```

Use the returned `access_token` as `Authorization: Bearer <access_token>` with the anon key as `apikey` for every Owner A/B PostgREST and application HTTP request. Never attach the service-role key to those requests. Do not log, persist, or upload JWTs, passwords, admin responses, or API keys. Cleanup should delete only the two test identities created by that run, then stop the entire local stack.

## Migration and schema state

The smoke runner applies the exact sequence below to the disposable Supabase PostgreSQL database:

1. Pinned `supabase/schema.sql` from baseline `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`.
2. Pinned `20261019_inventory_catalog.sql` reconciliation.
3. `tests/postgres/05_baseline_assertions.sql` (asserts consolidated reliability/P0 baseline; historical reliability migration is not replayed).
4. Pinned `20261102_p0_idempotency.sql`.
5. `supabase/migrations/202611110001_invoice_first_foundation.sql`.

Real Supabase Auth schema and `auth.uid()` are supplied by GoTrue; there is no Auth shim in this environment. The smoke suite checks Auth health, PostgREST root, PostgreSQL connectivity/version, real roles, invoice RLS/grants, SECURITY DEFINER RPC metadata/ACL, immutable triggers and the invoice issue flag.

## Known contract details

- `public.invoices` and `public.invoice_lines`: authenticated owner-only SELECT policies; no anon access; no client write grants.
- Private tables: `invoice_counters`, `invoice_idempotency`, `invoice_status_events`, `invoice_audit_events`, `invoice_runtime_controls`; no client SELECT.
- RPC: `public.create_invoice_transaction(uuid,text,uuid,jsonb)`; SECURITY DEFINER, `search_path=pg_catalog`; authenticated EXECUTE only; anon/PUBLIC EXECUTE denied.
- Trigger function: `public.reject_invoice_fact_mutation()`; immutable invoice and line triggers.
- Runtime gate: `invoice_runtime_controls.invoice_issue.issue_enabled=false`. Do not enable it.
- PO-06 catalog eligibility/current-price policy remains unresolved; do not invent or assert a policy.
- QR/token/public invoice verification is not activated or implemented by LS-01.

## CH-4 test responsibilities

1. Create Owner A and Owner B using the local GoTrue admin endpoint, then sign in through GoTrue to obtain real JWTs.
2. Seed tenant fixtures only through controlled local setup/admin SQL; keep user requests authenticated as the correct owner.
3. Verify direct PostgREST RLS: each owner reads only their own invoices and lines; cross-tenant reads return no rows; anon reads are denied.
4. Verify client writes are denied and private invoice tables are inaccessible.
5. Verify application GET routes with real bearer tokens and actual PostgREST, including invalid/expired JWT behavior.
6. Do not call the issue RPC to create an invoice while the gate is OFF; no invoice issuance test may enable the gate without separate CH-1 authorization.
7. Capture redacted evidence only; clean up the created users and stop the disposable stack.

## Reproduction and cleanup

```bash
supabase start -x studio,storage-api,realtime,imgproxy,mailpit,edge-runtime,logflare,vector
supabase status -o env
node --test tests/local-supabase-guard.test.mjs
bash scripts/test-local-supabase.sh
supabase stop --no-backup
```

Run from the repository root with Docker and Supabase CLI 3.1.0. The endpoint guard requires loopback API port 54321, database port 54322, database name `postgres`, and explicit `LS01_ALLOW_LOCAL_SUPABASE=1`. Never pass `--remote` or a hosted URL. The test runner uses only the local DB URL and local anon key; service-role credentials are not used by the runner.

## Evidence boundaries

Successful LS-01 evidence proves that the disposable local Supabase services start, the pinned migration sequence applies, and the catalog assertions pass in that local environment. It does not prove hosted/production ACLs, PO policy approval, real customer workflows, invoice issuance authorization, or release readiness.
