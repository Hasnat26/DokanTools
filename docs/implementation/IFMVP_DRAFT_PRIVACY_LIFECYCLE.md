# CH-2 — Invoice draft privacy lifecycle

**Baseline:** `7c746464b162e90e46bb24894f988ee45610b398`  
**Branch:** `fix/ifmvp-draft-privacy-lifecycle`

## Existing behavior inspected

- Drafts are stored in browser IndexedDB database `dokantools-invoice-drafts`, object store `drafts`.
- Each draft stores `owner_id` and `shop_id`; the composite `owner_shop` index is used by `listInvoiceDrafts(ownerId, shopId)`.
- The invoice page obtains the authenticated Supabase user and that user's shop before listing drafts.
- Logout previously called `supabase.auth.signOut()` in the global header but did not explicitly invalidate invoice-page state or in-flight reads.
- IndexedDB records survive logout, tab closure and browser restart. There is no TTL, automatic retention expiry, or logout purge.
- If IndexedDB is unavailable, draft reads/writes fail closed in the existing store implementation.

## Implemented non-destructive privacy boundary

1. Logout/auth-session loss invalidates the in-memory invoice-draft session and clears invoice-page state.
2. A different authenticated user starts a new session generation. Any pending asynchronous load from the previous generation is ignored.
3. Draft access requires an active session whose owner AND shop match both the requested identity and the draft record.
4. Account switching does not delete, rewrite, migrate or expose the previous account's stored records.
5. IndexedDB unavailable remains fail-closed; no in-memory fallback is introduced.
6. No invoice business semantics, backend schema, issuance gate or public QR behavior is changed.

## Data-retention implications

**Current implemented policy:** retain local drafts until the owner explicitly deletes an individual draft or the browser/device storage is cleared. Logout is non-destructive. This avoids silent data loss but means the old records remain in the same browser profile and may be accessible to someone with direct browser-profile/Developer Tools access. Application-level owner/shop filtering prevents another authenticated account from listing or opening them through the invoice UI; it is not encryption at rest and is not protection against a person who can inspect the browser's local storage.

No retention duration is invented. No automatic purge is implemented.

## PO decision required before destructive cleanup

PO must select and document one policy before implementation of automatic deletion:

- **A — Retain until owner deletes:** preserve drafts across logout and later re-login; disclose shared-device/local-storage risk.
- **B — Confirmed logout deletion:** show an explicit warning and require affirmative confirmation before deleting that account's local drafts; define behavior when cleanup fails or is interrupted.
- **C — Approved retention window:** choose an explicit duration, define expiry semantics and user warning/export behavior, and specify whether expiry is based on creation or last update.

If PO selects B or C, define recovery/backup expectations and whether the user can export drafts before deletion. Cleanup must be owner-scoped, transactional where possible, retryable, and observable; a failed/interrupted cleanup must not be reported as complete. Until approval, A remains the non-destructive behavior.

## Verification scope and limitations

The session guard tests cover account invalidation, same-browser account switch, owner/shop matching, and stale asynchronous work. The existing IndexedDB store still performs owner/shop-indexed reads and its existing unavailable-storage test remains applicable. These are unit-level privacy-boundary tests, not browser E2E tests, encryption-at-rest tests, or proof against direct browser storage inspection.
