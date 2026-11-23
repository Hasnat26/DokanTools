# PR #47 — Scope, compatibility and decision record

## Intended scope

PR #47 combines the V1 Draft Memo/catalogue workflow with shop-owned categories and tenant-integrity hardening. It includes Shop Profile fields/logo handling, catalogue CRUD and category assignment, Draft Memo save/edit/print, A6 PDF evidence, and CI/runtime regressions. The PR remains open and unmerged until the PO makes a separate merge decision. No deployment, hosted migration, production write, pilot, or invoice issuance is authorized by this change.

## Invoice-First boundary (PO-10)

Discount, VAT/tax, Paid and Due remain Draft Memo-only. Invoice-First request/domain is total-only. The API rejects adjustment-bearing request shapes and returns HTTP 423 for a valid request while issuance is disabled. No adjustment fields are persisted to Invoice-First payloads.

## Stock/catalogue compatibility

`/dashboard/stock` remains the inventory management route: stock quantities, expiry dates, low-stock alerts, price updates and stock correction workflows remain available. `/dashboard/catalog` is the separate catalogue/category route. A catalogue item matched to stock by normalized name cannot be renamed, have its unit changed, or be deleted while linked; price/category updates remain allowed. Both client and database trigger guards are tested.

## Master QR behavior

Master QR and Draft Memo QR destination precedence is: (1) a validated HTTPS Google Maps URL, including supported Google Maps ccTLDs; otherwise (2) the public shop profile URL only when the profile is explicitly public; otherwise (3) no QR destination. This differs from a Maps-only QR behavior and is intentional. Disabling the public profile removes profile QR fallback.

## Maps links and legacy rows

Application validation permits supported HTTPS Google Maps hosts (including `google.com.bd` and other recognized ccTLD forms) and `maps.app.goo.gl`; arbitrary domains, credentials, ports and non-HTTPS links are rejected. Dashboard and public profile links are validated before rendering. A database CHECK constraint is installed `NOT VALID`: it preserves existing legacy values without rewriting them, but rejects invalid map links on new rows/updates. Legacy invalid links are not displayed as clickable links and must be corrected/cleared before a row update that would violate the constraint.

## Logo payload limit

Uploaded logo data URLs remain in `shops.logo_url` for this release; file size is capped at 64 KiB and dimensions at 512 × 512 pixels to bound base64/database payload size. Supabase Storage migration is deferred.

## Print language

The current A6 print flow is English-only and blocks Bengali characters. Catalogue new-product unit defaults to `pcs`, and the language error is shown when an English-incompatible product is selected for the bill. Product Owner confirmation that English-only output is an accepted release requirement remains a release decision; it is not inferred from the implementation.

## Migration safety

The destructive rollback is stored under `supabase/rollbacks/`, not the Supabase CLI migrations directory. The forward category-integrity migration is transaction-wrapped and requires PostgreSQL 15+ for column-targeted `ON DELETE SET NULL`. The local Supabase config is under `qa/supabase/` to isolate local QA configuration. CI uses disposable PostgreSQL/local Supabase only. No hosted migration was run.
