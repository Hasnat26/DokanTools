/**
 * Synthetic Invoice-First fixtures only.
 * Never load customer, production or hosted database records here.
 */
export const owners = Object.freeze({
  ownerA: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownerB: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

export const shops = Object.freeze({
  shopA1: "11111111-1111-4111-8111-111111111111",
  shopA2: "12121212-1212-4212-8212-121212121212",
  shopB1: "22222222-2222-4222-8222-222222222222",
});

export const catalog = Object.freeze({
  shopA1: Object.freeze([
    Object.freeze({ id: "menu-a-rice", name: "Plain Rice" }),
    Object.freeze({ id: "menu-a-dal", name: "Dal" }),
  ]),
  shopB1: Object.freeze([
    Object.freeze({ id: "menu-b-tea", name: "Tea" }),
  ]),
});

export const headers = Object.freeze({
  shopA1: Object.freeze({
    shopName: "QA Synthetic Food Shop A",
    address: "QA Address A",
    mobile: "+880 1000-000001",
    mapsUrl: "https://maps.google.com/?q=QA-SYNTHETIC-A",
    profileRevision: 4,
  }),
});

export const drafts = Object.freeze({
  minimal: Object.freeze({
    ownerId: owners.ownerA,
    shopId: shops.shopA1,
    status: "draft",
    lines: Object.freeze([
      Object.freeze({
        menuItemId: "menu-a-rice",
        itemNameSnapshot: "Plain Rice",
        quantity: "1",
        unitPrice: "10.00",
      }),
    ]),
  }),
});

export const issued = Object.freeze({
  invoiceId: "33333333-3333-4333-8333-333333333333",
  ownerId: owners.ownerA,
  shopId: shops.shopA1,
  status: "issued",
  billNumber: 1,
  issuedAt: "2026-11-11T00:00:00.000Z",
  headerSnapshot: Object.freeze({ ...headers.shopA1 }),
  lines: Object.freeze([
    Object.freeze({
      menuItemId: "menu-a-rice",
      itemNameSnapshot: "Plain Rice",
      quantity: "1",
      unitPrice: "10.00",
      lineAmount: "10.00",
    }),
  ]),
  totalAmount: "10.00",
  publicQr: null,
  publicUrl: null,
});

export const requests = Object.freeze({
  namespace: "invoice-create/v1",
  requestId: "44444444-4444-4444-8444-444444444444",
  exactPayload: Object.freeze({
    ownerId: owners.ownerA,
    shopId: shops.shopA1,
    operation: "invoice-create",
    canonicalizationVersion: "invoice-create/v1",
    lines: Object.freeze([
      Object.freeze({ menuItemId: "menu-a-rice", quantity: "1", unitPrice: "10.00" }),
    ]),
  }),
});

export const legacyState = Object.freeze({
  memos: 7,
  stockItems: 12,
  stockMovements: 31,
  customers: 2,
  dueLedgerEntries: 4,
});
