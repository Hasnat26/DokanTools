# DokanTools V1 — External Acceptance Record

**Record status:** OPEN — physical tests not yet executed  
**Build under test:** delivery branch baseline `449b6cc405f9aca91676ea20e4cb6afe80e8544e`  
**Purpose:** capture real-device, real-recipient and physical-print evidence. Browser simulation is not acceptable as a substitute.

## A. Android Chrome → WhatsApp PDF

**Test participant / owner:** TBD (PO or authorized colleague)  
**Test date/time:** TBD  
**Test environment URL and deployed SHA:** TBD  
**Test shop/account:** Synthetic test account only; do not use customer data.

| Required field | Record |
|---|---|
| Device manufacturer/model | TBD |
| Android version/build | TBD |
| Chrome version | TBD |
| WhatsApp version | TBD |
| Sender account | Synthetic test account; identifier redacted |
| Recipient | Designated consenting test recipient; identifier redacted |
| PDF filename | TBD |
| PDF SHA-256 | TBD |

### Procedure and result

1. Sign in to the approved test deployment on the physical Android device.
2. Create a Draft Memo with synthetic shop/item data and no customer personal data.
3. Generate the A6 PDF and confirm it is marked draft/not an issued invoice.
4. Invoke the native Android share sheet from the app.
5. Select WhatsApp and send the PDF as a document attachment to the designated test recipient.
6. On the recipient's device, confirm the attachment arrived and opens successfully.
7. Verify one-page A6 portrait geometry, expected content/total, QR decode/destination, Maps link and readability at normal zoom.
8. Capture sender-side share-sheet evidence and recipient-side received/opened evidence. Redact phone numbers, names, message previews and unrelated chats.
9. Record any failure and exact reproduction steps.

| Acceptance item | Result | Evidence reference |
|---|---|---|
| Native Android share sheet opened | NOT RUN | TBD |
| PDF selected as document attachment | NOT RUN | TBD |
| WhatsApp send completed | NOT RUN | TBD |
| Recipient received document | NOT RUN | TBD |
| Recipient opened PDF | NOT RUN | TBD |
| A6 page size/orientation verified | NOT RUN | TBD |
| Content/total/readability verified | NOT RUN | TBD |
| QR decoded and destination verified | NOT RUN | TBD |
| Maps link opens expected location | NOT RUN | TBD |

**Decision:** NOT ACCEPTED until all rows are evidenced. Do not record a recipient's personal contact information in this repository.

## B. Physical A6 print

**Tester:** TBD  
**Date:** TBD  
**Printer model:** TBD  
**Printer driver/version:** TBD  
**OS:** TBD  
**Paper:** A6, portrait  
**PDF SHA-256:** TBD

Required print settings:
- Paper size A6, portrait.
- Scale 100% / actual size; do not use fit-to-page unless explicitly evaluated and approved.
- Record margins/borderless setting and any printer-specific options.
- Disable unintended duplex or scaling.

| Acceptance item | Result | Evidence reference |
|---|---|---|
| A6 paper selected | NOT RUN | TBD |
| Portrait orientation | NOT RUN | TBD |
| 100%/actual-size scaling | NOT RUN | TBD |
| No clipped text/images | NOT RUN | TBD |
| Margins acceptable | NOT RUN | TBD |
| QR readable with phone camera | NOT RUN | TBD |
| Maps link/content correct | NOT RUN | TBD |
| Text readable; print quality acceptable | NOT RUN | TBD |

Attach a photo/scan of the physical print with all personal/business data replaced by synthetic values. Record any driver or paper-feed issue.

## C. Sign-off

- Android/WhatsApp tester: TBD
- Physical print tester: TBD
- PO acceptance: PENDING
- Overall external acceptance: PENDING

CI evidence previously verified PDF geometry and browser share/print handler behavior. It did not test a physical Android device, WhatsApp recipient delivery, OS print dialog, printer driver or paper output.
