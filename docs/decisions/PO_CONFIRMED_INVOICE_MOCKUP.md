# DokanTools — PO-Confirmed Standard Invoice Mockup

**Document type:** Product decision record  
**Decision owner:** Product Owner (PO)  
**Prepared/reviewed by:** PM / AI Team Lead, incorporating CH-1 correction  
**Status:** PO-confirmed invoice format; no implementation approval  
**Scope:** Invoice layout and bill QR purpose only

## 1. Decision

The PO confirms the previously established Bangla food-bill mockup as the standard DokanTools invoice format for small Bangladesh food shops, hotels, and restaurants.

This replaces the generic English invoice layout previously suggested. Do not substitute a generic invoice format.

## 2. PO-confirmed invoice layout

Illustrative structure:

- Shop name
- Shop address
- Mobile number
- Google Maps shop location
- Heading: **খাবারের বিল**
- Bill number
- Date
- Time
- Food/item name
- Quantity
- Price
- Total bill amount
- QR code for bill verification / bill details
- Footer: **ধন্যবাদ, আবার আসবেন!**

Example:

```text
দোকানের নাম
দোকানের ঠিকানা
মোবাইল: 01XXXXXXXXX
Google Maps Location

খাবারের বিল

Bill No: 0001
তারিখ: DD-MM-YYYY
সময়: HH:MM

খাবার/আইটেম       পরিমাণ       মূল্য
ভাত                    1          ৳30
মুরগির মাংস            1          ৳120

মোট বিল
৳150

Bill Verification / Bill Details QR
বিল যাচাই / বিলের বিস্তারিত

ধন্যবাদ, আবার আসবেন!
```

The shop details, bill number, food items, and amounts above are examples only.

## 3. Bill QR and shop QR are distinct

### Bill verification / bill details QR
- Appears on an individual bill.
- Purpose: identify that bill and provide bill verification/details.
- **PO-confirmed in the invoice mockup.**

### Shop promotional/profile QR
- Purpose: identify the shop and show shop profile/promotional information.
- Separate concept.
- Must not replace the individual bill QR.

The QR implementation remains a technical design matter. Offline-generated bill QR behavior, verification availability before/after internet connectivity, QR payload/reference, and cancelled-bill display have not been finalized.

## 4. Decision status

| Decision | Status |
|---|---|
| Bangla food-bill invoice layout | PO-confirmed |
| “খাবারের বিল” heading | PO-confirmed |
| Shop name, address, mobile, Google Maps location | PO-confirmed |
| Bill number, date, time | PO-confirmed |
| Food/item, quantity, price, total | PO-confirmed |
| “ধন্যবাদ, আবার আসবেন!” footer | PO-confirmed |
| Bill verification/details QR | PO-confirmed |
| Shop promotional QR as a substitute for bill QR | Not accepted |
| QR technical implementation/offline verification | Pending technical design |

## 5. Governance and limitations

- This record documents the PO-confirmed invoice mockup and QR distinction only.
- It does not reopen unrelated PO decisions.
- No code, database, migration, branch, PR, deployment, or pilot implementation is authorized by this record.
- M0-01: **NOT ACCEPTED**
- Implementation approval: **NOT GRANTED**
- Financial pilot: **NO-GO**
- Technical design: **CONDITIONAL GO**
- Implementation readiness: **NO-GO**

---
This document records product direction. It is not evidence that invoice or QR functionality has been implemented or tested.
