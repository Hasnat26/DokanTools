#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASELINE="9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1"
MIGRATION="supabase/migrations/202611110001_invoice_first_foundation.sql"
TMP="$(mktemp -d)"
CONTAINER=""
cleanup(){ if [[ -n "$CONTAINER" ]]; then docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; fi; rm -rf "$TMP"; }
trap cleanup EXIT
cd "$ROOT"
git cat-file -e "${BASELINE}^{commit}" 2>/dev/null || { echo "ERROR: fetch full git history; exact baseline $BASELINE is missing." >&2; exit 2; }
[[ -f "$MIGRATION" ]] || { echo "ERROR: migration not found: $MIGRATION" >&2; exit 2; }

if [[ -n "${DATABASE_URL:-}" ]]; then
 [[ "${GITHUB_ACTIONS:-false}" == "true" ]] || { echo "ERROR: DATABASE_URL is accepted only for the isolated GitHub Actions service. Local runs must start their own Docker container." >&2; exit 2; }
 HOST="$(node -e 'console.log(new URL(process.argv[1]).hostname)' "$DATABASE_URL")"
 case "$HOST" in 127.0.0.1|localhost) ;; *) echo "ERROR: refusing non-loopback DATABASE_URL host '$HOST'." >&2; exit 2;; esac
 ADMIN_URL="$DATABASE_URL"
else
 command -v docker >/dev/null || { echo "ERROR: Docker required when DATABASE_URL is unset." >&2; exit 2; }
 PORT="${INVOICE_TEST_PORT:-55439}"
 CONTAINER="dokantools-invoice-pg-$$"
 docker run --rm -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -p "127.0.0.1:$PORT:5432" postgres:16-alpine >/dev/null
 ADMIN_URL="postgresql://postgres:postgres@127.0.0.1:$PORT/postgres"
 for _ in $(seq 1 60); do docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
 docker exec "$CONTAINER" pg_isready -U postgres >/dev/null
fi

# Only a disposable database named dokantools_invoice_test is dropped/recreated.
psql "$ADMIN_URL" -X -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS dokantools_invoice_test WITH (FORCE)"
psql "$ADMIN_URL" -X -v ON_ERROR_STOP=1 -c "CREATE DATABASE dokantools_invoice_test"
DB_URL="${ADMIN_URL%/*}/dokantools_invoice_test"
export DB_URL

cat > "$TMP/00_auth_bootstrap.sql" <<'SQL'
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create schema auth;
create table auth.users(id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
SQL
echo "BASELINE=$BASELINE"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/00_auth_bootstrap.sql"
git show "$BASELINE:supabase/schema.sql" > "$TMP/10_schema.sql"
git show "$BASELINE:supabase/migrations/20261019_inventory_catalog.sql" > "$TMP/20_inventory_catalog.sql"
git show "$BASELINE:supabase/migrations/20261019_reliability_foundation.sql" > "$TMP/30_reliability_foundation.sql"
git show "$BASELINE:supabase/migrations/20261102_p0_idempotency.sql" > "$TMP/40_p0_idempotency.sql"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/10_schema.sql"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/20_inventory_catalog.sql"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/30_reliability_foundation.sql"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$TMP/40_p0_idempotency.sql"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f "$MIGRATION"
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/00_fixture_and_seed.sql
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/10_security_rls_assertions.sql
python3 tests/postgres/20_concurrency.py
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/30_fault_injection.sql
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/202611110001_invoice_first_foundation.down.sql
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/40_rollback_assertions.sql
echo "PASS: disposable PostgreSQL 16 migration, runtime, concurrency, rollback and security suite."
