# DokanTools performance and verification report

**Report date:** 2026-10-19  
**Package:** Complete restart bundle with lint-fix source merged  
**Package stage:** Reliability Foundation / Pilot Preparation  
**Local runtime used for source tests:** Node.js v22.16.0  
**Scope:** deterministic domain tests, SQL source verification, TypeScript/TSX syntax parse, and CPU-only synthetic benchmark

## Current source-level results

| Check | Result | Notes |
|---|---:|---|
| Domain unit tests | **PASS — 9/9** | Money rounding, validation, stock simulation, fail-closed insufficient-stock, duplicate retry, ambiguous names, service lines, Unicode normalization, and unit mismatch. |
| SQL static verification | **PASS** | Checks the expected RPC/migration/RLS source patterns. This does not execute PostgreSQL SQL or prove live RLS behavior. |
| TypeScript/TSX parse | **PASS — 15 files, 0 parse diagnostics** | Uses the globally available TypeScript parser. This is syntax-only, not dependency-backed type checking. |
| ZIP integrity | To be checked for the generated full restart archive | Do not use an earlier patch ZIP as the complete project. |
| Dependency-backed ESLint | **NOT RUN here** | `node_modules` is not present in this packaging environment and npm registry access timed out. Run `npm.cmd run lint` on Windows after install. |
| TypeScript typecheck / Next.js production build | **NOT RUN here** | Requires installed dependencies. Run `npm.cmd run typecheck` and `npm.cmd run build` on Windows. |
| Supabase/PostgreSQL integration, RLS isolation and concurrent load | **NOT RUN** | Requires a configured staging project and separate test-shop accounts. |

## CPU-only microbenchmark

A local run used 20,000 rounds, eight memo lines per round, and a synthetic 100-row stock list. These are single-run measurements on the packaging environment, not a production performance guarantee.

| Workload | Elapsed time | Throughput | Workload |
|---|---:|---:|---|
| Memo total calculations | **15.64 ms** | **1,278,862 calculations/s** | 20,000 memo-total calculations × 8 lines |
| Stock transaction simulations | **218.42 ms** | **91,568 simulations/s** | 20,000 simulated sales × 8 lines; 160,000 movement records in memory |
| Heap after run | **6.5 MB** | — | Process heap reading; not peak/RSS memory |

The packaging-environment benchmark uses one recorded run; the earlier report used medians from three runs, so those figures are not directly comparable. It has no HTTP requests, React rendering, Supabase, PostgreSQL, disk durability, or concurrent clients. Do **not** interpret the throughput as production request capacity.

## Package and dependency notes

- Next.js: `15.5.28`
- React / React DOM: `^19.3.1`
- React type definitions: `^19.3.0`
- jsPDF: `^4.2.1`
- The bundle intentionally does not include `node_modules`, `.env.local`, or a generated `package-lock.json`. On first `npm.cmd install`, npm will resolve dependencies and write a lockfile. The final dependency graph audit has not been run in this packaging environment. Review `npm.cmd audit` output; do not run `npm audit fix --force` blindly.

## Safety-related changes included

- Memo creation and inventory deduction go through one PostgreSQL RPC transaction; failed stock guards should roll back memo and movements together when executed against the intended schema.
- Request IDs are unique per shop and retries are intended to be idempotent; a request ID reused for a different operation is rejected.
- A memo with unpaid balance is linked to the customer due ledger in the same transaction, and customer payments cannot exceed the recorded ledger balance.
- Public page policies are narrowed to opt-in product/shop views; raw customer due, memo, inventory and shop records should not be exposed anonymously by broad policies.
- Ordinary app deletion of customers/shops is restricted to reduce casual cascading loss of financial history.
- Stock base-unit edits and implicit unit conversion fail closed; explicit package/base-unit conversion is not implemented.

These statements describe the included design/source. Live database behavior has not been proven in this environment.

## Required before a real pilot

1. From the extracted project folder run `npm.cmd install`, then `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run verify:sql`, `npm.cmd run perf`, and `npm.cmd run build`.
2. Inspect `npm.cmd audit` and resolve severe issues in a reviewed, testable change—not via blind `--force` fixes.
3. Apply migrations only to a staging Supabase project after checking its schema history. Verify RPC execution, grants and RLS with two distinct shops and owner/non-owner users.
4. Test concurrent memo submission, duplicate request IDs, insufficient stock, partial due/payment, and rollback after injected errors.
5. Test mobile/browser flows, offline/slow-network behavior, and an actual backup-restore drill.
6. Do not describe this ZIP as production-ready or fully offline-capable. A durable offline outbox, conflict resolution, complete cash/payment ledger, purchase workflow, integrated browser E2E and hosted load test remain incomplete.
