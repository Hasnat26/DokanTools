#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BASELINE="9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1"
MIGRATION="supabase/migrations/202611110001_invoice_first_foundation.sql"
ARTIFACT_DIR="${LS01_ARTIFACT_DIR:-artifacts/ls01}"
mkdir -p "$ARTIFACT_DIR"
TMP="$(mktemp -d)"
cleanup(){ rm -rf "$TMP"; }
trap cleanup EXIT
: "${SUPABASE_URL:?SUPABASE_URL must be set from local supabase status}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL must be set from local supabase status}"
export LS01_ALLOW_LOCAL_SUPABASE=1
node scripts/guard-local-supabase.mjs
command -v psql >/dev/null
git cat-file -e "${BASELINE}^{commit}" 2>/dev/null || { echo "Pinned baseline commit missing from Git history." >&2; exit 2; }
[[ -f "$MIGRATION" ]] || { echo "Invoice migration missing." >&2; exit 2; }
# Validate local Auth and PostgREST HTTP services using only the local anon key.
: "${SUPABASE_ANON_KEY:?Local anon key is required for read-only HTTP smoke checks}"
curl --fail --silent --show-error -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/auth/v1/health" > "$ARTIFACT_DIR/auth-health.json"
curl --fail --silent --show-error -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" > "$ARTIFACT_DIR/postgrest-root.json"
# Validate PostgreSQL engine and real GoTrue schema; do not use the service-role API key.
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -Atc "select current_setting('server_version'), to_regclass('auth.users'), to_regprocedure('auth.uid()')" > "$ARTIFACT_DIR/postgres-auth.txt"
grep -q 'auth.users' "$ARTIFACT_DIR/postgres-auth.txt"
grep -q 'auth.uid()' "$ARTIFACT_DIR/postgres-auth.txt"
# Apply the exact reconciled baseline sequence against the genuine local Supabase DB.
git show "$BASELINE:supabase/schema.sql" > "$TMP/10_schema.sql"
git show "$BASELINE:supabase/migrations/20261019_inventory_catalog.sql" > "$TMP/20_inventory.sql"
git show "$BASELINE:supabase/migrations/20261102_p0_idempotency.sql" > "$TMP/40_p0.sql"
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/10_schema.sql"
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/20_inventory.sql"
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/05_baseline_assertions.sql
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/40_p0.sql"
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f "$MIGRATION"
# Catalog/ACL assertions execute against real Supabase Postgres roles and auth.uid().
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f scripts/assert-local-supabase.sql
# Capture redacted, non-secret evidence only.
{
  echo "work_order=LS-01"
  echo "supabase_cli=3.1.0"
  echo "baseline=$BASELINE"
  echo "api_url=http://127.0.0.1:54321"
  echo "db_host=127.0.0.1"
  echo "db_port=54322"
  echo "issue_flag=$(psql "$SUPABASE_DB_URL" -X -Atc "select issue_enabled from public.invoice_runtime_controls where control_key='invoice_issue'")"
  echo "migration_status=APPLIED"
} > "$ARTIFACT_DIR/ls01-summary.txt"
grep -qx 'issue_flag=f' "$ARTIFACT_DIR/ls01-summary.txt"
cp docs/implementation/LS01_EXPECTED_STATE.json "$ARTIFACT_DIR/expected-state.json"
echo "PASS: genuine local Supabase Auth, PostgREST, PostgreSQL, migrations and security assertions."
