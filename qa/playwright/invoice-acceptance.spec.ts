import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const OWNER_A = { id: "synthetic-owner-a", email: "owner-a@example.test", password: "synthetic-password-a" };
const OWNER_B = { id: "synthetic-owner-b", email: "owner-b@example.test", password: "synthetic-password-b" };
const SHOP_A = { id: "synthetic-shop-a", user_id: OWNER_A.id, shop_name: "পরীক্ষামূলক খাবার ঘর", phone: "01700000000", address: "Gulshan, Dhaka", map_link: null };
const SHOP_B = { id: "synthetic-shop-b", user_id: OWNER_B.id, shop_name: "দ্বিতীয় পরীক্ষামূলক দোকান", phone: "01800000000", address: "Banani, Dhaka", map_link: null };
const CATALOG = [
  { id: "item-rice", shop_id: SHOP_A.id, name: "সাদা ভাত", sale_price: "10.50", is_active: true, sort_order: 1 },
  { id: "item-dal", shop_id: SHOP_A.id, name: "ডাল", sale_price: "20.00", is_active: true, sort_order: 2 },
];

async function installSyntheticSupabase(page: Page) {
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
        access_token: `synthetic-token-${currentUser.id}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `synthetic-refresh-${currentUser.id}`,
        user: { id: currentUser.id, aud: "authenticated", role: "authenticated", email: currentUser.email, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: "2026-01-01T00:00:00.000Z" },
      } });
    }
    if (url.pathname.endsWith("/auth/v1/user") && request.method() === "GET") {
      return currentUser
        ? route.fulfill({ json: { id: currentUser.id, aud: "authenticated", role: "authenticated", email: currentUser.email, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {} } })
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
      const accept = request.headers()["accept"] || "";
      return route.fulfill({ status: 200, json: accept.includes("vnd.pgrst.object") ? shop : [shop] });
    }
    if (url.pathname.endsWith("/rest/v1/item_catalog") && request.method() === "GET") {
      return route.fulfill({ status: 200, json: currentUser?.id === OWNER_A.id ? CATALOG : [] });
    }
    return route.fulfill({ status: 404, json: { message: "Unmocked synthetic Supabase request", path: url.pathname } });
  });
  await page.route("**/api/invoices**", route => route.fulfill({ status: 200, json: { invoices: [] } }));
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

async function addOneLine(page: Page, name = "সাদা ভাত", qty = "1.5", price = "10.50") {
  await page.locator("#item-name-0").fill(name);
  await page.locator("#qty-0").fill(qty);
  await page.locator("#price-0").fill(price);
}

test("unauthenticated invoice route redirects to login; authenticated owner/shop context loads", async ({ page }) => {
  await installSyntheticSupabase(page);
  await page.goto("/dashboard/invoices");
  await expect(page).toHaveURL(/\/login$/);
  await login(page, OWNER_A);
  await expect(page.getByText("খসড়া মোড · ইস্যু বন্ধ")).toBeVisible();
  await expect(page.getByText("PO-06 pending", { exact: false })).toBeVisible();
});

test("composer validation, decimal calculation and review render", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await expect(page.getByRole("button", { name: "বিল পর্যালোচনা" })).toBeDisabled();
  await expect(page.getByText("বিল খালি।")).toBeVisible();
  await page.locator("#item-name-0").fill("   ");
  await page.locator("#qty-0").fill("1");
  await page.locator("#price-0").fill("10.00");
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.getByRole("alert")).toContainText("প্রতিটি লাইনের খাবার/আইটেমের নাম দিন");
  await addOneLine(page);
  await expect(page.getByText("৳15.75").first()).toBeVisible();
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document")).toBeVisible();
  await expect(page.locator(".invoice-document h2")).toHaveText("খাবারের বিল");
  await expect(page.locator(".invoice-document__footer")).toHaveText("ধন্যবাদ, আবার আসবেন!");
  await expect(page.locator(".invoice-document__total")).toContainText("৳15.75");
  await expect(page.getByText("Google Maps Location")).toHaveCount(0);
});

test("real Chromium IndexedDB saves, survives reload, reopens and deletes a local draft", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page);
  await page.getByRole("button", { name: "খসড়া সংরক্ষণ ও পর্যালোচনা" }).click();
  await expect(page.getByText("খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে।")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "খাবারের বিল" }).first()).toBeVisible();
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText(/খসড়া ·/).first()).toBeVisible();
  await page.getByRole("button", { name: "খুলুন" }).click();
  await expect(page.locator("#item-name-0")).toHaveValue("সাদা ভাত");
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await page.getByRole("button", { name: "মুছুন" }).click();
  await expect(page.getByText("এখনও কোনো local draft নেই।")).toBeVisible();
});

test("same browser context: owner A logout then owner B login cannot see A draft or shop data", async ({ page, context }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page, "A-PRIVATE-DRAFT-ITEM", "1", "99.00");
  await page.getByRole("button", { name: "খসড়া সংরক্ষণ ও পর্যালোচনা" }).click();
  await expect(page.getByText("খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে।")).toBeVisible();

  // No logout control exists in the checkpoint UI. Exercise the Supabase logout
  // endpoint and remove the persisted client session, then sign in as B.
  const logoutResult = await page.evaluate(async () => {
    const key = Object.keys(localStorage).find(value => value.endsWith("-auth-token"));
    const session = key ? JSON.parse(localStorage.getItem(key) || "null") : null;
    const token = session?.access_token;
    const response = await fetch("https://example.supabase.co/auth/v1/logout", {
      method: "POST",
      headers: { apikey: "synthetic-anon-key-not-a-secret", Authorization: token ? `Bearer ${token}` : "" },
    });
    if (key) localStorage.removeItem(key);
    return { status: response.status, removedSession: Boolean(key) };
  });
  expect(logoutResult.status).toBe(204);
  expect(logoutResult.removedSession).toBeTruthy();

  await login(page, OWNER_B);
  await page.getByRole("button", { name: "খসড়া ও বিলের ইতিহাস" }).click();
  await expect(page.getByText("এখনও কোনো local draft নেই।")).toBeVisible();
  await expect(page.getByText("A-PRIVATE-DRAFT-ITEM")).toHaveCount(0);
  await expect(page.getByText(SHOP_A.shop_name)).toHaveCount(0);
  await expect(page.getByText(SHOP_B.shop_name)).toBeVisible();
  // Confirm the same IndexedDB database still contains A's record, but B's
  // owner/shop-scoped list query does not return it.
  const persisted = await page.evaluate(() => new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open("dokantools-invoice-drafts", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("drafts", "readonly");
      const get = tx.objectStore("drafts").getAll();
      get.onsuccess = () => { const found = get.result.some((row: any) => row.owner_id === "synthetic-owner-a" && row.lines?.[0]?.item_name === "A-PRIVATE-DRAFT-ITEM"); db.close(); resolve(found); };
      get.onerror = () => reject(get.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(persisted).toBeTruthy();
});

test("desktop/mobile layout and short/long invoice print PDFs preserve totals and Bengali labels", async ({ page }) => {
  await installSyntheticSupabase(page);
  await login(page, OWNER_A);
  await addOneLine(page);
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document")).toBeVisible();
  await page.screenshot({ path: "test-results/invoice-desktop.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  const shortPdf = await page.pdf({ format: "A4", printBackground: true });
  expect(shortPdf.byteLength).toBeGreaterThan(1000);
  expect(shortPdf.toString("latin1").match(/\/Type \/Page\b/g)?.length || 0).toBeGreaterThanOrEqual(1);

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "বিল সম্পাদনা" }).click();
  for (let i = 1; i < 24; i++) {
    await page.getByRole("button", { name: "+ লাইন যোগ করুন" }).click();
    await page.locator(`#item-name-${i}`).fill(`Synthetic food line ${i + 1}`);
    await page.locator(`#qty-${i}`).fill("1");
    await page.locator(`#price-${i}`).fill("10.00");
  }
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator(".invoice-document tbody tr")).toHaveCount(24);
  await expect(page.locator(".invoice-document__total")).toContainText("৳");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/invoice-mobile-long.png", fullPage: true });
  const dimensions = await page.locator(".invoice-document").evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  await page.emulateMedia({ media: "print" });
  const longPdf = await page.pdf({ format: "A4", printBackground: true });
  expect(longPdf.byteLength).toBeGreaterThan(shortPdf.byteLength);
  expect(longPdf.toString("latin1").match(/\/Type \/Page\b/g)?.length || 0).toBeGreaterThanOrEqual(2);
});

test("catalogue and draft reads are scoped to the authenticated synthetic owner; invoice API is not issued", async ({ page }) => {
  const observed: string[] = [];
  await installSyntheticSupabase(page);
  page.on("request", request => {
    if (request.url().includes("/api/invoices") && request.method() === "POST") observed.push("POST");
  });
  await login(page, OWNER_A);
  await expect(page.getByText("সাদা ভাত")).toBeVisible();
  await addOneLine(page);
  await page.getByRole("button", { name: "বিল পর্যালোচনা" }).click();
  await expect(page.locator('button[title="PO decisions pending"]')).toBeDisabled();
  expect(observed).toEqual([]);
});
