# DokanTools — Invoice-First Web MVP Owner & Customer UX Specification

**Task ID:** DT-MVP-CH2 — Owner and customer UX / Bangla invoice specification  
**Role:** CH-2 — Product & UX Lead  
**Repository:** Hasnat26/DokanTools  
**Source baseline:** `main` at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Mandatory source files read from that exact commit:**
- `WORKER_SINGLE_SOURCE_OF_TRUTH.md` — blob `5714e127aad7a81d3e26da2ac2d77fe875927fdc`
- `PROJECT_SOURCE_OF_TRUTH.md` — blob `0a2534fd67ebf5d1e3094faf147cdfa4b2cb73a5`
- `docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md` — blob `efe0d261c50a4cfc706e82c832a6f052c676127c`

**Technical design reviewed:** PR #28, document `docs/design/INVOICE_FIRST_WEB_MVP_TECHNICAL_DESIGN_v0.1.md`, review target HEAD `ec67f403a625acea195c7913d23e7a69254c5ecc`, blob `10f795ddfc24b0d3eab204b8006379616ab2ec13`.  
**Document version:** 0.3  
**Status:** UPDATED SUBMISSION v0.3 — FINAL UX ASSURANCE REMEDIATION; CH-1 / CH-4 RE-REVIEW REQUIRED  
**UX disposition of PR #28:** **ACCEPT WITH CONDITIONS**  
**Implementation authorization:** NOT GRANTED
**Additional PM-directed UX scope:** Shop Logo Management and Optional Shop Tagline

---

## 1. Purpose, authority and boundaries

**Revision 0.3 scope:** consolidated UX assurance remediation against frozen CH-4 manifest `DT-MVP-CH4-FROZEN-2026-11-10-01`; preserve UX-01–UX-64 identifiers and history; clarify actor/state/outcome, recovery, logo/category/tagline behavior, PO gates and test traceability. This is an in-place revision of the existing document and PR #30 branch.

**Current review evidence:**
- PR #30 pre-revision HEAD: `ca8324005048148b8d82c5151528ea41a2aa8a5a`.
- Existing unresolved inline P2 finding: comment database ID `4523203685`, thread `PRRT_kwDOVhBFWs61okrS`, path `docs/ux/INVOICE_FIRST_WEB_MVP_OWNER_CUSTOMER_UX_v0.1.md`, lines 157–160 at that reviewed head.
- Finding: deactivation, deletion and reactivation were specified as requirements although PO-B01–PO-B07 were not established as a canonical PO baseline.
- Issue #31 records PO-06 (minimum menu fields/lifecycle) and PO-07 (duplicate-name policy) as PENDING; its recommendations are proposals, not approvals.

**PM-directed requirements added by this assignment:** invoice logo defaults to Generated from shop name and shop type unless owner uploads a logo or explicitly chooses Blank; Uploaded takes priority over Generated; optional owner-entered tagline supports Bangla and English. UX documentation only.

**Source verification relevant to logo/tagline:**
- At pinned commit `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`, `supabase/schema.sql` blob `e859b6de9660533962eddb6f9f3d17ad8a4c1cca` defines `shops.shop_type` (NOT NULL; legacy values: grocery, pharmacy, food, salon, general) and nullable `shops.logo_url`.
- `src/app/dashboard/page.tsx` blob `ee6dc3733cd4d50ec1dd76106477d50ab4b25c0c` reads/writes `shop_type` for product presets; no logo-management UI was found there.
- No `tagline` field was found in the inspected schema/dashboard source. Tagline persistence is a CH-3 design dependency; no schema change is proposed here.
- The legacy `shop_type` choices are source-verified, not a PO-approved Invoice-First category taxonomy.


This document defines the mobile-first owner journey and customer bill-view journey for the Invoice-First Web MVP. It translates the PO-confirmed invoice mockup into screen-level requirements, interaction states, field mapping and testable UX acceptance criteria. It also independently reviews PR #28 for UX implications.

The exact PO decision record confirms the Bangla invoice format and the individual bill QR purpose. It does not approve the unresolved technical or business policies listed in Section 12.

The project authority register at the pinned baseline records:
- The existing Next.js / React / Supabase web application as the repository baseline only.
- The PO-confirmed invoice mockup as approved for invoice layout scope only.
- PO-B01–PO-B07 (food-menu policy) as NOT ESTABLISHED AS GITHUB BASELINE.
- Implementation, schema/database operations, builds, QA execution, deployment and pilot as not authorized.

Accordingly:
1. PO-confirmed invoice fields and exact Bangla wording below are binding.
2. Logo/tagline scope is PM-directed for UX design; persistence and implementation mechanics remain subject to CH-3 and PO/PM review.
3. Menu fields, duplicate semantics, units and other unresolved policies remain PO-gated.
4. PR #28 is a submitted technical proposal, not an approved architecture or implementation baseline.
5. This document is design-only. It does not authorize code, database, schema, build, test, QA, deployment, merge or pilot work.

## 2. Product UX principles

1. **Invoice-first:** the primary owner action is creating and issuing a food bill, not managing stock, customers or accounts.
2. **Small-screen operation:** common actions must work one-handed on a low-cost Android phone browser.
3. **Few decisions per screen:** show only the fields needed for the current task.
4. **No hidden side effects:** menu actions must not create stock; invoice actions must not create ledger entries or customer balances.
5. **Bill-specific identity:** each issued invoice has its own bill QR/link. A shop promotional QR is not a bill QR.
6. **Immutable issued bill:** edits to shop profile or menu do not rewrite a previously issued invoice.
7. **Explicit recovery:** uncertain save/share outcomes must not encourage duplicate invoice issuance.
8. **Privacy by default:** the customer bill page is read-only, requires no customer account, and exposes only the PO-approved bill projection.
9. **Bangla document fidelity:** invoice content is Bangla-first and must preserve the exact heading and footer strings.
10. **No false verification:** “verified” means the server found a matching issued bill record; it does not prove payment or delivery.

## 3. Roles, navigation and end-to-end journeys

### 3.1 Roles

**Shop owner/operator**
- Registers or signs in using the existing authentication entry point.
- Maintains one shop profile for the current shop account.
- Manages a food menu.
- Creates, reviews and issues bills.
- Prints/saves and shares an issued bill.
- Views bill history and bill status.

**Customer**
- Opens an individual bill URL or scans the QR printed on that bill.
- Views the read-only bill and verification status.
- Does not need a DokanTools account or access to the shop dashboard.

### 3.2 Proposed mobile navigation

Authenticated owner shell:
- **নতুন বিল** — primary action and default landing action after setup.
- **বিলসমূহ** — recent issued bills and bill detail.
- **খাবারের মেনু** — food-item catalogue; lifecycle controls appear only as approved by PO.
- **দোকানের তথ্য** — shop profile and location.

Use a compact top bar with shop identity and a persistent primary “নতুন বিল” action. On narrow screens, a bottom navigation bar may expose the four destinations. Do not add inventory, customer ledger, accounting, payment gateway, multi-branch or public-ordering destinations to this MVP navigation.

### 3.3 Complete owner journey

1. **Open / authenticate:** owner signs in through the existing application authentication. Authentication is a prerequisite, not a new customer-facing feature.
2. **Shop setup:** if no usable shop profile exists, route to the shop details form. If a profile exists, show a concise profile summary and continue to the dashboard.
3. **Save shop profile:** owner enters shop name, address, mobile number and Google Maps location. Save and show the persisted profile summary.
4. **Build menu:** owner maintains food-item records within PO-06. Only menu actions expressly approved by PO may be exposed.
5. **Start a bill:** owner taps “নতুন বিল”. The composer initially shows active menu items, a search field and an empty bill summary.
6. **Add bill lines:** owner selects menu entries, enters quantity and confirms the applicable price. The bill summary updates immediately.
7. **Review:** owner checks item names, quantities, prices and total. The review screen shows shop identity and bill contents; it must not introduce unapproved discount, tax, paid or due calculations.
8. **Issue bill:** owner confirms the issue action. The system persists the bill once and returns the canonical bill number, date/time and bill-specific reference. An uncertain response enters a status-check/retry flow; it must not create a new request ID for a blind retry.
9. **Bill ready:** show the Bangla invoice preview and clear status “বিল তৈরি হয়েছে”. QR/link must belong to this individual bill.
10. **Print / save:** owner opens browser print and can select the available printer or Save as PDF. The same invoice document is used for preview and print.
11. **Share:** owner opens WhatsApp share with a prefilled Bangla message and the exact bill URL. If WhatsApp is unavailable, owner can copy the link/message or use the device share sheet.
12. **Return / history:** owner returns to “বিলসমূহ”, opens the issued bill and repeats print/share without creating another invoice.

### 3.4 Customer journey

1. Customer scans the QR on the physical bill or opens the bill link received from the owner.
2. Browser opens a public bill page; no login or shop-page subscription/publication is required.
3. The page first establishes a verification state. It must not briefly display unverified bill content as if already verified.
4. If the reference is valid and the bill is issued, show the bill details and a clear “বিলটি DokanTools রেকর্ডে যাচাইকৃত” status.
5. Customer can tap the shop map link or shop mobile number using the device's normal link handlers.
6. If the bill is invalid, revoked, unavailable or cannot be verified, show the corresponding safe state in Section 9. Never imply that a failed verification is successful.

## 4. Owner screen specifications

### 4.1 Screen O-01 — Shop registration / profile

**Purpose:** capture the shop identity used on the invoice.

| Field | UX control | Requirement / behavior |
|---|---|---|
| Shop name | Single-line text | Required; trim outer whitespace; preserve owner-entered display spelling |
| Shop address | Multi-line text | Required for the invoice header; allow line wrapping |
| Mobile number | Tel input with numeric mobile keyboard | Required by PO mockup; preserve display form; validate plausible Bangladesh mobile format only after PO confirms the exact rule |
| Google Maps location | URL input with “Open Maps” / “Paste link” guidance | Required location reference in PO mockup; accept a validated Google Maps URL, not an unverified arbitrary external URL |
| Save | Primary button | Disabled while saving; prevent duplicate submission |

**Flow:**
- Empty profile → show setup form with a short explanation that these details appear on every bill.
- Existing profile → show profile summary with Edit action.
- Successful save → show saved confirmation and continue to dashboard.
- Edit profile → warn that changes apply to future invoices only; previously issued bills retain their saved shop snapshot (subject to PR #28's proposed immutable snapshot design).

**Validation:**
- Required fields show inline error adjacent to the field.
- Do not clear valid fields after a validation error.
- Map URL error must explain how to copy a Google Maps share link.
- Do not claim a map pin has been geocoded or verified; the UX stores and links the supplied Maps location.

**States:** initial loading, empty profile, field validation, save pending, saved, network failure, retry. During a failed save, preserve entered values and allow retry.

#### O-01A — Invoice logo management (PM-directed UX)

**Classification:** PM-directed requirement for UX design. Storage, generator mechanics, upload policy and historical snapshots require CH-3/PO/PM disposition.

**Logo modes and precedence:**

| Mode | Owner choice | Invoice behavior | Classification |
|---|---|---|---|
| Generated | Default when no upload exists and owner has not explicitly selected Blank | Generated mark based on shop name + shop type | PM-directed; generator/persistence mechanics CH-3 design |
| Uploaded | Owner uploads or replaces an image | Uploaded asset takes priority over Generated | PM-directed; upload/storage constraints technical-gated |
| Blank | Owner explicitly chooses “লোগো দেখাবেন না” | No logo, mark, placeholder or automatic logo | PM-directed |
| Return to Generated | Owner selects Generated after Blank/removal | Generate/use mark from current name and type | PM-directed |

Resolution order: uploaded asset → Generated by default; explicit Blank is an override and suppresses generation. Removing an uploaded logo requires an explicit choice between Generated and Blank. Regenerate applies only to Generated and never overwrites Uploaded.

**Shop-type dependency — source verified; taxonomy PO-gated:**
- Pinned schema already defines `shops.shop_type`, NOT NULL, with legacy values grocery/pharmacy/food/salon/general.
- Pinned owner dashboard reads/writes the field for product presets. A shop-type field already exists in source.
- Legacy choices are not proof of the final PO-approved Invoice-First taxonomy. Do not add, rename or remove options. Use saved type for design preview; PO/PM must confirm the accepted list and owner editability.
- Missing/invalid type must not be guessed; prompt from approved options only after the taxonomy is established.

**Owner controls:** Generated/Uploaded/Blank selector; generated preview identifies name/type inputs; Upload/Replace; Remove asks Generated or Blank; Regenerate only in Generated mode. Shop name/type edits do not affect Uploaded or Blank. Logo actions never modify tagline.

**Upload errors (limits unresolved):**
- Unsupported format: reject with actionable guidance; accepted formats require CH-3/PM definition.
- Oversized file: reject; byte/pixel limits require CH-3/PM definition.
- Corrupt/unreadable image: reject before replacing current asset.
- Upload timeout/failure: preserve old logo, mode and tagline; offer retry.
- Failed replacement must not delete old asset.
- Missing asset on preview/print: show warning/retry; never show fallback logo in Blank mode.

**Responsive behavior:** mobile stacks mode controls and compact preview without horizontal scroll; larger screens may place controls/preview side-by-side. Preview, customer view, PDF and print use the same resolved mode/asset. Preserve aspect ratio; exact bounds are a CH-3 design parameter.

#### O-01B — Optional shop tagline (PM-directed UX)

- Field label: “দোকানের স্লোগান / Tagline (Optional)”.
- Owner-entered text only; no AI generation, auto-suggestion, rewrite, translation or automatic replacement.
- Blank is valid and renders no text, placeholder or separator.
- Supports Bangla, English and mixed-script text.
- Proposed maximum: **80 Unicode grapheme clusters**. This is CH-2 recommendation, not approved policy; CH-3 must define consistent grapheme-aware validation/persistence.
- A counter appears only after the proposed limit is approved; until then it is labelled proposed.
- Tagline edit/save is independent of logo upload/replace/remove/regenerate/Blank.
- Examples only, never defaults: “নামাজ কায়েম করুন”, “আপনার বাচ্চাকে স্কুলে দিন”, “বিশুদ্ধ খাবার, সাশ্রয়ী দাম”, “সততা ও গুণগত মানে আমরা অঙ্গীকারবদ্ধ”.
- Proposed placement: below shop/contact/map details and above “খাবারের বিল”. No PO-confirmed invoice field changes.
- Tagline is not sent to a logo-generation prompt.
- Over-limit text shows inline validation and is preserved; blank remains valid.
- Mixed scripts wrap without clipping in preview/print/PDF. Emoji/control/line-break acceptance needs definition; do not silently strip text.

**Historical invoice header — recommendation, not approved:** CH-2 recommends snapshotting logo mode, immutable uploaded/generated asset reference or derivative, tagline and shop identity at invoice issue. PR #28's earlier technical design snapshots shop name/address/phone/map but does not define logo/tagline snapshots. Existing `shops.logo_url` alone does not guarantee immutable history. CH-3 must define immutable asset/reference retention and missing-asset behavior. PO/PM must decide original-header snapshot versus latest profile display; until then this remains PO-GATED. Logo edits never change tagline and vice versa.


### 4.2 Screen O-02 — Food menu

**Purpose:** maintain the PO-approved food-item catalogue for future bills, without inventory functionality.

**List view — PO-GATED lifecycle presentation:**
- Page title: “খাবারের মেনু”.
- Exact catalogue actions (create, edit, enable/disable, archive, delete, restore/reactivate) must come only from PO-06 once approved.
- Do not assume the existing `is_active` column authorizes an owner-facing lifecycle, default filter, confirmation or deletion policy.
- Search, grouping, status labels, active/inactive tabs and row actions remain provisional until PO-06 is approved.
- No stock quantity, purchase price, supplier, stock adjustment or inventory status is shown; Invoice-First exclusion of inventory controls is confirmed scope.

**Menu form — PO-GATED fields:**

| Candidate field | Proposed control | Classification |
|---|---|---|
| Food/item name | Text input | Proposed UX; requiredness/name limits depend on PO-06 |
| Selling price (BDT) | Numeric input | Proposed UX; precision/range depends on PO-06 and PO-08 |
| Unit | No fixed control until decision | PO-GATED; do not assume required, optional or default |
| Lifecycle state | Control only if expressly approved | PO-GATED |

**Pending PO-06 behavior:**
- Do not present Add/Edit/Deactivate/Activate/Delete as a frozen implementation contract.
- Use a neutral catalogue list/form shell in review material; lifecycle actions are marked “Pending product decision”.
- Do not claim new entries default active, inactive entries are excluded from bills, old names become reusable, or reactivation re-checks uniqueness unless PO-06/PO-07 says so.
- Composer eligibility is exactly the rule later approved under PO-06; it is not defined here.
- Issued invoice lines retain persisted details; exact snapshot fields must align with PO-04/PO-05 and approved technical design.

**Empty states:**
- No menu entries: explain that PO-approved menu setup is needed before invoice composition; action label depends on PO-06.
- No search result: show “কোনো খাবার পাওয়া যায়নি” with clear search reset.
- Lifecycle-specific empty states are omitted until PO approves those states.

**Policy boundary:** PO-06 must decide minimum fields/lifecycle, including deactivation/reactivation/deletion/restore availability and effect on invoice selection/history. PO-07 must decide duplicate-name handling. Until approved, these behaviors are PO-GATED, not implementation requirements.

### 4.3 Screen O-03 — Invoice composer

**Purpose:** assemble the current sale as a bill.

**Initial state:**
- Header: “নতুন বিল”.
- Search field: “খাবারের নাম লিখে খুঁজুন”.
- Catalogue entries eligible under the PO-approved PO-06 rule only; do not infer active/inactive filtering while PO-06 is pending.
- Each menu row shows food name and selling price; unit only if approved.
- Empty bill summary: “এখনও কোনো খাবার যোগ করা হয়নি”.
- Sticky bottom summary: current total and “বিল পর্যালোচনা” action, disabled until at least one valid line exists.

**Add item interaction:**
- Select an eligible catalogue row to add one line, once PO-06 defines eligibility.
- Quantity control has decrement, editable quantity and increment actions with touch-friendly targets.
- Default quantity of 1 is a proposed usability default, not an approved business rule.
- Show the current menu price. If price is editable in the composer, label it clearly as a draft-specific override and obtain PO approval first; until then, price override is not part of the approved UX.
- Repeated selection of the same item should have a consistent behavior (increment quantity versus separate line); this requires PO confirmation or explicit product decision.

**Bill lines:**
- Food/item name.
- Quantity.
- Price (the PO mockup's exact “মূল্য” concept; whether this means unit price or extended line amount is unresolved).
- Remove-line action with undo or a clear immediate feedback message.
- Total bill amount.

**Validation / calculations:**
- Quantity must be present and valid before review.
- Price must be present and valid from the approved source.
- Client total is a preview only; the authoritative persisted amount must be calculated/validated by the server transaction.
- No discount, tax, paid, due, change, customer ledger or payment status fields appear unless PO approves them separately.
- Zero-value lines / zero-total bills and quantity precision are unresolved PO decisions; the UX must display a validation message returned by the approved business rule rather than inventing a rule.

**Long menu:** search must remain available; list scrolls independently from the bill summary; the composer must not render every menu row as an oversized card. Search state remains when returning from line editing.

**Long bill:** all lines remain reviewable; the summary/issue action remains accessible without covering the last line. The invoice preview may paginate if content exceeds the chosen paper height; it must never truncate lines.

### 4.4 Screen O-04 — Review and issue

**Purpose:** final owner confirmation before a bill becomes issued.

Show:
- Shop name and short shop identity.
- Full list of item names, quantities and price values.
- Total bill amount.
- Clear “Edit bill” action.
- Primary “বিল তৈরি করুন” action.

Before issuing:
- Show a concise confirmation that the bill will be created and a bill number assigned.
- Do not claim that a customer has paid.
- Do not ask for customer phone or customer registration.
- Disable repeated taps while the same request is pending.
- Use one request identity for the same logical draft; after timeout, check whether the bill exists before offering retry.

After success:
- Navigate to the issued bill detail/preview.
- Display bill number and creation date/time from the persisted invoice response.
- Show the QR/link only after the bill-specific URL is available.
- Provide Print / Save PDF and WhatsApp share actions.

### 4.5 Screen O-05 — Issued bill detail / history

**History list:**
- Most recent bills first (ordering is a proposal pending PO confirmation).
- Show bill number, date/time and total.
- Status text for issued/revoked if revocation is approved.
- Tap row to open immutable bill detail.

**Detail view:**
- Re-render the persisted invoice snapshot, not the current shop/menu profile.
- Actions: Print / Save PDF, WhatsApp share, Copy bill link.
- Reprinting must not create a new bill number.
- A failed share action must not change invoice status.
- Cancellation/revocation controls are withheld until PO confirms lifecycle and wording.

## 5. One-page professional Bangla invoice UX

### 5.1 Visual hierarchy

The standard invoice is a compact, clean, single-column portrait document designed for small food shops. It should remain legible on a phone preview and on a printed page.

1. Shop header: resolved logo (Generated, Uploaded or Blank) with shop name.
2. Address, mobile and Google Maps location.
3. Optional owner-entered tagline if non-blank.
4. Mandatory Bangla heading.
5. Bill metadata.
6. Item table.
7. Total amount, visually emphasized.
8. Individual bill QR and verification/details caption.
9. Mandatory Bangla footer.

Generated shows a mark based on name/type; Uploaded shows the asset without stretching; Blank shows no image or placeholder and lets text reflow. Mobile header stacks as needed without horizontal overflow. Print/PDF uses the same resolved mode and asset. Tagline is separate text below shop details and above the mandatory heading.

Use high-contrast dark text on a white background, restrained separators, consistent numeric alignment and generous enough spacing for Bangla shaping. Avoid decorative graphics that reduce printable area.

### 5.2 Mandatory strings

- Heading must be exactly: **খাবারের বিল**
- Footer must be exactly: **ধন্যবাদ, আবার আসবেন!**

Do not translate, paraphrase, replace, omit or render these as image-only text.

### 5.3 PO field-to-invoice mapping

| PO-confirmed field | Invoice location | Source / behavior |
|---|---|---|
| Shop name | Top shop identity block, beside/below logo by viewport | Snapshot from shop profile at issue |
| Invoice logo | Header logo area before/next to shop name | PM-directed: Uploaded takes priority over Generated; explicit Blank suppresses all logos; historical snapshot policy PO/PM-gated. |
| Optional tagline | Below shop contact/map block and above “খাবারের বিল” | PM-directed owner text; blank omits line; proposed 80 grapheme-cluster limit awaits approval.
| Shop address | Directly below shop name | Snapshot; wrap to additional line if needed |
| Mobile number | Shop identity block, labelled “মোবাইল:” | Snapshot; tap-to-call link in digital view |
| Google Maps shop location | Shop identity block as “Google Maps Location” / map link | Snapshot URL; tap opens external Maps location |
| Heading “খাবারের বিল” | Centered or clearly prominent title below shop identity | Exact literal string |
| Bill number | Metadata block, labelled “Bill No:” | Persisted server-assigned number |
| Date | Metadata block, labelled “তারিখ:” | Persisted issue date; display DD-MM-YYYY as illustrated, pending timezone/format confirmation |
| Time | Metadata block, labelled “সময়:” | Persisted issue time; display HH:MM as illustrated, pending timezone/format confirmation |
| Food/item name | First item-table column, labelled “খাবার/আইটেম” | Immutable line snapshot |
| Quantity | Second item-table column, labelled “পরিমাণ” | Immutable line snapshot |
| Price | Third item-table column, labelled “মূল্য” | Immutable line amount/value; whether PO means unit price or extended line amount requires clarification |
| Total bill amount | Emphasized total block, labelled “মোট বিল” | Persisted invoice total |
| Bill verification / bill details QR | Lower invoice block, labelled “বিল যাচাই / বিলের বিস্তারিত” | QR encodes this bill's own customer URL, never the shop profile URL |
| Footer “ধন্যবাদ, আবার আসবেন!” | Bottom of invoice after QR block | Exact literal string |

The PO mockup does not confirm customer name, customer mobile, discount, tax, paid, due, payment method, order number, stock or account balances. These must not be silently added to the standard invoice.

### 5.4 Layout and responsive print behavior

- Standard/normal bill target: one page.
- Long item names wrap; they are never truncated with ellipses in the issued document.
- If the full invoice cannot fit on one page at readable type size, paginate rather than clip or shrink below a legible size.
- Keep QR, QR caption and footer together where practical.
- Repeat bill number/shop context and item-table headings on continuation pages.
- Do not split an individual item row across pages.
- Digital preview scales to viewport width with readable zoom; it must not require horizontal scrolling.
- Paper size is not PO-approved. A5 portrait is a CH-3 proposal only; A4 and 80 mm thermal output remain open choices.
- The same invoice component/data snapshot must drive preview and print output to avoid divergent values.

### 5.5 PDF and print interaction

Primary action: “প্রিন্ট / PDF”.

Expected browser flow:
1. Load invoice snapshot and local Bengali font.
2. Wait for fonts and QR image to be ready.
3. Open the browser print dialog.
4. Owner selects a printer or “Save as PDF”.
5. Return to bill detail without creating another bill.

If print is unavailable or the browser blocks the dialog, retain the bill and show a retry action plus Copy bill link. Do not claim a PDF was downloaded unless the browser actually confirms an artifact (native print dialogs may not provide such confirmation).

## 6. WhatsApp and alternative sharing UX

### 6.1 Primary WhatsApp action

Button label: “WhatsApp-এ পাঠান”.

Prefilled message should be generated from the persisted bill snapshot and contain:
- Shop name.
- Bill number.
- Date/time.
- Total bill amount.
- Individual bill URL.
- Exact footer wording if PO approves the message text.

Suggested copy (message wording is proposed, not separately PO-approved):

> [দোকানের নাম]  
> খাবারের বিল: [Bill No]  
> তারিখ: [তারিখ] | সময়: [সময়]  
> মোট বিল: ৳[মোট]  
> বিল দেখুন ও যাচাই করুন: [Bill URL]  
> ধন্যবাদ, আবার আসবেন!

Use the WhatsApp share chooser without requiring a customer phone number. Do not silently send to a stored contact.

### 6.2 Fallbacks

If WhatsApp is not installed, unavailable, blocked or cannot be opened:
- Show “WhatsApp খোলা যাচ্ছে না”.
- Offer Copy bill link.
- Offer Copy message.
- Offer device-native Share where supported.
- Keep Print / Save PDF available.

Copy/share failure must not invalidate or duplicate the bill. Customer mobile number is not required for bill creation or sharing; collecting/storing a phone number is outside this confirmed invoice mockup.

## 7. Customer bill QR/link and verification UX

### 7.1 Public bill page

Proposed route from PR #28: `/bill/v1/{invoiceId}/{signature}`. Route syntax is technical proposal, not PO policy.

Page must:
- Open without customer login.
- Be independent of the shop promotional page's `is_public` setting.
- Show only the allow-listed PO bill data.
- Show verification status in a clear text label, not color alone.
- Avoid displaying owner credentials, customer identity, ledger, stock, other invoices or internal IDs.
- Make shop mobile and Google Maps location usable as links where valid.
- Set a no-store/noindex/no-referrer privacy posture as proposed by CH-3.

### 7.2 Customer verification states

| State | Customer-facing content | Available action |
|---|---|---|
| Loading / checking | “বিল যাচাই করা হচ্ছে…” with progress indicator | Wait; do not show a success badge prematurely |
| Verified issued bill | “বিলটি DokanTools রেকর্ডে যাচাইকৃত” plus the complete bill | Print/share through browser controls if supported |
| Invalid/malformed/tampered reference | “এই বিলের লিংকটি সঠিক নয় বা যাচাই করা যায়নি” | Return to sender/shop; no bill data shown |
| Valid reference, record unavailable | “বিলের তথ্য পাওয়া যাচ্ছে না” | Retry; contact shop |
| Revoked bill | “এই বিলটি বাতিল করা হয়েছে” | Contact shop; details hidden unless PO explicitly approves otherwise |
| Integrity check failure | “বিলের তথ্য যাচাই করা যায়নি” | Retry later/contact shop; never show as verified |
| Offline / no connection | “ইন্টারনেট সংযোগ নেই। বিল যাচাই করতে সংযোগ চালু করুন।” | Retry when online |

Verification statement is limited: a valid status confirms a matching issued DokanTools record. It is not proof of payment, delivery, food quality or legal/tax certification.

### 7.3 QR behavior

- Every issued bill has its own QR.
- QR opens the corresponding bill URL, not `/shop/{shopId}`.
- QR is a locator; the server record/status is authoritative.
- A QR scan must never expose another shop's invoice or any unrelated customer/ledger data.
- Invalid, tampered, revoked or unavailable QR references use the states above.
- Offline QR generation/verification behavior remains unresolved; do not represent an offline QR as verified until the server can verify the corresponding persisted record.

## 8. Mobile-first interaction and accessibility specification

### 8.1 Layout breakpoints

These are UX design targets, not claims about the current implementation:
- **320–359 CSS px:** compact narrow-phone support; stack fields and actions; no horizontal page scrolling.
- **360–767 CSS px:** primary phone layout; one-column screens and sticky primary action where it does not obscure content.
- **768–1023 CSS px:** tablet layout; form and preview may use two columns if both remain readable.
- **1024 CSS px and above:** desktop dashboard; wider menu/history table and side-by-side invoice composer/preview are permitted.

The mobile layout is authoritative for interaction order. Desktop must not introduce additional required fields or business rules.

### 8.2 Touch, type and input

- Primary interactive targets should be approximately 44 × 44 CSS px where practical.
- Inputs must have persistent visible labels; placeholders are examples, not the only label.
- Use appropriate mobile keyboards: tel for mobile, decimal/numeric for quantity/price.
- Do not rely on color alone for active/inactive, verified/invalid or error states.
- Maintain visible keyboard focus and logical tab order.
- Error text must be associated with the relevant field and announced to assistive technology.
- Bangla text must wrap without clipping; support browser text scaling and zoom.
- Keep destructive or irreversible actions away from primary thumb actions and require confirmation.

### 8.3 Loading, empty, validation, failure and retry matrix

| Context | Loading | Empty | Validation / failure | Retry / recovery |
|---|---|---|---|---|
| Shop profile | Skeleton or “তথ্য লোড হচ্ছে” | First-time setup form | Required fields/map URL invalid; save/network failure | Preserve entered values; retry save |
| Menu list | Loading rows | No menu items / no search results | Invalid name/price per approved PO rules; duplicate response | Keep form values; allow correction and retry |
| Invoice composer | Loading active menu | No active foods / empty bill | Invalid quantity/price, inactive item, calculation mismatch | Preserve draft; refresh authoritative menu and revalidate |
| Invoice issue | “বিল তৈরি হচ্ছে…” | Not applicable | Validation rejection, server failure, timeout/unknown result | Check request status first; retry same request identity/payload |
| Bill history/detail | Loading list/detail | No issued bills | Network/server error | Retry fetch; do not create new invoice |
| Print/PDF | Font/QR preparation | Not applicable | Font/QR/print unavailable, popup blocked | Retry; browser print/save; copy link fallback |
| WhatsApp | Preparing message | Not applicable | App missing, popup blocked, share cancelled | Copy message/link; native share; print |
| Customer verification | “বিল যাচাই করা হচ্ছে…” | No bill record | Invalid, revoked, unavailable, integrity failure | Retry only for transient/network failures; never relabel failure as verified |
| Any screen offline | Offline banner | Cached read-only content only if explicitly available | Writes/verification cannot be confirmed | Reconnect; check pending invoice status before retry |

**Offline behavior constraint:** the pinned README states that a complete offline transaction queue/PWA service-worker implementation is not included. PR #28 also lists online-only versus offline queue as a PO decision. Therefore this UX does not promise offline issuance. While offline:
- Clearly display an offline banner.
- Do not present an unconfirmed bill as issued or verified.
- If a local draft is safely persisted by a future approved implementation, show “খসড়া সংরক্ষিত”; otherwise warn that the draft is not safely saved.
- Disable issue/share-link generation until connectivity returns.
- On reconnect, check whether a previously submitted request succeeded before allowing another submission.
- Customer verification requires a live connection unless PO approves and a separately verified offline-verification design exists.

## 9. Validation, failure and recovery details

### 9.1 Form validation

- Validate required fields on blur and submit; avoid aggressive error display before user interaction.
- Keep errors specific and actionable.
- Preserve all valid input after server rejection or connectivity failure.
- Use server/RPC validation as final authority; client checks are usability only.
- Do not hardcode unresolved business limits (mobile format, menu name length, quantity precision, zero price, line count) as approved policy.

### 9.2 Invoice issue uncertainty

If request times out after submit:
1. Display “বিল তৈরির অবস্থা যাচাই করা হচ্ছে”.
2. Query/check the same request identity.
3. If the bill exists, show that canonical bill.
4. If the request is known not to have committed, offer retry with the same request identity and payload.
5. If the result remains unknown, keep the screen in an explicit pending/unknown state and do not create a fresh request automatically.

### 9.3 Data integrity and stale data

- If shop profile or menu data changes during composition, the review screen must identify changed/inactive entries and ask the owner to refresh/review.
- Once issued, the bill must render from persisted snapshots.
- If the saved snapshot fails integrity validation, show a failure state; do not render a green verified status.
- Reprinting/sharing an issued bill must use the same bill ID, number and snapshot.

## 10. Exact PO field mapping summary

The full field-level mapping is in Section 5.3. This compact checklist is the acceptance reference:

- [ ] Shop name — top identity block.
- [ ] Shop address — below shop name.
- [ ] Mobile number — shop identity block.
- [ ] Google Maps shop location — map link in shop identity block.
- [ ] Exact heading: **খাবারের বিল**.
- [ ] Bill number — metadata block.
- [ ] Date — metadata block.
- [ ] Time — metadata block.
- [ ] Food/item name — first item-table column.
- [ ] Quantity — second item-table column.
- [ ] Price — third item-table column; unit-versus-line meaning awaits PO clarification.
- [ ] Total bill amount — emphasized “মোট বিল” block.
- [ ] Individual bill verification/details QR — lower invoice block with caption.
- [ ] Exact footer: **ধন্যবাদ, আবার আসবেন!**.

No shop QR may substitute for the individual bill QR. No unapproved discount/tax/paid/due or customer fields may be inserted into the confirmed layout.

## 11. PR #28 — independent UX review

**Technical review target referenced by CH-1 Issue #31:** PR #28 v0.2 HEAD `2b1e0be89e2487bedf841dbc8247d646529ae7cc`, blob `348ec933a2798ba2c790707397d723e8377a8442`.  
**Technical review reference:** PR #28 current live state must be checked at CH-1/CH-4 review time; Issue #31 identifies the v0.2 source above.  
**Review method:** static document review only. No implementation/runtime testing was performed.

### 11.1 Severity-ranked UX gaps and conditions

| Severity | PR #28 area | UX gap / risk | Required UX disposition |
|---|---|---|---|
| **P1 — High** | §15 PO-I07; §14 offline risk | Online-only versus offline bill creation is unresolved. README says complete offline transaction queue/PWA is absent. Owner cannot be promised offline issue/verification. | PO must explicitly decide release behavior. Until then, UX must block issuance while offline and show honest recovery states. |
| **P1 — High** | §9 Food menu; authority register §3.3 | Menu policy PO-B01–B07 is NOT ESTABLISHED AS GITHUB BASELINE. Proposed fields/default unit and duplicate handling are not PO decisions. | Keep menu field rules provisional; recover/pin exact PO decision before implementation. |
| **P1 — High** | §7 print/PDF | A5 portrait is only CH-3 recommendation; PO paper size is open. “One-page” expectation conflicts with long-bill overflow unless pagination behavior is explicit. | PO selects paper size; UX requires one-page normal bill and lossless pagination for long bills. |
| **P1 — High** | PO mockup vs §10/§15 | PO label “মূল্য” does not resolve whether the displayed price is unit price or extended line amount. | PO must define column semantics. Composer may show both unit price and line amount, but final invoice column must follow the decision. |
| **P1 — High** | §6 public bill page | Valid/revoked/invalid/integrity states are listed, but customer-visible wording, whether revoked details remain visible, and retry behavior need product-level confirmation. | Use the safe states in Section 7.2 as the UX proposal; PO must approve revoked-detail policy and final wording. |
| **P1 — High** | §8 WhatsApp | Suggested Bangla message is not PO-approved; sharing failure/cancel fallback is described but not screen-level. | Use the fallback UX in Section 6; approve exact message wording before release. |
| **P2 — Medium** | §§4, 9, 12 | Routes/components and technical backlog are described, but owner navigation, screen-level forms, empty/loading/error states, long-menu/long-bill and mobile breakpoints are not specified. | Adopt Sections 3–9 as the UX specification. |
| **P2 — Medium** | §4.2 one-off line | One-off/custom line is proposed, but it bypasses menu governance and has no PO-approved policy/validation path. | Exclude from first UX baseline until PO explicitly approves ad-hoc line behavior. |
| **P2 — Medium** | §§5–6 | Invoice snapshot and share flows are technically proposed, but owner-visible post-issue state, repeat print/share, unknown request outcome and duplicate-tap recovery need explicit behavior. | Apply O-04/O-05 and Section 9.2; same request identity on retry. |
| **P2 — Medium** | §6.1 public projection | The allow-list is sound, but the page's loading, no-connection, unavailable and accessibility states need explicit UI behavior. | Apply customer states in Section 7.2 and accessibility requirements in Section 8. |
| **P2 — Medium** | §7.1 print | Bengali font/print strategy is a recommendation, not rendering evidence; one-page behavior cannot be accepted without font shaping and overflow criteria. | Keep as design direction only; later proof must cover Bangla shaping, print and multi-page overflow. |
| **P3 — Low** | §4.1 dashboard | Legacy memo/stock modules may remain visible beside invoice-first flow, creating navigation confusion for target micro-shops. | CH-1/PO should decide whether to hide, de-emphasize or retain legacy links; do not delete existing modules in this UX task. |
| **P3 — Low** | §8 share | Device-native share and WhatsApp behavior vary by browser/platform. | Provide Copy link/message and Print fallbacks; test target browsers only after separate QA authorization. |
| **P2 — Medium** | §4.2 and UX-06–UX-11 | v0.1 stated menu lifecycle actions as requirements without approved PO source. | v0.2 removes unsupported assertions and marks PO-06/PO-07 behavior PO-GATED; see §11.2. |

### 11.2 Existing PR #30 inline P2 finding — response

**Finding:** inline comment database ID `4523203685`, thread `PRRT_kwDOVhBFWs61okrS`, “Keep unpinned menu lifecycle rules provisional”.

| Disputed v0.1 wording | Evidence | v0.2 correction |
|---|---|---|
| Active/inactive status, tabs and filters | Not approved; PO-06 PENDING | Removed as firm requirements; lifecycle PO-GATED |
| Deactivate/Activate actions | Not approved | Removed from required UX; only if PO-06 approves |
| Inactive entries available for reactivation | Unsupported | Removed; PO-GATED |
| Permanent deletion excluded from normal UX | Unsupported lifecycle assumption | Removed as requirement; PO-GATED |
| New item active by default | Unsupported | Removed; initial state PO-GATED |

**Evidence:** pinned `PROJECT_SOURCE_OF_TRUTH.md` §3.3 classifies PO-B01–PO-B07 as NOT ESTABLISHED AS GITHUB BASELINE. Issue #31 shows PO-06 and PO-07 as PENDING; recommendations are proposals, not approvals.

**Resolution:** retain only the confirmed exclusion of inventory/stock controls. Menu fields, create/edit scope, lifecycle, invoice selection eligibility and duplicate behavior are PO-GATED. UX-06–UX-11 are rewritten so unsupported lifecycle behavior is not a requirement. The finding is addressed by accurate classification, not guessed policy.

**Reviewer request:** re-review this head and resolve the thread only if the correction is sufficient. CH-2 does not self-resolve the thread.

### 11.3 Positive technical alignment

The following PR #28 directions are UX-compatible, subject to the listed conditions:
- Separate invoice domain/RPC rather than reusing memo RPC with stock/ledger side effects.
- Immutable shop and line snapshots for issued bills.
- Bill-specific signed QR/link rather than shop QR.
- Public bill projection with explicit allow-list and no customer/ledger exposure.
- Menu-only screen separated from stock creation.
- Bangla HTML/print document using a local Bengali-capable font.
- Idempotent invoice creation and explicit lost-response recovery.
- WhatsApp share chooser and copy/native-share fallbacks.

These are design-review observations, not approval of the technical architecture, schema or security implementation.

### 11.4 Explicit UX disposition

**PR #28 UX disposition: ACCEPT WITH CONDITIONS.**

Conditions:
1. CH-1/PO disposition decisions in Section 12, including menu lifecycle, shop-type taxonomy, upload constraints and historical header policy.
2. CH-3 incorporates logo-mode representation, asset handling, tagline persistence, immutable header snapshots and shared preview/print rendering into technical design before implementation.
3. Menu UX does not rely on PO-B01–PO-B07 until canonical evidence is recovered or PO-06/PO-07 are explicitly approved.
4. Offline capability is not advertised unless PO and technical design support it.
5. CH-1/PM separately authorizes implementation, QA execution, merge and deployment as applicable.

This is a CH-2 UX disposition only. It is not CH-1 acceptance, architecture approval, PM implementation authorization or QA acceptance.

## 12. Unresolved PO decisions — explicit register

No item below is silently decided by this UX specification.

| ID | Unresolved decision | Why it matters / interim UX treatment |
|---|---|---|
| PO-UX-01 | Paper size: A5, A4, 80 mm thermal, or multiple profiles | Controls one-page layout and printer compatibility. A5 is only a CH-3 recommendation. |
| PO-UX-02 | Offline issue requirement for the web MVP | Current README says complete offline transaction queue/PWA is absent. Interim: no offline issue/verification claim; block issue while offline. |
| PO-UX-03 | Bill number format, prefix, sequence scope and reset policy | Displayed number is PO-confirmed, but formatting/sequence is not. Interim: show server-assigned value without inventing reset rules. |
| PO-UX-04 | Meaning of invoice table “মূল্য” | Unit price versus extended line amount is ambiguous. Composer may show both; printed column awaits PO decision. |
| PO-UX-05 | Quantity semantics, precision, unit and repeated-item behavior | PR #28 proposes up to 3 decimals; this is technical proposal, not PO approval. |
| PO-UX-06 | Food menu PO-B01–PO-B07 exact canonical decision record | Authority register says NOT ESTABLISHED AS GITHUB BASELINE. Required before locking menu validation, fields, duplicate and activation rules. |
| PO-UX-07 | Menu unit required/default (including PR #28 proposal “পিস”) | Not confirmed by the invoice mockup. Keep unit conditional until decided. |
| PO-UX-08 | Duplicate food-name policy and name normalization | Existing case-sensitive unique constraint is not a UX policy. Do not invent Unicode/case-folding behavior. |
| PO-UX-09 | Price precision, zero price, zero-total bill and maximum amount | PR #28 proposes numeric ranges/precision; PO policy remains pending. |
| PO-UX-10 | One-off/custom line without a menu item | PR #28 proposes it; this UX excludes it until PO approves. |
| PO-UX-11 | Discount, tax, paid, due, payment method and change fields | Not present in the confirmed invoice mockup. Excluded until explicit PO approval and formula/scope decision. |
| PO-UX-12 | Customer name/mobile on invoice or share | Not in the confirmed mockup. Current UX does not require or collect it. |
| PO-UX-13 | Cancellation/revocation, correction and customer-visible revoked details | PR #28 proposes issued/revoked states; PO must approve wording, reason capture and whether old line details remain visible. |
| PO-UX-14 | Public bill-link lifetime, revocation and signing-key rotation policy | Technical/security policy; owner/customer expectations depend on it. |
| PO-UX-15 | Final WhatsApp message wording and whether footer appears in the message | Suggested copy is provisional. |
| PO-UX-16 | Date/time timezone and exact display locale | Mockup illustrates DD-MM-YYYY and HH:MM; authoritative timezone/display policy must be confirmed. |
| PO-UX-17 | Maximum expected bill lines and pagination threshold | UX preserves all lines and paginates rather than truncating; no business maximum is imposed. |
| PO-UX-18 | Shop mobile validation and accepted Google Maps URL formats | Required fields are confirmed; exact validation policy is not. |

### Additional PO/PM decisions — Logo, Shop Type and Tagline

| ID | Decision | Status |
|---|---|---|
| PO-UX-19 | Confirm whether existing `shops.shop_type` choices (grocery, pharmacy, food, salon, general) are the approved Invoice-First taxonomy and whether owner may edit shop type. | Field verified in source; taxonomy/edit policy PO-GATED. |
| PO-UX-20 | Confirm generated-logo method: deterministic local rendering or generated image asset. | PM requires generation; mechanism CH-3 design gate. |
| PO-UX-21 | Confirm supported image formats, max bytes/pixels, aspect ratio and transparency policy. | PM requires upload validation; exact limits require CH-3 recommendation and PO/PM disposition. |
| PO-UX-22 | Confirm persistence of default Generated mode and explicit Blank selection. | PM-directed UX; persistence details PO/PM-gated. |
| PO-UX-23 | Confirm proposed tagline maximum of 80 Unicode grapheme clusters. | CH-2 proposal, not approved. |
| PO-UX-24 | Confirm historical header policy: original logo/tagline snapshot or latest profile. | CH-2 recommends original snapshot; PO/PM decision required. |
| PO-UX-25 | Confirm owner editability and missing/legacy behavior of shop type. | Field exists; owner-facing policy pending. |

## 13. Testable UX acceptance criteria

The following criteria are intended for a future authorized UX/QA review. They are not evidence that implementation or testing has occurred.

### Owner registration/profile
- **UX-01:** A new owner can reach the shop profile form before creating a bill.
- **UX-02:** Shop name, address, mobile and Google Maps location are visibly labelled and mapped to the invoice header.
- **UX-03:** Missing required profile fields produce adjacent actionable errors and preserve other entered values.
- **UX-04:** A failed profile save does not clear the form; retry is available.
- **UX-05:** Editing shop profile does not visually imply that previously issued bills have changed.

### Food menu
- **UX-06:** Owner can open a menu-only screen without seeing stock quantity, purchase price or stock adjustment controls.
- **UX-07:** Owner can view/use only fields approved by PO-06; create/edit actions remain gated until approval.
- **UX-08:** Active/inactive states, tabs and filters are not exposed unless PO-06 explicitly approves them.
- **UX-09:** Deactivate/reactivate/delete/archive/restore controls remain absent/disabled until PO-06 approves each operation and its effect on invoice selection/history.
- **UX-10:** Empty catalogue/search states are accurate; lifecycle-specific states appear only if PO-06 approves them.
- **UX-11:** If a PO-approved menu write fails, entered values are preserved and retry is available.

### Invoice composer and issue
- **UX-12:** Owner can create a bill using only catalogue entries eligible under PO-06 and see item name, quantity, price and running total.
- **UX-13:** The review screen exposes every line and the total before issue.
- **UX-14:** No unapproved discount, tax, paid, due, customer or inventory fields appear.
- **UX-15:** Double-tapping issue does not create multiple bills.
- **UX-16:** A timeout/unknown result enters a status-check state and does not blindly create a new request.
- **UX-17:** After successful issue, the UI displays the persisted bill number/date/time and the same bill can be reopened without issuing again.
- **UX-18:** Menu/profile edits after issue do not change the rendered historical invoice.

### Invoice document / print
- **UX-19:** The invoice contains every PO-confirmed field in the mapping table in Section 5.3.
- **UX-20:** Heading is exactly “খাবারের বিল”; footer is exactly “ধন্যবাদ, আবার আসবেন!”.
- **UX-21:** Standard bill layout is one page at the PO-approved paper size.
- **UX-22:** Long item names and long invoices are never truncated or clipped; overflow paginates with required context.
- **UX-23:** The invoice QR is bill-specific and opens the corresponding bill URL.
- **UX-24:** Preview and print/PDF show identical persisted bill data.
- **UX-25:** If fonts or QR are not ready, print is not silently presented as complete; the owner receives a retry/failure state.

### Sharing
- **UX-26:** WhatsApp share contains the correct persisted bill number, date/time, total and bill-specific URL.
- **UX-27:** WhatsApp failure/cancellation leaves the invoice unchanged and offers copy/native-share/print fallback.
- **UX-28:** Bill creation and share do not require a customer record or phone number.

### Customer bill page
- **UX-29:** A valid issued bill link opens without customer login and shows only the approved allow-list.
- **UX-30:** A shop QR or shop URL cannot be mistaken for the bill-specific QR.
- **UX-31:** Valid, invalid, revoked, unavailable, integrity-failure and offline states have distinct text labels and safe actions.
- **UX-32:** Bill details are not shown as verified before the server verification response succeeds.
- **UX-33:** Verification wording does not imply payment or delivery confirmation.
- **UX-34:** Public bill view does not expose customer data, ledger, stock, other bills or owner account details.

### Mobile and accessibility
- **UX-35:** Core owner flows work at 320 CSS px width without horizontal page scrolling.
- **UX-36:** Primary controls have touch targets approximately 44 × 44 CSS px where practical.
- **UX-37:** Inputs have persistent labels, appropriate mobile keyboards and associated validation messages.
- **UX-38:** Status is not conveyed by color alone; Bangla text remains readable under browser zoom/text scaling.
- **UX-39:** Loading, empty, failure and retry states are present for every network-dependent screen listed in Section 8.3.

### New Logo and Tagline acceptance criteria

Classification: **PM-DIRECTED** = explicit PM assignment; **PROPOSED** = CH-2 recommendation; **PO-GATED** = requires PO/PM decision; **TECH-GATED** = requires CH-3 design evidence.

| ID | Testable criterion | Journey | Technical trace | Classification |
|---|---|---|---|---|
| **UX-40** | No uploaded logo and no explicit Blank choice resolves to Generated by default. | O-01 / invoice header | Logo mode resolution | PM-DIRECTED; TECH-GATED |
| **UX-41** | Generated logo uses current shop name and shop type; Regenerate updates preview after either changes. | O-01 | shops.shop_name/shop_type | PM-DIRECTED; TECH-GATED |
| **UX-42** | Owner previews generated logo before invoice use. | O-01 | Generated preview | PM-DIRECTED |
| **UX-43** | Uploaded logo takes priority over Generated. | O-01 / preview | Existing shops.logo_url; upload state | PM-DIRECTED; TECH-GATED |
| **UX-44** | Owner replaces uploaded logo; old logo remains selected until replacement succeeds. | O-01 | Upload lifecycle | PM-DIRECTED; TECH-GATED |
| **UX-45** | Owner removes uploaded logo and explicitly chooses Generated or Blank. | O-01 | Tri-state mode | PM-DIRECTED; TECH-GATED |
| **UX-46** | Blank shows no logo, mark, icon or placeholder in preview/customer/PDF/print. | O-01 / invoice | Blank override | PM-DIRECTED |
| **UX-47** | Owner switches Blank back to Generated and previews current name/type mark. | O-01 | Mode transition | PM-DIRECTED |
| **UX-48** | Regenerate refreshes Generated without overwriting Uploaded. | O-01 | Separate mode/asset | PM-DIRECTED; TECH-GATED |
| **UX-49** | Shop-type choices use only an accepted taxonomy; no new/renamed values without approval. | O-01 | Existing legacy shop_type constraint | PO-GATED; TECH-GATED |
| **UX-50** | Generated logo uses selected shop type; missing type prompts from accepted choices. | O-01 | shop_type + taxonomy | PM-DIRECTED; PO-GATED |
| **UX-51** | Unsupported image format is rejected without replacing current logo. | O-01 | Format validation | PM-DIRECTED; TECH-GATED |
| **UX-52** | File above approved size/dimension limit is rejected without replacing current logo. | O-01 | Approved upload limits | PM-DIRECTED; TECH-GATED |
| **UX-53** | Upload failure/timeout preserves old logo and tagline; retry is available. | O-01 | Upload recovery | PM-DIRECTED; TECH-GATED |
| **UX-54** | Tagline accepts owner-entered Bangla, English and mixed script without generation or rewriting. | O-01B | Unicode persistence/font | PM-DIRECTED |
| **UX-55** | Blank tagline is valid and renders no text or placeholder separator. | O-01B / invoice | Conditional rendering | PM-DIRECTED |
| **UX-56** | Owner edits/clears tagline independently of logo operations. | O-01B | Separate state | PM-DIRECTED; TECH-GATED |
| **UX-57** | Proposed 80 grapheme-cluster limit applies only after PO/PM approval; otherwise labelled proposed. | O-01B | Grapheme-aware validation | PROPOSED; PO-GATED; TECH-GATED |
| **UX-58** | Bangla/English/mixed tagline renders without clipping in mobile preview, customer page, PDF and print. | O-01B / invoice | Local font/renderer | PM-DIRECTED; TECH-GATED |
| **UX-59** | Logo changes never modify tagline; tagline changes never modify logo mode/asset. | O-01 | Independent state | PM-DIRECTED |
| **UX-60** | Owner previews full header with shop identity, resolved logo and optional tagline before issue. | O-01 / review | Shared header renderer | PM-DIRECTED |
| **UX-61** | Same issued invoice renders identical logo mode/tagline in preview/customer/PDF/print. | Issue/customer/print | Immutable header projection | PROPOSED; TECH-GATED; history decision |
| **UX-62** | Later profile edits follow approved historical header policy and never silently mutate issued output. | O-05 / profile | Immutable header/asset snapshot | PO-GATED; TECH-GATED |
| **UX-63** | Logo preserves aspect ratio; Blank reflows identity block without empty gap. | Mobile/print | Responsive image sizing | PROPOSED; TECH-GATED |
| **UX-64** | Corrupt/missing asset yields warning/retry; Blank never falls back to placeholder/generated mark. | O-01 / print | Asset readiness | PM-DIRECTED; TECH-GATED |

### Requirement-to-acceptance-criteria crosswalk

| Requirement | Specification | Criteria | Technical trace | Classification |
|---|---|---|---|---|
| Confirmed shop profile | §4.1 | UX-01–UX-05 | Existing profile fields | PO-APPROVED |
| Menu-only/no inventory controls | §4.2 | UX-06 | item_catalog separate from stock UI | PO-APPROVED scope exclusion |
| Menu fields/lifecycle | §4.2 | UX-07–UX-11 | Issue #31 PO-06 PENDING | PO-GATED |
| Duplicate policy | §§4.2, 12 | UX-07–UX-10 | Issue #31 PO-07 PENDING | PO-GATED |
| Composer/issue | §§4.3–4.4 | UX-12–UX-18 | PR #28 proposal | PROPOSED / technical review |
| PO-confirmed invoice content | §5 | UX-19–UX-25 | PO mockup blob efe0d261... | PO-APPROVED |
| Sharing | §6 | UX-26–UX-28 | Issue #31 PO-13 message copy pending | PROPOSED / PO-GATED copy |
| Customer verification | §7 | UX-29–UX-34 | Issue #31 PO-11/12 PENDING | PO-GATED + TECH-GATED |
| Mobile/accessibility/states | §§8–9 | UX-35–UX-39 | UX screen/state spec | PROPOSED |
| Logo modes/precedence | §§4.1 O-01A, 5 | UX-40, UX-42–UX-48, UX-59–UX-64 | Existing logo_url; tri-state mode | PM-DIRECTED + TECH-GATED |
| Shop-type generation | §4.1 O-01A | UX-41, UX-49–UX-50 | Existing shop_type legacy values | PM-DIRECTED; taxonomy PO-GATED |
| Upload/replace/remove | §4.1 O-01A | UX-43–UX-45, UX-51–UX-53 | logo_url; storage policy open | PM-DIRECTED + TECH-GATED |
| Optional tagline | §4.1 O-01B | UX-54–UX-59 | No tagline field found in inspected schema | PM-DIRECTED + TECH-GATED |
| Proposed 80-character limit | §4.1 O-01B | UX-57 | Grapheme-aware validation | PROPOSED; PO/PM-GATED |
| Preview/print consistency | §§4.1, 5 | UX-60–UX-64 | Shared renderer/header snapshot | PROPOSED + TECH-GATED |
| Historical header | §4.1 O-01B | UX-61–UX-62 | Logo/tagline snapshot | PO/PM-GATED + TECH-GATED |

All UX-01–UX-39 IDs are preserved. New criteria are UX-40–UX-64; no ID is reused or renumbered.

## 14. Evidence and verification boundary

**Verified by static GitHub source review for this revision:**
- PR #30 head, unresolved inline P2 thread and exact finding were re-read before editing.
- Issue #31 decision request and response-request comment were reviewed; PO-06 and PO-07 remain PENDING.
- Pinned schema confirms shop_type and logo_url; no tagline field was found in inspected schema/dashboard source.
- Exact source commit SHA and the three required source document blob SHAs are recorded above.
- Issue #25 task and its review comment were read.
- PR #28 metadata and technical design document at its specified HEAD were read.
- PO-confirmed invoice mockup was read from the exact pinned baseline.
- The authority register was read; its explicit menu-policy baseline gap was preserved.

**Not performed:**
- No application source changes.
- No database/schema/migration changes or SQL.
- No dependency installation, build, lint or automated test.
- No browser runtime or manual QA.
- No PDF/font rendering test.
- No deployment, merge or pilot activity.
- No live Supabase/RLS/RPC state verification.

All acceptance criteria above are proposed future test cases, not test results.

## 15. CH-1 review request and authorization boundary

**Requested CH-1 disposition:**
1. Review and accept/revise this owner/customer UX specification.
2. Resolve or assign the PO decisions in Section 12.
3. Confirm the CH-2 disposition of PR #28 as **ACCEPT WITH CONDITIONS** or provide contrary direction.
4. Keep implementation, database/schema, builds, QA execution, deployment and pilot as separate authorization gates.

**CH-2 recommendation:** accept this revised document as a design-review candidate. P2 menu finding is addressed by removing unsupported lifecycle requirements and making PO-06/PO-07 PO-GATED. Logo/tagline UX is specified from PM direction; taxonomy, upload constraints, persistence and historical-header behavior remain gated. Do not treat this PR or the UX disposition as permission to start implementation.

**Implementation authorization: NOT GRANTED.**  
**QA execution authorization: NOT GRANTED.**  
**Merge authorization: NOT GRANTED.**  
**Deployment / pilot: NOT AUTHORIZED.**

---

**Revision 0.2 submitted by:** CH-2 — Product & UX Lead  
**Submitted to:** CH-1 — Project Lead & Chief Reviewer


---

# Controlled Addendum v0.3 — Final UX Assurance Remediation

**Frozen review basis**
- PR #30: HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`; UX blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`.
- PR #33: HEAD `898c834c30ec84599a6fa7c333d3da18ca235c30`; technical blob `9a1753d3bcba680961b39b91e320d1f59d70cd14`.
- PO mockup blob `efe0d261c50a4cfc706e82c832a6f052c676127c`, baseline `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`.
- CH-4 manifest `DT-MVP-CH4-FROZEN-2026-11-10-01`, Issue #27 comment `6766702882`.
- PO register: Issue #31. No PO-authored approval was found in the retrieved history; CH-1 proposals remain proposals.

This addendum controls where it clarifies or supersedes v0.2 wording. It preserves v0.1/v0.2 history, does not alter PO-confirmed invoice fields, and grants no implementation or QA authorization.

## 15.1 CH-4 UX finding disposition

| Finding | Severity | Frozen evidence | v0.3 disposition | Status |
|---|---|---|---|---|
| CH4-UX-01 Generated-logo preview confirmation | MAJOR | O-01A/UX-40..50 made Generated default and preview, but did not require separate confirmation. | CH-1's later instruction in PR #30 comment `6766054872` explicitly says Generated remains default and preview is informational, not an opt-in gate. v0.3 makes this explicit; a confirmation gate would contradict the later decision. | **REJECTED AS DEFECT / SUPERSEDED** |
| CH4-UX-02 Adversarial upload matrix | MAJOR | O-01A/UX-51..53 lacked MIME/extension mismatch, SVG/active content, polyglot, animated, zero-byte, decoded-pixel and decompression cases. | §15.3 and UX-67 specify negative cases, recoverable outcomes and traceability to PR #33 §§D.1–D.3, LG-07/LG-13. Numeric limits remain proposals. | **FIXED AT UX LEVEL; TECH/PO GATES REMAIN** |
| CH4-UX-03 Logo precedence | MINOR | Uploaded priority and Blank suppression were stated separately without one deterministic resolver. | §15.2 establishes one resolver: Explicit BLANK > Valid UPLOADED > GENERATED default; selected but missing/corrupt Uploaded never silently falls back. | **FIXED** |
| CH4-UX-04 Tagline Unicode/control/XSS | MAJOR | O-01B/UX-54..58 did not define markup, NFC, grapheme, bidi/control or line-break behavior. | §15.4 defines plain text, contextual escaping, NFC proposal, proposed 80-grapheme gate, validation and recovery; mapped to PR #33 §E/TG-01..06. | **FIXED AT UX LEVEL; POLICY GATED** |
| CH4-UX-05 Historical header | MAJOR | UX-61/62 left snapshot/latest-profile choice PO-gated; PR #33 §F proposes snapshots, but PO-L02/retention remain pending. | §15.5 preserves snapshot-at-issue as recommendation only; no customer promise until PO-L02 and retention decisions. | **PO-GATED; NOT PRODUCT-CLOSED** |
| CH4-UX-06 Shop-type exceptional state | MINOR | Schema note says shop_type NOT NULL, while “missing type” wording did not distinguish unsupported legacy value from missing DB value. | §15.2 clarifies DB-null is not assumed; legacy values are not approved taxonomy or proof of explicit owner selection. | **FIXED** |
| Tagline/logo independence | Observation | UX-53/56/59 stated independence but lacked paired transition tests. | §15.4 adds logo-only/tagline-only and failed-update preservation tests. | **FIXED** |

The CH-4 register was preliminary/staging evidence; v0.3 is CH-2 remediation, not a signed CH-4 final acceptance.

## 15.2 Logo resolver and explicit category selection

### Deterministic resolver

Apply this order in every screen, preview, customer page, PDF and print renderer:

1. **Explicit BLANK** — no logo, mark, icon, generated asset or placeholder.
2. **Valid UPLOADED** — selected, owner-authorized, validated immutable raster asset.
3. **GENERATED default** — when no valid upload is selected and owner has not explicitly selected BLANK.

Do not infer mode from `logo_url IS NULL`. A selected UPLOADED asset that is missing, corrupt, unreadable or digest-invalid remains an UPLOADED error; it never silently falls through to Generated. Owner recovery: retry retrieval, replace upload, or explicitly choose Generated/Blank. BLANK always wins even if an upload exists.

Generated is the default without separate opt-in. UX-42 preview is informational, not a confirmation gate. Generation failure shows an actionable error/retry; it must not silently become BLANK or a placeholder.

### Category must be explicitly selected

- The pinned schema has non-null `shops.shop_type` with legacy controlled values. This proves the field/legacy values exist in that source snapshot; it does not prove they are the approved Invoice-First taxonomy or that a legacy value is an explicit owner selection for logo generation.
- Never infer category from shop name, tagline, address, menu or invoice activity. Never silently default to `food` or another category.
- PO-L01 is pending. Recommendation: a short PO-approved controlled list, explicitly selected by the owner. Free-text and automatic inference are not recommended.
- A category is selected only when the owner actively chooses a value from the PO-approved list and that selection is persisted. Unsupported legacy values are not valid selections; do not relabel or expose them as the new list.
- If no approved category is selected, Generated mode remains the default mode but its category-dependent asset is unresolved. Show “লোগো তৈরি করতে দোকানের ধরন নির্বাচন করুন”; do not emit a category-specific mark.
- While PO-L01 is deferred, category-dependent Generated output is unavailable. Owner may upload a valid logo or explicitly choose BLANK. If Generated remains selected, show the unresolved state. A category-neutral wordmark is allowed only after explicit CH-1/PM approval; it is not silently substituted.
- A missing DB value is not assumed because the pinned schema declares shop_type NOT NULL. The UX state is “no owner-confirmed approved category” or “unsupported legacy category”, not a presumed nullable DB field.

### Upload error/recovery contract

The selected logo remains active until replacement is fully validated and durably saved. Failure preserves old mode/asset and tagline. Untrusted original bytes are never rendered.

| Negative case | Required outcome | Owner recovery |
|---|---|---|
| File extension/MIME disagrees with signature | Reject; explain format mismatch; retain current selection | Choose a genuine supported image |
| Unknown/unsupported format | Reject; do not preview or replace | Select approved raster |
| SVG/XML, HTML, PDF, archive or active/document content | Reject; never execute/render | Select supported raster |
| Zero-byte, truncated, corrupt, malformed, polyglot or animated file | Reject after trusted decode; preserve old logo | Choose valid static image |
| Compressed-byte limit exceeded | Reject before full processing | Resize/re-export and retry |
| Decoded width/height/pixel/decompression limit exceeded | Controlled rejection; preserve old logo | Use smaller image |
| Timeout, storage failure or profile commit failure | Old mode/asset/tagline remain active; no false success | Retry/status-check or choose another image |
| Missing/corrupt asset during preview/PDF/print | Integrity/unavailable state; no fallback substitution | Retry, replace or explicitly change mode |
| Owner cancels file picker | No state change and no false error | Continue with current selection |

PR #33 §D proposes JPEG/PNG; WebP only if verified end-to-end; reject SVG/animated formats; 2 MiB compressed, 2048×2048 dimensions and 4,194,304 decoded pixels. These are technical proposals for review, not PO-approved or implemented limits. UI must not claim enforcement until CH-1/PM/CH-3 adopt exact values.

## 15.3 Tagline text safety and Unicode

- Optional, blank-valid, owner-authored only. No auto-generation, suggestion, translation, paraphrase or replacement.
- Treat as plain text, never HTML/Markdown. Escape in every output context (web, SVG, PDF/HTML template). Literal text such as `<img src=x onerror=alert(1)>` must render as text and never execute, create markup, alter CSS or create a link.
- NFC normalization is a proposed technical contract. Do not transliterate, case-fold, title-case or silently rewrite visible text. Empty/whitespace-only input may normalize to blank/NULL only under the adopted contract.
- Proposed maximum: **80 Unicode grapheme clusters after NFC**, not bytes, UTF-16 code units or code points. It is not an active hard limit until PO-L04/PM approves it. If approved, use grapheme-aware count, show a counter and reject over-limit without truncation while preserving attempted text. If deferred, do not impose 80 as a hidden limit.
- Recommended control policy for CH-1/CH-3 review: single-line field; reject CR/LF, NUL and non-printing controls, and reject bidi override/isolate controls unless a safe policy is approved. Show an actionable error and preserve attempted text; never silently strip/reorder. This is a recommendation, not a PO decision.
- Bangla, English and mixed script must wrap without clipping in owner preview and approved customer/PDF/print surfaces. Bengali conjuncts, reph, kar/phalā and combining marks must not split or clip. Emoji/other scripts are not promised until the pinned font/fallback stack is verified; unsupported glyphs must not be silently dropped.
- Failed tagline save preserves prior saved tagline and logo mode/asset. Tagline-only save cannot change logo; logo-only save cannot change tagline.

## 15.4 Full UX-01–UX-64 actor/state/outcome assurance matrix

Each row is a proposed static acceptance case, not an executed test. Actor, trigger, state/outcome and recovery are explicit.

| Test / criterion | Actor + action | State / required outcome and recovery |
|---|---|---|
| UXAT-01 / UX-01 | Owner opens first-time setup | No profile → required form; save failure preserves fields and allows retry |
| UXAT-02 / UX-02 | Owner enters name/address/mobile/Maps | Labels and invoice mapping visible; invalid field identified |
| UXAT-03 / UX-03 | Owner submits incomplete profile | Block save; field-level error; retain valid inputs; correct and resubmit |
| UXAT-04 / UX-04 | Owner saves during network failure | No false success; retain form; retry/status-check before duplicate create |
| UXAT-05 / UX-05 | Owner edits profile after bill issue | State that old-bill effect follows PO-L02; no unsupported history promise |
| UXAT-06 / UX-06 | Owner opens menu | Menu-only UI; no stock/purchase/supplier/inventory controls |
| UXAT-07 / UX-07 | Owner views menu while PO-06 pending/approved | Pending: neutral gated state; approved: only approved fields/actions |
| UXAT-08 / UX-08 | Owner opens menu list | No active/inactive tabs, filters or labels unless PO-06 approves |
| UXAT-09 / UX-09 | Owner inspects lifecycle actions | Pending: no deactivate/reactivate/delete/archive/restore controls |
| UXAT-10 / UX-10 | Owner views empty/search menu | Accurate no-item/no-result state; clear search; no invented lifecycle state |
| UXAT-11 / UX-11 | Owner saves menu entry; network fails | Preserve values; check outcome before retry; no duplicate menu record |
| UXAT-12 / UX-12 | Owner adds eligible item | One valid line; eligibility only from PO-06; no unresolved/ineligible item |
| UXAT-13 / UX-13 | Owner reviews draft | Every line/total visible; edit returns without losing draft |
| UXAT-14 / UX-14 | Owner reviews invoice fields | No discount/tax/paid/due/change/payment/customer/inventory fields |
| UXAT-15 / UX-15 | Owner double-taps or submits same draft in two tabs | Same request identity/payload yields one invoice/number; repeat action returns canonical result |
| UXAT-16 / UX-16 | Owner loses network after submit | Unknown state; query same request; retry exact same identity/payload only |
| UXAT-17 / UX-17 | Owner opens successful result/history | Persisted bill number/date/time; re-open returns same invoice, no new issue |
| UXAT-18 / UX-18 | Owner edits menu/profile after issue | Invoice uses persisted snapshots; header behavior remains PO-L02 gated |
| UXAT-19 / UX-19 | Owner/customer views invoice | Every PO-confirmed field present; no invented fields |
| UXAT-20 / UX-20 | Owner/customer views any invoice rendering | Exact heading/footer present as text |
| UXAT-21 / UX-21 | Owner generates PDF/print | Engineering/PO-approved profile used; no unsupported paper-size promise |
| UXAT-22 / UX-22 | Owner prints long bill | All lines preserved; paginate; no clipping/truncation |
| UXAT-23 / UX-23 | Customer scans bill QR | Bill-specific QR resolves only to its own bill reference |
| UXAT-24 / UX-24 | Owner compares preview/PDF/print | Persisted invoice values match; logo/tagline parity conditional on PO-L02 |
| UXAT-25 / UX-25 | Font/QR/print fails | No false print/download success; retry and Copy link fallback |
| UXAT-26 / UX-26 | Owner opens WhatsApp share | Message uses persisted bill values and exact bill URL only |
| UXAT-27 / UX-27 | Owner cancels/fails share | Bill unchanged; Copy message/link, native share and print remain |
| UXAT-28 / UX-28 | Owner shares bill without customer record | Share works without customer name/phone/account |
| UXAT-29 / UX-29 | Customer opens valid public link | No login; allow-listed DTO only after server verification |
| UXAT-30 / UX-30 | Customer scans shop promo QR | Not represented as bill verification; no invoice data |
| UXAT-31 / UX-31 | Customer opens invalid/revoked/expired-if-enabled/offline link | Distinct truthful state; no verified details; transient retry or contact shop/sender |
| UXAT-32 / UX-32 | Customer opens link while check pending | No bill content shown as verified before server success |
| UXAT-33 / UX-33 | Customer reads positive status | “বিলটি DokanTools রেকর্ডে যাচাইকৃত” means record match only; never payment/delivery |
| UXAT-34 / UX-34 | Customer inspects public page | No PII, ledger, stock, other bills, credentials or internal IDs |
| UXAT-35 / UX-35 | Owner uses 320 CSS px viewport | No horizontal scroll; sticky action does not cover last line |
| UXAT-36 / UX-36 | Owner taps primary controls | ~44×44 CSS px where practical; no hover-only critical action |
| UXAT-37 / UX-37 | Owner enters form values | Persistent labels, correct keyboard, associated errors, logical focus |
| UXAT-38 / UX-38 | Owner/customer zooms text | Status not color-only; Bangla readable, no clipped controls |
| UXAT-39 / UX-39 | Owner encounters network-dependent screen | Explicit loading/empty/failure/offline state; preserve safe work; retry/status check |
| UXAT-40 / UX-40 | Owner has no valid upload and no explicit Blank | Generated resolves by default; no opt-in required |
| UXAT-41 / UX-41 | Owner changes name/explicit category in Generated mode | Preview refreshes from saved inputs; history follows PO-L02 only |
| UXAT-42 / UX-42 | Owner inspects Generated preview | Informational preview; not a mandatory confirmation gate |
| UXAT-43 / UX-43 | Owner uploads valid logo | Valid Uploaded wins; old selection remains until replacement commit |
| UXAT-44 / UX-44 | Owner replaces upload | Old asset remains active until new asset validates and saves |
| UXAT-45 / UX-45 | Owner removes upload | Must explicitly choose Generated or BLANK |
| UXAT-46 / UX-46 | Owner selects BLANK | All renderers omit logo/placeholder; Blank overrides stored upload |
| UXAT-47 / UX-47 | Owner switches BLANK to Generated | Explicit action; category must be explicitly selected/approved or show unresolved state |
| UXAT-48 / UX-48 | Owner regenerates logo | Generated version updates future profile output; never overwrites Uploaded |
| UXAT-49 / UX-49 | Owner opens category selector | Pending: no invented options; approved: only PO-approved choices |
| UXAT-50 / UX-50 | Owner has no explicitly selected approved category | No inference; Generated unresolved; owner may upload or explicitly choose Blank |
| UXAT-51 / UX-51 | Owner selects unsupported file | Reject safely; old logo retained; valid raster can be selected |
| UXAT-52 / UX-52 | Owner selects over-limit file | Reject before replacement; show adopted limit; resize/re-export/retry |
| UXAT-53 / UX-53 | Upload times out/profile commit fails | Preserve prior mode/asset and tagline; status-check/retry |
| UXAT-54 / UX-54 | Owner enters Bangla/English/mixed tagline | Owner text only; no generation, translation or rewriting |
| UXAT-55 / UX-55 | Owner clears tagline | Blank valid; no placeholder/separator/empty line |
| UXAT-56 / UX-56 | Owner edits tagline only | Tagline changes; logo mode and asset identity unchanged |
| UXAT-57 / UX-57 | Owner enters text around proposed limit | Pending: no 80 hard limit; approved: NFC grapheme count, reject over-limit without truncation |
| UXAT-58 / UX-58 | Owner/customer views mixed-script tagline | No clipping; font failure blocks success and offers retry; no silent glyph deletion |
| UXAT-59 / UX-59 | Owner changes logo only, then tagline only | Each operation preserves the other field's value/asset identity |
| UXAT-60 / UX-60 | Owner previews header before issue | Current profile header visible; no historical promise before PO-L02 |
| UXAT-61 / UX-61 | Owner/customer reopens issued invoice | Same immutable header projection only after PO-L02 approval |
| UXAT-62 / UX-62 | Owner edits logo/tagline after issue | Pending: no historical promise; approved policy applied consistently, never mixed silently |
| UXAT-63 / UX-63 | Owner views logo in mobile/PDF | Aspect ratio preserved; no crop/stretch; Blank reflows without placeholder gap |
| UXAT-64 / UX-64 | Renderer cannot load selected asset | Error/retry/replace/explicit mode change; no silent fallback |
 
## 15.5 Additional assurance criteria

| Criterion | Actor/action | State/outcome | Recovery/gate | Test |
|---|---|---|---|---|
| **UX-65 Empty bill** | Owner attempts review/issue with zero lines or removes last line | Review/issue disabled; no zero-line invoice; empty-state shown | Add a PO-eligible line | UXAT-65 |
| **UX-66 Stale menu price/eligibility** | Owner composes while menu price/eligibility changes before issue | Authoritative check detects revision/price mismatch; issue blocked; draft preserved; no silent price substitution | Owner refreshes and explicitly reviews changed price/eligibility or removes line; exact price policy remains PO-06/technical-gated | UXAT-66; AT-MENU-05 + invoice validation |
| **UX-67 Adversarial upload** | Owner uploads MIME/extension mismatch, SVG/XML, HTML/PDF, unknown, zero-byte, truncated, corrupt, polyglot, animated or decompression-bomb file | Trusted validation rejects; current logo/tagline preserved; untrusted bytes never rendered | Choose valid supported raster; exact limits/formats PO-L03/CH-3 gated | UXAT-67; LG-07/LG-13 |
| **UX-68 Tagline safe text/Unicode** | Owner enters markup-like, NFC/NFD, combining, control/bidi or line-break text | Literal safe rendering; deterministic normalization/control handling; no silent rewrite; 80 limit only if approved | Owner corrects invalid input; previous saved value preserved; PO-L04/CH-3 gated | UXAT-68; TG-01..05 |
| **UX-69 Explicit category** | Owner enters shop name without approved category selection | No inference; Generated unresolved; no category-specific mark | Explicitly select approved category, upload, or explicitly choose BLANK; neutral wordmark requires separate approval | UXAT-69; LG-10/LG-11 |
| **UX-70 QR expiry/revocation** | Customer opens expired/revoked link, if policy enables that state | No details labelled verified; expiry/revoked state distinct; no invented duration | Contact shop/sender; replacement only if PO-12 permits; PO-11/12 gated | UXAT-70; AT-TOK-01..14/AT-PUB-05 |
| **UX-71 Historical header/asset retention** | Owner changes/removes logo/tagline after issue | No historical promise until PO-L02/HDR-RET-01; after approval follow one policy and retain referenced assets | If deferred, no claim of historical public/PDF/print consistency; current-profile internal preview only | UXAT-71; HDR-01..06 |

### Customer verification wording

The only positive claim permitted here is **“বিলটি DokanTools রেকর্ডে যাচাইকৃত”**: the server matched the reference to an issued DokanTools record. It does not prove payment, delivery, receipt, fulfilment, food quality, tax compliance or legal certification. Do not show paid/delivered status in this MVP.

Invalid, unavailable, integrity-failed, offline, expired (if expiry is approved) and revoked links are not verified. Revoked disclosure follows PO-11; expiry/replacement follows PO-12. Do not show bill details for invalid/expired/revoked links unless the exact PO-approved revoked disclosure allows specified fields.

## 15.6 Pending PO decision matrix

Recommendations below are CH-2 proposals, not approvals. “Deferred” means the conservative behavior remains and the affected capability is not represented as complete.

| Decision | Exact question | Recommendation | If approved | If deferred | Capability |
|---|---|---|---|---|---|
| **PO-02** | Is Phase 1 online-only for issuance and customer verification, with IndexedDB only for unknown-outcome recovery? | Approve online-only | Issue/verify only with live server confirmation; offline draft is not a bill | Fail closed offline; no offline-sale/verification claim | Issue and public verification |
| **PO-04** | What does customer-facing “মূল্য” mean? | Four columns: item, quantity, একক মূল্য, মোট মূল্য; total sums line amounts | Show unit and extended amount distinctly on review/invoice/PDF/public DTO | Do not freeze customer price table; retain values provisionally | Final invoice/PDF/public price presentation |
| **PO-05** | Quantity range, units, fractional values and repeated-item behavior? | Positive whole number 1–999; no unit label/conversion; repeated items remain separate | Enforce whole-number range and separate lines | No fractional/unit-aware promise; quantity contract remains provisional | Composer validation |
| **PO-06** | Minimum menu fields, lifecycle actions/defaults and invoice eligibility? | Name + selling price only; no permanent delete; any deactivate/reactivate only if explicitly approved | Expose exactly approved fields/actions; issued lines remain snapshots | Neutral menu shell; no assumed lifecycle/filter/default/eligibility | Menu and menu-driven billing |
| **PO-07** | Are same-shop duplicate names prohibited; what NFC/whitespace/case/punctuation and reactivation rules apply? | If prevention approved: NFC, trim, collapse internal whitespace, Latin case-fold, punctuation significant | Enforce exact approved comparator and show conflict | No hard uniqueness or silent normalization; manual warning only if authorized | Menu validation/integrity |
| **PO-11** | May owner revoke; required reason; reversibility; customer disclosure? | Immutable issue; revoke with reason, irreversible; correction is new invoice; revoked page shows bill number/status only | Show controlled revoke flow and approved public projection | No revoke/restore controls or public bill release; internal issue separate | Invoice lifecycle/public revoked state |
| **PO-12** | Do bill links expire or remain until revoked; what duration/replacement policy? | Prefer finite PO-selected duration; do not invent 365 days or any other duration | Apply exact approved expiry; expired link exposes no bill data | No active public verification/QR release or expiry promise | Bill QR/link/customer verification |
| **PO-I11** | What does customer “verified” mean; is the proposed Bangla wording acceptable? | Approve record-match-only phrase; disclaim payment/delivery/quality/legal certification | Show approved wording only after successful server match | Neutral information/unavailable state; no positive verification claim | Customer trust wording |
| **PO-I06A** | How long retain signing keys; what happens on key compromise? | Retain keys for unexpired links; compromise triggers affected-link revoke/reissue and rotation | Verify by key version and approved expiry; controlled recovery | No public signed-link release | Signed links/key lifecycle |
| **PO-L01** | Which categories may owners select for logo generation; may category be inferred? | Controlled PO-approved list, explicit owner selection; no inference/free text | Show only approved list; persist selection; Generated uses selected category | No category-specific Generated asset; allow valid upload or explicit BLANK; no invented neutral fallback | Generated logo/shop profile |
| **PO-L02** | Preserve logo/tagline at issue or use current profile for old bills? | Snapshot mode, immutable asset/version/digest and tagline at issue | All reprints/PDF/public views use the same immutable header and retained assets | No historical header promise; internal current-profile preview only | Historical invoice rendering |
| **PO-L03** | Which raster formats, byte/pixel limits and ownership declaration? | JPEG/PNG initially; reject SVG/active content; CH-3 proposed 2 MiB, 2048×2048, 4,194,304 pixels as review values; owner confirms usage rights | Enforce exact approved list/limits using safe server decode/re-encode | Disable upload; Generated/Blank only as separately approved | Upload/security/storage |
| **PO-L04** | Is tagline owner-entered only; what length/control/content policy? | Owner-authored Bangla/English/mixed; blank valid; 80 NFC grapheme clusters proposed; no generation | Enforce approved grapheme/control policy and safe literal rendering | Keep tagline out of customer-facing release; no default slogan or hidden 80 limit | Tagline profile/header |
| **HDR-RET-01** | How long retain logo/generated assets referenced by issued invoices, including shop deletion/legal retention? | Retain immutable assets while any invoice snapshot references them, subject to approved legal retention | Garbage collection checks references and retention; integrity failure explicit | No historical reproducibility promise; do not delete referenced assets | Historical rendering/storage |
| **HDR-PUBLIC-01** | Should logo/tagline appear on public bill page and how does this interact with revoked/expired disclosure? | Show only issue-time header snapshot on valid link; revoked/expired follows PO-11/12 | Public DTO includes only approved snapshot fields after verification | Omit logo/tagline from public projection until approved | Customer bill page/privacy |

All listed decisions remain **PENDING** unless explicitly recorded by PO/PM in the controlled register. PR #33 technical proposals, schema fields, CH-1 recommendations or silence are not approvals. PO-01/03/13/14/15 are not reopened here where CH-1 has already classified the remaining choice as engineering-owned or optional copy; PO-08/09/10 remain excluded/deferred as recorded.

## 15.7 PR #30 menu-lifecycle P2 reassessment

**Finding:** review comment #4523203685, thread `PRRT_kwDOVhBFWs61okrS`, “Keep unpinned menu lifecycle rules provisional”.

The original v0.1 concern was valid: lines 157–160 stated deactivation/deletion/reactivation behavior as requirements although the pinned authority register said PO-B01–PO-B07 were not established.

Revision 0.2 substantively addresses the concern:
- §4.2 says all catalogue actions come only from PO-06.
- §4.2 says `is_active` does not authorize owner-facing lifecycle, default filters or deletion policy.
- §4.2 withholds active/inactive tabs, filters, status labels and row actions while PO-06 is pending.
- §4.2 prohibits assuming new-item defaults, inactive-item eligibility, name reuse or reactivation uniqueness absent PO-06/PO-07.
- UX-07–UX-11 and the crosswalk classify menu fields/lifecycle/duplicates as PO-GATED.
- Issue #31 remains the decision register; no PO-06/PO-07 approval is inferred.

**Conclusion:** the substantive P2 concern is corrected in v0.2 and retained in v0.3. Recommend closure by the authorized reviewer because unsupported lifecycle behavior is no longer normative. This is not self-resolution: the thread remains outdated/unresolved until CH-1/authorized reviewer independently resolves it.

## 15.8 UX-to-technical-design traceability

| UX range | UX acceptance IDs | PR #33 technical trace | Outstanding gate |
|---|---|---|---|
| UX-01–05 | UXAT-01–05 | §9 profile validation; §F only if snapshot approved | PO-L02 |
| UX-06–11 | UXAT-06–11 | §12; AT-MENU-01..07 | PO-06/07 |
| UX-12–18 | UXAT-12–18, 65–66 | §§5–7; AT-FIN-01..09; AT-IDEM-01..18; AT-MENU-05 | PO-04/05/06 |
| UX-19–25 | UXAT-19–25 | §11; AT-PDF-01..08 | Font binary/hash, renderer digest and later runtime evidence |
| UX-26–28 | UXAT-26–28 | §13; AT-SHARE-01..04 | Public URL gates |
| UX-29–34 | UXAT-29–34, 70 | §§8–9; AT-TOK-01..14; AT-PUB-01..09 | PO-11/12/I11/I06A |
| UX-35–39 | UXAT-35–39 | §§3, 9–10; AT-UX-01..07; AT-OFF-01..04 | Online-only scope gate |
| UX-40–53 | UXAT-40–53, 67, 69 | Addendum §§B–D; LG-01..LG-17 | PO-L01/L03 |
| UX-54–59 | UXAT-54–59, 68 | Addendum §E; TG-01..TG-06 | PO-L04 |
| UX-60–64 | UXAT-60–64, 71 | Addendum §§F/H; HDR-01..HDR-06 | PO-L02/HDR-RET-01/HDR-PUBLIC-01 |
| UX-65–71 | UXAT-65–71 | §§5–9, 12 and addendum §§B–H | PO/technical gates above |

UX-01–UX-64 identifiers are preserved. UX-65–UX-71 are additive. UXAT/LG/TG/HDR/AT references are proposed acceptance tests only; no test was executed.

## 15.9 Authorization and status

- Same PR #30, same branch and same file path; document revision 0.3, not a parallel specification.
- PO-06/07, PO-L01..04, PO-11/12, PO-I11/PO-I06A and header-retention/public-display decisions remain pending.
- PR #33 is a frozen design input; its technical recommendations do not become PO approvals.
- No application code, schema, SQL, database, migration, configuration, dependency, build, test execution, browser/PDF QA, merge, deployment, release or pilot work was performed or authorized.
- Implementation authorization remains **NOT GRANTED**; QA execution remains **NOT AUTHORIZED**. PR #30 remains open/unmerged pending CH-1/CH-4 re-review.
