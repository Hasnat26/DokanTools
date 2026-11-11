import { test, expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const OWNER_A = { id: "synthetic-owner-a", email: "owner-a@example.test", password: "synthetic-password-a" };
const OWNER_B = { id: "synthetic-owner-b", email: "owner-b@example.test", password: "synthetic-password-b" };
const SHOP_A = { id: "synthetic-shop-a", user_id: OWNER_A.id, shop_name: "পরীক্ষামূলক খাবার ঘর", phone: "01700000000", address: "Gulshan, Dhaka", map_link: null };
const SHOP_B = { id: "synthetic-shop-b", user_id: OWNER_B.id, shop_name: "দ্বিতীয় পরীক্ষামূলক দোকান", phone: "01800000000", address: "Banani, Dhaka", map_link: null };
const CATALOG = [
  { id: "item-rice", shop_id: SHOP_A.id, name: "সাদা ভাত", sale_price: "10.50", is_active: true, sort_order: 1 },
  { id: "item-dal", shop_id: SHOP_A.id, name: "ডাল", sale_price: "20.00", is_active: true, sort_order: 2 },
];
const INVOICE_A = {
  id: "synthetic-invoice-a", shopId: SHOP_A.id, billNumber: "A-0001",
  issuedAt: "2026-11-11T08:00:00.000Z", currency: "BDT", totalAmount: "15.75",
  header: { shopName: SHOP_A.shop_name, shopAddress: SHOP_A.address, shopPhone: SHOP_A.phone, mapUrl: null },
  lines: [{ lineNo: 1, catalogItemId: "item-rice", itemName: "সাদা ভাত", unit: "plate", quantity: "1.5", unitPrice: "10.50", lineTotal: "15.75" }],
};

type Deferred = { promise: Promise<void>; resolve: () => void };
function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function installSyntheticSupabase(page: Page, options: {
  invoiceList?: (token: string) => Promise<{ status?: number; invoices?: unknown[]; error?: unknown }>;
  invoiceDetail?: (token: string) => Promise<{ status?: number; invoice?: unknown; error?: unknown }>;
} = {}) {
  let currentUser: typeof OWNER_A | typeof OWNER_B | null = null;
  await page.route("https://example.supabase.co/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: {
        "access-control-allow-origin": "http://127.0.0.1:3000",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "apikey,authorization,content-type,x-client-info",
      }, body: "" });
    }
    if (url.pathname.endsWith("/auth/v1/token") && request.method() === "POST") {
      const body = request.postDataJSON() as { email?: string };
      currentUser = body.email === OWNER_A.email ? OWNER_A : body.email === OWNER_B.email ? OWNER_B : null;
      if (!currentUser) return route.fulfill({ status: 400, json: { msg: "Invalid synthetic credentials" } });
      return route.fulfill({ json: {
        access_token: `synthetic-token-${currentUser.id}`, token_type: "bearer", expires_in: 3600,
        refresh_token: `synthetic-refresh-${currentUser.id}`,
        user: { id: currentUser.id, aud: "authenticated", role: "authenticated", email: currentUser.email,
          app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: "2026-01-01T00:00:00.000Z" },
      } });
    }
    if (url.pathname.endsWith("/auth/v1/user") && request.method() === "GET") {
      return currentUser
        ? route.fulfill({ json: { id: currentUser.id, aud: "authenticated", role: "authenticated", email: currentUser.email,
            app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {} } })
        : route.fulfill({ status: 401, json: { message: "Not authenticated" } });
    }
    if (url.pathname.endsWith("/auth/v1/logout") && request.method() === "POST") {
      currentUser = null;
      return route.fulfill({ status: 204, body: "" });
    }
    if (url.pathname.endsWith("/rest/v1/shops") && request.method() === "GET") {
      const requestedOwner = url.searchParams.get("user_id")?.replace("eq.", "");
      const shop = currentUser?.id === OWNER_A.id ? SHOP_A : currentUser?.id === OWNER_B.id ? SHOP_B : null;
      if (!currentUser || requestedOwner !== currentUser.id || !shop) return route.fulfill({ status: 200, json: null });
      return route.fulfill({ status: 200, json: shop });
    }
    if (url.pathname.endsWith("/rest/v1/item_catalog") && request.method() === "GET") {
      return route.fulfill({ status: 200, json: currentUser?.id === OWNER_A.id ? CATALOG : [] });
    }
    return route.fulfill({ status: 404, json: { message: "Unmocked synthetic Supabase request", path: url.pathname } });
  });

  await page.route("**/api/invoices**", async route => {
    const request = route.request();
    const token = request.headers().authorization || "";
    if (request.method() === "GET" && new URL(request.url()).pathname === "/api/invoices") {
      const result = options.invoiceList
        ? await options.invoiceList(token)
        : { invoices: token.includes(OWNER_A.id) ? [INVOICE_A] : [] };
      return route.fulfill({ status: result.status || 200, json: result.error ? { error: result.error } : { invoices: result.invoices || [] } });
    }
    if (request.method() === "GET" && new URL(request.url()).pathname.startsWith("/api/invoices/")) {
      const result = options.invoiceDetail
        ? await options.invoiceDetail(token)
        : { invoice: INVOICE_A };
      return route.fulfill({ status: result.status || 200, json: result.error ? { error: result.error } : { invoice: result.invoice || INVOICE_A } });
    }
    if (request.method() === "POST") return route.fulfill({ status: 423, json: { error: { code: "INVOICE_ISSUE_DISABLED" } } });
    return route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND" } } });
  });
}

async function login(page: Page, owner: typeof OWNER_A | typeof OWNER_B) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(owner.email);
  await page.locator('input[type="password"]').fill(owner.password);
  await page.getByRole("button", { name: "লগইন" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: /খাবারের বিল/ }).click();
  await expect(page.getByRole("heading", { name: "খাবারের বিল" }).first()).toBeVisible();
  await expect(page.getByText(owner.id === OWNER_A.id ? SHOP_A.shop_name : SHOP_B.shop_name)).toBeVisible();
}

async function addOneLine(page: Page, name = "সাদা ভাত", qty = "1", price = "10.50") {
  await page.getByRole("button", { name: /সাদা ভাত ৳10\.50/ }).click();
  await page.locator("#qty-0").fill(qty);
  if (name !== "সাদা ভাত") await page.locator("#item-name-0").fill(name);
  if (price !== "10.50") await page.locator("#price-0").fill(price);
}

async function readDraftRecords(page: Page): Promise<Array<{ id: string; owner_id: string; lines: Array<{ item_name: string }> }>> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("dokantools-invoice-drafts", 1);
    request.onsuccess = () => {
      const db = request.result;
      const get = db.transaction("drafts", "readonly").objectStore("drafts").getAll();
      get.onsuccess = () => { const rows = get.result; db.close(); resolve(rows); };
      get.onerror = () => { db.close(); reject(get.error); };
    };
    request.onerror = () => reject(request.error);
  }));
}

async function signOutThroughSupabaseUi(page: Page) {
  const logoutRequest = page.waitForRequest(request =>
    request.url().endsWith("/auth/v1/logout") && request.method() === "POST");
  await page.getByRole("button", { name: "লগআউট" }).click();
  await logoutRequest;
  await expect(page.getByRole("link", { name: "লগইন" })).toBeVisible();
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

test("login, authenticated owner/shop context, catalogue read-only and invoice route startup", async ({ page }) => {
  const writes: string[] = [];
  await installSyntheticSupabase(page);
  page.on("request", request => {
    if (/\/rest\/v1\/(shops|item_catalog)/.test(request.url()) && !["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method());
  });
  await page.goto("/dashboard/invoices");
  await expect(page).toHaveURL(/\/login$/);
  await login(page, OWNER_A);
  await expect(page.getByText("খসড়া মোড · ইস্যু বন্ধ")).toBeVisible();
  await expect(page.getByText("সাদা ভাত")).toBeVisible();
  await expect(page.getByText("ডাল")).toBeVisible();
  expect(writes).toEqual([]);
});

test("composer validation, decimal calculation and Bangla review document", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await expect(page.getByRole("button", { name: "বিল পর্যালোচনা" })).toBeDisabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".invoice-document")).toHaveCount(0);
  await page.locator("#item-name-0").fill("   ");
  await page.locator("#qty-0").fill("1");
  await page.locator("#price-0").fill("10.00");
  await expect(page.getByRole("button", { name: "বিল পর্যালোচনা" })).toBeDisabled();
  await page.getByRole("button", { name: /সাদা ভাত ৳10\.50/ }).click();
  await page.locator("#qty-0").fill("2");
  await expect(page.getByText("৳21.00").first()).toBeVisible();
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document")).toBeVisible();
  await expect(page.locator(".invoice-document h2")).toHaveText("খাবারের বিল");
  await expect(page.locator(".invoice-document__footer")).toHaveText("ধন্যবাদ, আবার আসবেন!");
  await expect(page.locator(".invoice-document__total")).toContainText("৳21.00");
  await expect(page.locator(".invoice-document__meta a")).toHaveCount(0);
  await expect(page.locator('button[title="PO decisions pending"]')).toBeDisabled();
});

test("real Chromium IndexedDB saves, survives reload, reopens and deletes a local draft", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page);
  await page.getByRole("button", { name: "খসড়া সংরক্ষণ ও পর্যালোচনা" }).click();
  await expect(page.getByRole("status")).toContainText("খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে");
  await page.reload();
  await expect(page.getByRole("heading", { name: "খাবারের বিল" }).first()).toBeVisible();
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText(/খসড়া ·/).first()).toBeVisible();
  await page.getByRole("button", { name: "খুলুন" }).click();
  await expect(page.locator("#item-name-0")).toHaveValue("সাদা ভাত");
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  const beforeDelete = await readDraftRecords(page);
  expect(beforeDelete).toHaveLength(1);
  const deletedId = beforeDelete[0].id;
  await page.getByRole("button", { name: "মুছুন" }).click();
  await expect(page.getByRole("status")).toContainText("খসড়া মুছে ফেলা হয়েছে।");
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("এখনও কোনো local draft নেই।")).toBeVisible();
  const afterDelete = await readDraftRecords(page);
  expect(afterDelete.some(row => row.id === deletedId)).toBeFalsy();
  expect(afterDelete).toHaveLength(0);
});

test("same browser context: A draft is retained but inaccessible to B after auth session switch", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page, "A-PRIVATE-DRAFT-ITEM", "1", "99.00");
  await page.getByRole("button", { name: "খসড়া সংরক্ষণ ও পর্যালোচনা" }).click();
  await expect(page.getByRole("status")).toContainText("খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে");
  await signOutThroughSupabaseUi(page);
  await login(page, OWNER_B);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("এখনও কোনো local draft নেই।")).toBeVisible();
  await expect(page.getByText("A-PRIVATE-DRAFT-ITEM")).toHaveCount(0);
  await expect(page.getByText(SHOP_A.shop_name)).toHaveCount(0);
  await expect(page.getByText(SHOP_B.shop_name)).toBeVisible();
  const retainedA = (await readDraftRecords(page)).some(row =>
    row.owner_id === OWNER_A.id && row.lines?.[0]?.item_name === "A-PRIVATE-DRAFT-ITEM");
    expect(retainedA).toBeTruthy();
});

test("stale User A history success cannot populate User B after session switch", async ({ page }) => {
  const gate = deferred();
  const started = deferred();
  await installSyntheticSupabase(page, {
    invoiceList: async token => {
      if (token.includes(OWNER_A.id)) { started.resolve(); await gate.promise; return { invoices: [INVOICE_A] }; }
      return { invoices: [] };
    },
  });
  await login(page, OWNER_A);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await started.promise;
  await signOutThroughSupabaseUi(page);
  await login(page, OWNER_B);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("সার্ভারে কোনো ইস্যু করা বিল পাওয়া যায়নি।")).toBeVisible();
  gate.resolve();
  await expect(page.getByText("A-0001")).toHaveCount(0);
  await expect(page.getByText(SHOP_A.shop_name)).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("stale User A detail success cannot populate User B after session switch", async ({ page }) => {
  const gate = deferred();
  const started = deferred();
  await installSyntheticSupabase(page, {
    invoiceList: async token => ({ invoices: token.includes(OWNER_A.id) ? [INVOICE_A] : [] }),
    invoiceDetail: async token => {
      if (token.includes(OWNER_A.id)) { started.resolve(); await gate.promise; return { invoice: INVOICE_A }; }
      return { status: 404, error: { code: "NOT_FOUND" } };
    },
  });
  await login(page, OWNER_A);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("A-0001")).toBeVisible();
  await page.getByRole("button", { name: "বিস্তারিত" }).click();
  await started.promise;
  await signOutThroughSupabaseUi(page);
  await login(page, OWNER_B);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("সার্ভারে কোনো ইস্যু করা বিল পাওয়া যায়নি।")).toBeVisible();
  gate.resolve();
  await expect(page.getByText("A-0001")).toHaveCount(0);
  await expect(page.locator(".invoice-document")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("stale User A history error cannot overwrite User B history state", async ({ page }) => {
  const gate = deferred();
  const started = deferred();
  await installSyntheticSupabase(page, {
    invoiceList: async token => {
      if (token.includes(OWNER_A.id)) { started.resolve(); await gate.promise; return { status: 503, error: { code: "SYNTHETIC_A_FAILURE" } }; }
      return { invoices: [] };
    },
  });
  await login(page, OWNER_A);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await started.promise;
  await signOutThroughSupabaseUi(page);
  await login(page, OWNER_B);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("সার্ভারে কোনো ইস্যু করা বিল পাওয়া যায়নি।")).toBeVisible();
  gate.resolve();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("সার্ভারে কোনো ইস্যু করা বিল পাওয়া যায়নি।")).toBeVisible();
});

test("desktop/mobile layout and real short/long PDF output preserve Bengali labels and pagination", async ({ page }, testInfo) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page);
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("invoice-desktop-short.png"), fullPage: true });
  const fontInfo = await page.locator(".invoice-document").evaluate(el => ({
    family: getComputedStyle(el).fontFamily,
    notoLoaded: document.fonts.check("16px 'Noto Sans Bengali'"),
  }));
  expect(fontInfo.family).toContain("Noto Sans Bengali");
  expect(fontInfo.notoLoaded).toBeTruthy();
  await page.emulateMedia({ media: "print" });
  const shortPdf = await page.pdf({ format: "A4", printBackground: true });
  expect(shortPdf.byteLength).toBeGreaterThan(1000);
  await writeFile(testInfo.outputPath("invoice-short.pdf"), shortPdf);
  const shortPages = shortPdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length || 0;
  expect(shortPages).toBeGreaterThanOrEqual(1);

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "বিল সম্পাদনা" }).click();
  for (let i = 1; i < 28; i++) {
    await page.getByRole("button", { name: "+ লাইন যোগ করুন" }).click();
    await page.locator(`#item-name-${i}`).fill(`Synthetic food line ${i + 1}`);
    await page.locator(`#qty-${i}`).fill("1");
    await page.locator(`#price-${i}`).fill("10.00");
  }
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document tbody tr")).toHaveCount(28);
  await expect(page.locator(".invoice-document__total")).toContainText("৳");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("invoice-mobile-long.png"), fullPage: true });
  const dimensions = await page.locator(".invoice-document").evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  await page.emulateMedia({ media: "print" });
  const longPdf = await page.pdf({ format: "A4", printBackground: true });
  expect(longPdf.byteLength).toBeGreaterThan(shortPdf.byteLength);
  await writeFile(testInfo.outputPath("invoice-long.pdf"), longPdf);
  const longPages = longPdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length || 0;
  expect(longPages).toBeGreaterThanOrEqual(2);
});

test("invoice issue remains disabled and no POST is dispatched", async ({ page }) => {
  const posts: string[] = [];
  await installSyntheticSupabase(page);
  page.on("request", request => {
    if (request.url().includes("/api/invoices") && request.method() === "POST") posts.push(request.url());
  });
  await login(page, OWNER_A);
  await addOneLine(page);
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator('button[title="PO decisions pending"]')).toBeDisabled();
  expect(posts).toEqual([]);
});

test("legacy dashboard routes remain reachable and untouched by the PR #41 privacy delta", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  for (const path of ["/dashboard/memo", "/dashboard/stock", "/dashboard/baki"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByText("লোড হচ্ছে…")).toHaveCount(0);
  }
});
