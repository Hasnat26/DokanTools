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
**Document version:** 0.1  
**Status:** SUBMITTED — CH-1 / PO REVIEW REQUIRED  
**UX disposition of PR #28:** **ACCEPT WITH CONDITIONS**  
**Implementation authorization:** NOT GRANTED

---

## 1. Purpose, authority and boundaries

This document defines the mobile-first owner journey and customer bill-view journey for the Invoice-First Web MVP. It translates the PO-confirmed invoice mockup into screen-level requirements, interaction states, field mapping and testable UX acceptance criteria. It also independently reviews PR #28 for UX implications.

The exact PO decision record confirms the Bangla invoice format and the individual bill QR purpose. It does not approve the unresolved technical or business policies listed in Section 12.

The project authority register at the pinned baseline records:
- The existing Next.js / React / Supabase web application as the repository baseline only.
- The PO-confirmed invoice mockup as approved for invoice layout scope only.
- PO-B01–PO-B07 (food-menu policy) as NOT ESTABLISHED AS GITHUB BASELINE.
- Implementation, schema/database operations, builds, QA execution, deployment and pilot as not authorized.

Accordingly:
1. PO-confirmed fields and exact Bangla wording below are binding.
2. Menu field rules, duplicate semantics, units, offline behavior, paper size, numbering and other unresolved policy are explicitly provisional or pending PO decision.
3. PR #28 is a submitted technical proposal, not an approved architecture or implementation baseline.
4. This document is design-only. It does not authorize code, database, schema, build, test, QA, deployment, merge or pilot work.

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
- **খাবারের মেনু** — active/inactive food items.
- **দোকানের তথ্য** — shop profile and location.

Use a compact top bar with shop identity and a persistent primary “নতুন বিল” action. On narrow screens, a bottom navigation bar may expose the four destinations. Do not add inventory, customer ledger, accounting, payment gateway, multi-branch or public-ordering destinations to this MVP navigation.

### 3.3 Complete owner journey

1. **Open / authenticate:** owner signs in through the existing application authentication. Authentication is a prerequisite, not a new customer-facing feature.
2. **Shop setup:** if no usable shop profile exists, route to the shop details form. If a profile exists, show a concise profile summary and continue to the dashboard.
3. **Save shop profile:** owner enters shop name, address, mobile number and Google Maps location. Save and show the persisted profile summary.
4. **Build menu:** owner adds food items and selling prices; optional unit behavior remains subject to PO decision. The owner can edit, activate or deactivate entries.
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

### 4.2 Screen O-02 — Food menu

**Purpose:** maintain the list of selectable foods for future bills, without inventory functionality.

**List view:**
- Page title: “খাবারের মেনু”.
- Primary action: “নতুন খাবার যোগ করুন”.
- Search active items by displayed name.
- Active and inactive status must be visually and textually distinguishable.
- Default list shows active items; a filter/tab exposes inactive items.
- Each row shows food name, selling price and (if PO approves) unit.
- Row actions: Edit; Deactivate for active entries; Activate for inactive entries.
- No stock quantity, purchase price, supplier, stock adjustment or inventory status is shown.

**Add/edit form — proposed fields pending exact PO menu baseline:**

| Field | Proposed control | Current authority |
|---|---|---|
| Food/item name | Text input | Required field policy/length not established in canonical PO record |
| Selling price (BDT) | Numeric input, BDT label | Requiredness and precision rules require PO baseline |
| Unit | Select or simple text | Not PO-confirmed; default “পিস” in PR #28 is a CH-3 proposal only |

Do not represent the proposed field requirements or validation rules as PO-approved until the exact PO-B01–PO-B07 record is established and accepted in GitHub.

**Interactions:**
- Add → validate → save → return to list with new active item visible.
- Edit → update the menu record → future bill composers use the updated menu value; existing issued invoices remain unchanged.
- Deactivate → confirmation dialog states the item will no longer be selectable for new bills. It does not delete old invoice lines.
- Activate → item becomes selectable for new bills.
- If an item is already included in an unsaved bill and is deactivated elsewhere, the current draft must not silently change. On next validation, explain that the item is no longer active and require owner review.
- Deactivated entries remain available in the inactive list for reactivation; do not permanently delete through the normal UX.

**Empty states:**
- No menu entries: explain that foods must be added before a bill can be composed; show “খাবার যোগ করুন”.
- No search result: show “কোনো খাবার পাওয়া যায়নি” and a clear action to clear search.
- No inactive entries: show a neutral empty message, not an error.

**Policy boundary:** menu duplicate rules, Unicode normalization, exact character limit, unit handling and price validation remain unresolved until the canonical PO decision is pinned. The screen structure can be reviewed, but implementation must not infer these rules.

### 4.3 Screen O-03 — Invoice composer

**Purpose:** assemble the current sale as a bill.

**Initial state:**
- Header: “নতুন বিল”.
- Search field: “খাবারের নাম লিখে খুঁজুন”.
- Active menu list only.
- Each menu row shows food name and selling price; unit only if approved.
- Empty bill summary: “এখনও কোনো খাবার যোগ করা হয়নি”.
- Sticky bottom summary: current total and “বিল পর্যালোচনা” action, disabled until at least one valid line exists.

**Add item interaction:**
- Tap a menu row to add one line.
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

1. Shop identity block.
2. Mandatory Bangla heading.
3. Bill metadata.
4. Item table.
5. Total amount, visually emphasized.
6. Individual bill QR and verification/details caption.
7. Mandatory Bangla footer.

Use high-contrast dark text on a white background, restrained separators, consistent numeric alignment and generous enough spacing for Bangla shaping. Avoid decorative graphics that reduce printable area.

### 5.2 Mandatory strings

- Heading must be exactly: **খাবারের বিল**
- Footer must be exactly: **ধন্যবাদ, আবার আসবেন!**

Do not translate, paraphrase, replace, omit or render these as image-only text.

### 5.3 PO field-to-invoice mapping

| PO-confirmed field | Invoice location | Source / behavior |
|---|---|---|
| Shop name | Top shop identity block | Snapshot from shop profile at invoice issue |
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

**Review target:** PR #28 HEAD `ec67f403a625acea195c7913d23e7a69254c5ecc`.  
**Reviewed document:** `docs/design/INVOICE_FIRST_WEB_MVP_TECHNICAL_DESIGN_v0.1.md`, blob `10f795ddfc24b0d3eab204b8006379616ab2ec13`.  
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

### 11.2 Positive technical alignment

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

### 11.3 Explicit UX disposition

**PR #28 UX disposition: ACCEPT WITH CONDITIONS.**

Conditions:
1. CH-1/PO resolve the P1 decisions in Section 12.
2. CH-3 incorporates the screen/state behavior and recovery constraints in this UX specification into a revised technical/design baseline before implementation.
3. The menu UX does not rely on PO-B01–PO-B07 until their exact canonical decision record is recovered and accepted.
4. Offline capability is not advertised unless the PO decision and technical design support it.
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
- **UX-07:** Owner can add and edit a menu item using only fields approved by the canonical PO decision.
- **UX-08:** Active and inactive entries are distinguishable; inactive entries cannot be selected for a new bill.
- **UX-09:** Deactivation requires confirmation and does not imply deletion of historical invoice lines.
- **UX-10:** Empty menu, empty search and inactive-list states each provide an appropriate next action.
- **UX-11:** A failed menu save preserves entered values and offers retry.

### Invoice composer and issue
- **UX-12:** Owner can create a bill using active menu items and see item name, quantity, price and running total.
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

## 14. Evidence and verification boundary

**Verified by static GitHub source review for this deliverable:**
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

**CH-2 recommendation:** accept this UX specification as the review baseline only after CH-1/PO confirms the unresolved business decisions that affect implementation. Do not treat this PR or the UX disposition as permission to start implementation.

**Implementation authorization: NOT GRANTED.**  
**QA execution authorization: NOT GRANTED.**  
**Merge authorization: NOT GRANTED.**  
**Deployment / pilot: NOT AUTHORIZED.**

---

**Submitted by:** CH-2 — Product & UX Lead  
**Submitted to:** CH-1 — Project Lead & Chief Reviewer
