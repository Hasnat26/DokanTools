import { test, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
const baseURL = process.env.DOKANTOOLS_QA_URL,
  email = process.env.DOKANTOOLS_QA_EMAIL,
  password = process.env.DOKANTOOLS_QA_PASSWORD,
  email2 = process.env.DOKANTOOLS_QA_EMAIL_2,
  password2 = process.env.DOKANTOOLS_QA_PASSWORD_2,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const pdfPath =
  process.env.DOKANTOOLS_A6_PDF_OUTPUT ||
  "artifacts/dokantools-authenticated-a6.pdf";
const shopName = "DokanTools QA Grocery & Stationery",
  categoryName = "QA Category",
  renamedCategory = "QA Category Edited";
const mapUrl = "https://maps.google.com/?q=23.7806,90.4142";
let shopPublicPath = "";
async function pngBuffer(page, color) {
  const base64 = await page.evaluate((color) => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 72;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111";
    context.lineWidth = 4;
    context.strokeRect(2, 2, 92, 68);
    context.beginPath();
    context.arc(34, 36, 25, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.fillStyle = "#fff";
    context.font = "bold 18px Arial";
    context.textAlign = "center";
    context.fillText("QA", 34, 42);
    context.fillStyle = "#111";
    context.font = "bold 11px Arial";
    context.fillText("DOKAN", 68, 33);
    context.font = "9px Arial";
    context.fillText("SHOP", 68, 46);
    return canvas.toDataURL("image/png").split(",")[1];
  }, color);
  return Buffer.from(base64, "base64");
}
async function decodeBillQr(page, path) {
  await mkdir(dirname(path), { recursive: true });
  const section = page.locator(".memo-print");
  await section.evaluate((el) => {
    el.style.visibility = "visible";
    el.style.position = "static";
    el.style.left = "auto";
    el.style.top = "auto";
    el.style.width = "98mm";
    el.style.height = "auto";
    el.style.overflow = "visible";
  });
  const qr = page.getByTestId("shop-bill-qr");
  await qr.evaluate((el) => {
    el.style.width = "240px";
    el.style.height = "240px";
  });
  await qr.screenshot({ path });
  const payload = execFileSync("zbarimg", ["--quiet", "--raw", path], {
    encoding: "utf8",
  }).trim();
  await section.evaluate((el) => {
    el.removeAttribute("style");
    el.querySelector("[data-testid=shop-bill-qr]")?.removeAttribute("style");
  });
  return payload;
}

const firstProduct = "QA Product Edited",
  secondProduct = "QA Product Two";
test.use({
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
  video: "retain-on-failure",
});
if (!baseURL || !email || !password || !email2 || !password2 || !supabaseUrl || !anonKey)
  throw new Error(
    "CH4_CONFIGURATION_ERROR: both synthetic Auth identities, Supabase URL/key and QA URL are mandatory.",
  );

test("local invoice workspace persists and calculates offline without Supabase", async ({ page }) => {
  test.setTimeout(60000);
  const forbiddenRequests = [];
  page.on("request", request => {
    const url = request.url();
    if (url.includes("/api/invoices") || url.includes("supabase.co") || url.includes(":54321")) forbiddenRequests.push(url);
  });
  await page.goto(new URL("/local-invoice/", baseURL).toString());
  await expect(page.getByRole("heading", { name: "Local Invoice Workspace" })).toBeVisible();
  await page.getByLabel("Shop name").fill("Local-Only QA Shop");
  await page.getByLabel("Address").fill("Local address");
  await page.getByLabel("Phone").fill("01700000000");
  await page.getByRole("button", { name: "Save shop profile locally" }).click();
  await page.getByLabel("Customer name").fill("Local QA Customer");
  await page.getByLabel("Customer phone").fill("01800000000");
  await page.getByLabel("Item").fill("Offline QA Product");
  await page.getByLabel("Unit").fill("pcs");
  await page.getByLabel("Quantity").fill("2");
  await page.getByLabel("Unit price (BDT)").fill("15.50");
  await expect(page.getByText("Total", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("BDT 31.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save draft locally" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved locally in IndexedDB");
  await page.reload();
  await expect(page.getByText("Local QA Customer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await expect(page.getByLabel("Item")).toHaveValue("Offline QA Product");
  await expect(page.getByLabel("Quantity")).toHaveValue("2");
  await page.getByRole("button", { name: "Generate A6 PDF" }).click();
  await expect(page.getByRole("status")).toContainText("A6 PDF generated in this browser");
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const pdf = await pdfDownload;
  const path = await pdf.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");

  // Wait until the PWA service worker controls the page, then reload offline.
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), { timeout: 10000 });
  await page.reload();
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Local Invoice Workspace" })).toBeVisible();
  await expect(page.getByLabel("Item")).toHaveValue("Offline QA Product");
  await page.getByLabel("Quantity").fill("3");
  await expect(page.getByText("BDT 46.50", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Generate A6 PDF" }).click();
  await expect(page.getByRole("status")).toContainText("A6 PDF generated in this browser");
  const offlineDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const offlinePdf = await offlineDownload;
  expect((await readFile(await offlinePdf.path())).subarray(0, 5).toString("ascii")).toBe("%PDF-");
  await page.context().setOffline(false);
  expect(forbiddenRequests).toEqual([]);

  // A separate browser context has a separate IndexedDB namespace/workspace.
  const browser = page.context().browser();
  const isolatedContext = await browser.newContext();
  const isolatedPage = await isolatedContext.newPage();
  await isolatedPage.goto(new URL("/local-invoice/", baseURL).toString());
  await expect(isolatedPage.getByRole("heading", { name: "Local Invoice Workspace" })).toBeVisible();
  await expect(isolatedPage.getByText("No local drafts yet.", { exact: true })).toBeVisible();
  await isolatedContext.close();
});

test("authenticated configurable multi-product bill, IndexedDB lifecycle and fresh A6 PDF", async ({
  page,
}) => {
  test.setTimeout(180000);
  const diagnostics = [];
  const categoryRegion = page.getByRole("region", {
    name: "ক্যাটাগরি ব্যবস্থাপনা",
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      diagnostics.push({ type: "console", text: message.text() });
  });
  page.on("pageerror", (error) =>
    diagnostics.push({ type: "pageerror", text: error.message }),
  );
  page.on("requestfailed", (request) =>
    diagnostics.push({
      type: "requestfailed",
      url: request.url(),
      error: request.failure()?.errorText,
    }),
  );
  const total = (name, value) =>
    expect(page.getByTestId(name)).toHaveText(
      name === "discount" ? `− BDT ${value}` : `BDT ${value}`,
    );
  try {
    await test.step("1. Authenticate synthetic owner", async () => {
      await page.goto(new URL("/login", baseURL).toString());
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: "লগইন" }).click();
      await expect(page).toHaveURL(/\/dashboard(?:$|[/?#])/);
      await expect(
        page.getByRole("heading", { name: "আপনার দোকান তৈরি করুন" }),
      ).toBeVisible();
    });
    await test.step("2. Shop Profile create/edit/reload, logo lifecycle, Maps validation and QR authorization", async () => {
      await page.getByLabel("দোকানের নাম *").fill(shopName);
      await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner");
      await page.getByLabel("দোকানের ফোন").fill("01000000000");
      await page
        .getByLabel("ঠিকানা")
        .fill(
          "Shop 7, Ground Floor, Road 12, Block C, Gulshan-1, Dhaka 1212, Bangladesh",
        );
      const mapInput = page.getByLabel("Google Maps লিংক");
      await mapInput.fill("https://maps.example.invalid/shop");
      await page.getByRole("button", { name: "দোকান তৈরি করুন" }).click();
      await expect(
        page.getByText("Enter a valid Google Maps URL.", { exact: true }),
      ).toBeVisible();
      await mapInput.fill(mapUrl);
      await page.getByRole("button", { name: "দোকান তৈরি করুন" }).click();
      await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
      shopPublicPath = await page
        .locator('a[href^="/shop?shopId="]')
        .first()
        .getAttribute("href");
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute(
        "src",
        /^data:image\/svg\+xml/,
      );
      const upload = page.getByLabel("Shop logo upload");
      await upload.setInputFiles({
        name: "logo-original.png",
        mimeType: "image/png",
        buffer: await pngBuffer(page, "#222222"),
      });
      await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute(
        "src",
        /^data:image\/png;base64,/,
      );
      const firstLogo = await page
        .getByTestId("shop-logo-preview")
        .getAttribute("src");
      await upload.setInputFiles({
        name: "logo-replacement.png",
        mimeType: "image/png",
        buffer: await pngBuffer(page, "#555555"),
      });
      await expect(page.getByTestId("shop-logo-preview")).not.toHaveAttribute(
        "src",
        firstLogo,
      );
      await page.getByRole("button", { name: "Remove uploaded logo" }).click();
      await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute(
        "src",
        /^data:image\/svg\+xml/,
      );
      await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner Edited");
      await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
      await expect(page.getByText("Synthetic QA Owner Edited")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
      await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
      await expect(page.getByTestId("bill-shop-logo")).toHaveAttribute(
        "src",
        /^data:image\/svg\+xml/,
      );
      await page.goto(new URL("/dashboard", baseURL).toString());
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await expect(page.getByLabel("Google Maps লিংক")).toHaveValue(mapUrl);
      await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute(
        "src",
        /^data:image\/svg\+xml/,
      );
      await page.getByLabel("Shop logo upload").setInputFiles({
        name: "logo-final.png",
        mimeType: "image/png",
        buffer: await pngBuffer(page, "#333333"),
      });
      await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
      await page.reload();
      await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await expect(page.getByLabel("Google Maps লিংক")).toHaveValue(mapUrl);
      await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute(
        "src",
        /^data:image\/png;base64,/,
      );
      await page.getByRole("button", { name: "বাতিল" }).click();
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await page.getByLabel("Google Maps লিংক").fill("");
      await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
      await page
        .getByRole("button", { name: "পাবলিক পেজ প্রকাশ করুন" })
        .click();
      await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
      await expect(page.getByTestId("shop-bill-qr")).toBeAttached();
      const publicPayload = await decodeBillQr(
        page,
        "artifacts/shop-public-profile-qr.png",
      );
      expect(shopPublicPath).toBeTruthy();
      expect(publicPayload).toBe(new URL(shopPublicPath, baseURL).toString());
      await page.goto(new URL("/dashboard", baseURL).toString());
      await page.getByRole("button", { name: "পাবলিক পেজ বন্ধ করুন" }).click();
      await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
      await expect(page.getByTestId("shop-bill-qr")).toHaveCount(0);
      await page.goto(new URL("/dashboard", baseURL).toString());
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await page.getByLabel("Google Maps লিংক").fill(mapUrl);
      await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
    });
    let selectedCategoryId = "";
    await test.step("3. Category create, rename, persistence and two product CRUD/association", async () => {
      await page.goto(new URL("/dashboard/catalog", baseURL).toString());
      await expect(
        page.getByRole("heading", { name: "পণ্য ও ক্যাটাগরি" }),
      ).toBeVisible();
      const categoryInput = page.getByPlaceholder("নতুন ক্যাটাগরির নাম");
      await categoryInput.fill(categoryName);
      await page.getByRole("button", { name: "ক্যাটাগরি যোগ করুন" }).click();
      await expect(
        categoryRegion.getByRole("button", { name: `${categoryName} rename` }),
      ).toBeVisible();
      page.once("dialog", (dialog) => dialog.accept(renamedCategory));
      await categoryRegion
        .getByRole("button", { name: `${categoryName} rename` })
        .click();
      await expect(
        categoryRegion.getByRole("button", {
          name: `${renamedCategory} rename`,
        }),
      ).toBeVisible();
      await page.reload();
      await expect(
        categoryRegion.getByRole("button", {
          name: `${renamedCategory} rename`,
        }),
      ).toBeVisible();
      const form = page.getByRole("form", { name: "পণ্য তৈরি" }),
        categorySelect = form.getByLabel("ক্যাটাগরি");
      await form.getByLabel("নতুন পণ্যের নাম").fill("QA Product");
      await categorySelect.selectOption({ label: renamedCategory });
      selectedCategoryId = await categorySelect.inputValue();
      await form.getByLabel("ইউনিট").fill("pcs");
      await form.getByLabel("ক্রয়মূল্য", { exact: true }).fill("8.00");
      await form.getByLabel("বিক্রয়মূল্য", { exact: true }).fill("12.50");
      await form
        .getByRole("button", {
          name: "Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)",
        })
        .click();
      let inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(inputs).toHaveCount(1);
      let row = inputs.nth(0).locator("xpath=../..");
      await row.getByLabel("পণ্যের নাম", { exact: true }).fill(firstProduct);
      await row.getByRole("button", { name: "সেভ" }).click();
      await form.getByLabel("নতুন পণ্যের নাম").fill(secondProduct);
      await categorySelect.selectOption({ label: renamedCategory });
      await form.getByLabel("ইউনিট").fill("pcs");
      await form.getByLabel("ক্রয়মূল্য", { exact: true }).fill("2.00");
      await form.getByLabel("বিক্রয়মূল্য", { exact: true }).fill("4.25");
      await form
        .getByRole("button", {
          name: "Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)",
        })
        .click();
      inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(inputs).toHaveCount(2);
      row = inputs.nth(1).locator("xpath=../..");
      await expect(row.getByLabel("ক্যাটাগরি", { exact: true })).toHaveValue(
        selectedCategoryId,
      );
      await page.reload();
      await expect(
        categoryRegion.getByRole("button", {
          name: `${renamedCategory} rename`,
        }),
      ).toBeVisible();
      inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(inputs).toHaveCount(2);
      await expect(inputs.nth(0)).toHaveValue(firstProduct);
      await expect(inputs.nth(1)).toHaveValue(secondProduct);
      await expect(
        inputs
          .nth(0)
          .locator("xpath=../..")
          .getByLabel("ক্যাটাগরি", { exact: true }),
      ).toHaveValue(selectedCategoryId);
      await expect(
        inputs
          .nth(1)
          .locator("xpath=../..")
          .getByLabel("ক্যাটাগরি", { exact: true }),
      ).toHaveValue(selectedCategoryId);

      await test.step("3b. Real Supabase Auth → PostgREST → RLS two-user tenant isolation", async () => {
        const signIn = async (userEmail, userPassword) => {
          const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { apikey: anonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, password: userPassword }),
          });
          expect(response.ok, `Auth sign-in failed: ${response.status}`).toBe(true);
          return (await response.json()).access_token;
        };
        const ownerToken = await signIn(email, password);
        const otherToken = await signIn(email2, password2);
        const headers = token => ({
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        });
        const ownerShopResponse = await fetch(
          `${supabaseUrl}/rest/v1/shops?select=id&order=created_at.asc&limit=1`,
          { headers: headers(ownerToken) },
        );
        expect(ownerShopResponse.ok).toBe(true);
        const ownerShop = (await ownerShopResponse.json())[0];
        expect(ownerShop?.id).toBeTruthy();
        const ownerCategoryResponse = await fetch(
          `${supabaseUrl}/rest/v1/item_categories?select=id,shop_id&shop_id=eq.${ownerShop.id}&name=eq.${encodeURIComponent(renamedCategory)}`,
          { headers: headers(ownerToken) },
        );
        expect(ownerCategoryResponse.ok).toBe(true);
        const ownerCategory = (await ownerCategoryResponse.json())[0];
        expect(ownerCategory?.id).toBeTruthy();
        expect(ownerCategory.shop_id).toBe(ownerShop.id);
        const categoryUrl = `${supabaseUrl}/rest/v1/item_categories?id=eq.${ownerCategory.id}`;
        const otherRead = await fetch(categoryUrl, { headers: headers(otherToken) });
        expect(otherRead.ok).toBe(true);
        expect(await otherRead.json()).toEqual([]);
        const otherInsert = await fetch(`${supabaseUrl}/rest/v1/item_categories`, {
          method: "POST",
          headers: { ...headers(otherToken), Prefer: "return=minimal" },
          body: JSON.stringify({ shop_id: ownerShop.id, name: "Cross Tenant Inject", sort_order: 0 }),
        });
        expect(otherInsert.status, "cross-tenant insert must be rejected by RLS").toBeGreaterThanOrEqual(400);
        const otherUpdate = await fetch(categoryUrl, {
          method: "PATCH",
          headers: headers(otherToken),
          body: JSON.stringify({ name: "Cross Tenant Rename" }),
        });
        expect(otherUpdate.ok).toBe(true);
        expect(await otherUpdate.json()).toEqual([]);
        const otherDelete = await fetch(categoryUrl, { method: "DELETE", headers: headers(otherToken) });
        expect(otherDelete.ok).toBe(true);
        expect(await otherDelete.json()).toEqual([]);
        const ownerStillReads = await fetch(categoryUrl, { headers: headers(ownerToken) });
        expect(ownerStillReads.ok).toBe(true);
        expect((await ownerStillReads.json()).length).toBe(1);
      });

      // Create a real inventory link through the preserved stock screen, then
      // exercise the blocked catalogue rename/delete path end-to-end.
      await page.goto(new URL("/dashboard/stock", baseURL).toString());
      const stockForm = page.locator("form").first();
      // This legacy form's visible labels are not programmatically associated;
      // use stable field order within the scoped form rather than ambiguous page labels.
      const stockFields = stockForm.locator("input, select");
      await stockFields.nth(0).fill(firstProduct);
      await stockFields.nth(1).selectOption("pcs");
      await stockFields.nth(2).fill("8.00");
      await stockFields.nth(3).fill("12.50");
      await stockFields.nth(4).fill("1");
      await stockForm
        .getByRole("button", { name: "পণ্য ও স্টক সেভ করুন" })
        .click();
      await expect(
        page.getByText(firstProduct, { exact: false }).first(),
      ).toBeVisible();
      await page.goto(new URL("/dashboard/catalog", baseURL).toString());
      inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      row = inputs.nth(0).locator("xpath=../..");
      await row
        .getByLabel("পণ্যের নাম", { exact: true })
        .fill("QA Product Renamed Blocked");
      await row.getByRole("button", { name: "সেভ" }).click();
      await expect(page.locator('p[role="alert"]')).toContainText(
        "Inventory-linked product name cannot be changed",
      );
      await row.getByLabel("পণ্যের নাম", { exact: true }).fill(firstProduct);
      await row.getByRole("button", { name: "মুছুন" }).click();
      await expect(page.locator('p[role="alert"]')).toContainText(
        "স্টকের সঙ্গে যুক্ত",
      );
    });
    await test.step("4. Multi-product calculation and optional discount/tax/paid/due", async () => {
      await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
      await expect(
        page.getByRole("heading", { name: "Bill / Memo · A6" }),
      ).toBeVisible();
      const select = page.getByLabel("Add catalogue product");
      const opts = select.locator("option");
      const firstId = await opts
        .filter({ hasText: firstProduct })
        .getAttribute("value");
      const secondId = await opts
        .filter({ hasText: secondProduct })
        .getAttribute("value");
      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      await select.selectOption(firstId);
      await select.selectOption(secondId);
      await expect(page.getByTestId("bill-line")).toHaveCount(2);
      await page.getByLabel("Quantity").nth(0).fill("2");
      await page.getByLabel("Unit price").nth(0).fill("12.50");
      await page.getByLabel("Quantity").nth(1).fill("2");
      await page.getByLabel("Unit price").nth(1).fill("4.25");
      await total("subtotal", "33.50");
      await total("grand-total", "33.50");
      await expect(page.getByLabel("Discount amount")).toHaveCount(0);
      await expect(page.getByLabel("Tax rate")).toHaveCount(0);
      await expect(page.getByLabel("Amount paid")).toHaveCount(0);
      await page.getByLabel("Enable discount").check();
      await total("discount", "0.00");
      await page.getByLabel("Discount amount").fill("0.00");
      await total("grand-total", "33.50");
      await page.getByLabel("Discount amount").fill("33.50");
      await expect(
        page.getByText(
          "A full-subtotal discount is not permitted on this bill.",
        ),
      ).toBeVisible();
      await page.getByLabel("Discount amount").fill("99.00");
      await expect(
        page.getByText("Discount cannot exceed the subtotal."),
      ).toBeVisible();
      await page.getByLabel("Discount amount").fill("1.00");
      await total("discount", "1.00");
      await total("grand-total", "32.50");
      await page.getByLabel("Enable discount").uncheck();
      await total("grand-total", "33.50");
      await page.getByLabel("Enable discount").check();
      await total("discount", "1.00");
      await page.getByLabel("Enable VAT or tax").check();
      await page.getByLabel("Tax rate").fill("0.00");
      await total("tax", "0.00");
      await total("grand-total", "32.50");
      await page.getByLabel("Tax rate").fill("-1");
      await expect(
        page.getByText(
          "Tax rate must be non-negative and use up to 2 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Tax rate").fill("10.00");
      await total("tax", "3.25");
      await total("grand-total", "35.75");
      await page.getByLabel("Enable VAT or tax").uncheck();
      await total("grand-total", "32.50");
      await page.getByLabel("Enable VAT or tax").check();
      await total("tax", "3.25");
      await page.getByLabel("Enable paid and due").check();
      await page.getByLabel("Amount paid").fill("0.00");
      await total("paid", "0.00");
      await total("due", "35.75");
      await page.getByLabel("Amount paid").fill("99.00");
      await expect(
        page.getByText("Paid amount cannot exceed the grand total."),
      ).toBeVisible();
      await page.getByLabel("Amount paid").fill("-1");
      await expect(
        page.getByText(
          "Paid amount must be non-negative and use up to 2 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Amount paid").fill("20.00");
      await total("paid", "20.00");
      await total("due", "15.75");
      await page.getByLabel("Enable paid and due").uncheck();
      await total("grand-total", "35.75");
      await page.getByLabel("Enable paid and due").check();
      await total("due", "15.75");
      await page.getByLabel("Quantity").nth(0).fill("0");
      await expect(
        page.getByText(
          "Quantity must be greater than zero and use up to 3 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Quantity").nth(0).fill("1.0001");
      await expect(
        page.getByText(
          "Quantity must be greater than zero and use up to 3 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Quantity").nth(0).fill("2");
      await page.getByLabel("Unit price").nth(1).fill("-1");
      await expect(
        page.getByText(
          "Unit price must be zero or greater and use up to 2 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Unit price").nth(1).fill("1.999");
      await expect(
        page.getByText(
          "Unit price must be zero or greater and use up to 2 decimal places.",
        ),
      ).toBeVisible();
      await page.getByLabel("Unit price").nth(1).fill("5.00");
      await page.getByLabel("Quantity").nth(0).fill("3");
      await total("subtotal", "47.50");
      await total("discount", "1.00");
      await total("tax", "4.65");
      await total("grand-total", "51.15");
      await total("paid", "20.00");
      await total("due", "31.15");
      await page.getByRole("button", { name: "Save / Update Draft" }).click();
      await expect(page.getByText("Draft saved locally.")).toBeVisible();
      await page.reload();
      await expect(page.getByText("2 products")).toBeVisible();
      await page.getByRole("button", { name: "Edit" }).click();
      await expect(page.getByLabel("Enable discount")).toBeChecked();
      await expect(page.getByLabel("Discount amount")).toHaveValue("1.00");
      await expect(page.getByLabel("Enable VAT or tax")).toBeChecked();
      await expect(page.getByLabel("Tax rate")).toHaveValue("10.00");
      await expect(page.getByLabel("Enable paid and due")).toBeChecked();
      await expect(page.getByLabel("Amount paid")).toHaveValue("20.00");
      await expect(page.getByLabel("Quantity").nth(0)).toHaveValue("3");
      await expect(page.getByLabel("Unit price").nth(1)).toHaveValue("5.00");
      await total("subtotal", "47.50");
      await total("grand-total", "51.15");
      await total("due", "31.15");
      await page.getByRole("button", { name: "Save / Update Draft" }).click();
      await expect(page.getByText("Draft saved locally.")).toBeVisible();
      await page.reload();
      await page.getByRole("button", { name: "Edit" }).click();
      await total("grand-total", "51.15");
      await total("due", "31.15");
    });
    await test.step("5. Verify centered identity hierarchy, logo, Maps link and decoded QR", async () => {
      await expect(page.getByTestId("bill-shop-logo")).toHaveAttribute(
        "src",
        /^data:image\/png;base64,/,
      );
      await expect(page.getByTestId("bill-shop-name")).toHaveText(shopName);
      const typography = await page
        .locator(".shop-identity")
        .evaluate((header) => ({
          alignment: getComputedStyle(header).textAlign,
          nameWeight: getComputedStyle(header.querySelector("h1")).fontWeight,
          otherWeight: getComputedStyle(header.querySelector("p")).fontWeight,
        }));
      const billTitleAlignment = await page
        .locator(".memo-print h2")
        .evaluate((title) => getComputedStyle(title).textAlign);
      expect(typography.alignment).toBe("center");
      expect(Number(typography.nameWeight)).toBeGreaterThanOrEqual(600);
      expect(Number(typography.otherWeight)).toBeLessThanOrEqual(400);
      expect(billTitleAlignment).toBe("center");
      await expect(page.locator(".shop-map a")).toHaveAttribute("href", mapUrl);
      await expect(page.getByTestId("shop-bill-qr")).toBeAttached();
      const decoded = await decodeBillQr(page, "artifacts/shop-map-qr.png");
      expect(decoded).toBe(mapUrl);
    });
    await test.step("6. Invoke application print handler and generate fresh A6 PDF", async () => {
      await page.evaluate(() => {
        window.__dokantoolsPrintCalled = false;
        window.print = () => {
          window.__dokantoolsPrintCalled = true;
        };
      });
      await page
        .getByRole("button", { name: "Print A6" })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__dokantoolsPrintCalled), {
          timeout: 10000,
        })
        .toBe(true);
      await test.step("6a. Generated PDF download and Web Share fallback", async () => {
        await page.getByRole("button", { name: "Generate PDF", exact: true }).click();
        await expect(page.getByRole("status")).toContainText("PDF ready");
        // P2 regression: removing a line invalidates the prior PDF for both Download and Share.
        await page.getByTestId("bill-line").nth(1).getByRole("button", { name: "Remove" }).click();
        await expect(page.getByTestId("bill-line")).toHaveCount(1);
        await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Share PDF", exact: true })).toBeDisabled();
        await total("grand-total", "40.15");
        await page.getByRole("button", { name: "Generate PDF", exact: true }).click();
        await expect(page.getByRole("status")).toContainText("PDF ready");
        const updatedDownloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download PDF", exact: true }).click();
        const updatedDownload = await updatedDownloadPromise;
        const updatedPdfPath = await updatedDownload.path();
        expect(updatedPdfPath).toBeTruthy();
        const updatedPdfText = execFileSync("pdftotext", [updatedPdfPath, "-"], { encoding: "utf8" });
        expect(updatedPdfText).toContain(firstProduct);
        expect(updatedPdfText).not.toContain(secondProduct);
        expect(updatedPdfText).toContain("40.15");
        // Restore the second line and ensure add/edit mutations invalidate the replacement PDF too.
        const productSelect = page.getByLabel("Add catalogue product");
        const secondOptionValue = await productSelect.locator("option").filter({ hasText: secondProduct }).getAttribute("value");
        expect(secondOptionValue).toBeTruthy();
        await productSelect.selectOption(secondOptionValue);
        await page.getByLabel("Quantity").nth(1).fill("2");
        await page.getByLabel("Unit price").nth(1).fill("5.00");
        await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Share PDF", exact: true })).toBeDisabled();
        await page.getByRole("button", { name: "Generate PDF", exact: true }).click();
        await expect(page.getByRole("status")).toContainText("PDF ready");
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download PDF", exact: true }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        const downloadedPath = await download.path();
        expect(downloadedPath).toBeTruthy();
        const downloadedBytes = await readFile(downloadedPath);
        expect(downloadedBytes.byteLength).toBeGreaterThan(1000);
        expect(downloadedBytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
        const downloadedSha256 = createHash("sha256").update(downloadedBytes).digest("hex");
        await page.evaluate(() => {
          Object.defineProperty(navigator, "canShare", { configurable: true, value: payload => !!payload?.files?.length });
          Object.defineProperty(navigator, "share", { configurable: true, value: async payload => { window.__nativeSharePayload = payload; } });
        });
        await page.getByRole("button", { name: "Share PDF", exact: true }).click();
        await expect(page.getByRole("status")).toContainText("Share sheet opened");
        const shared = await page.evaluate(async () => { const file = window.__nativeSharePayload.files[0]; const bytes = new Uint8Array(await file.arrayBuffer()); return { type:file.type, signature:new TextDecoder().decode(bytes.slice(0,5)), bytes:Array.from(bytes) }; });
        expect(shared.type).toBe("application/pdf");
        expect(shared.signature).toBe("%PDF-");
        const sharedBytes = Buffer.from(shared.bytes);
        expect(sharedBytes.byteLength).toBe(downloadedBytes.byteLength);
        expect(createHash("sha256").update(sharedBytes).digest("hex")).toBe(downloadedSha256);
        await page.evaluate(() => Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false }));
        await page.getByRole("button", { name: "Share PDF", exact: true }).click();
        await expect(page.getByRole("status")).toContainText("not supported");
        await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeEnabled();
      });
      await mkdir(dirname(pdfPath), { recursive: true });
      await page.emulateMedia({ media: "screen" });
      await page.locator(".memo-print").evaluate((el) => {
        el.style.visibility = "visible";
        el.style.position = "static";
        el.style.left = "auto";
        el.style.top = "auto";
        el.style.width = "98mm";
        el.style.height = "auto";
        el.style.overflow = "visible";
      });
      await page
        .locator(".memo-print")
        .screenshot({ path: "artifacts/dokantools-bill-header.png" });
      await page
        .locator(".memo-print")
        .evaluate((el) => el.removeAttribute("style"));
      await page.emulateMedia({ media: "print" });
      // Explicit physical page dimensions make the generated acceptance artifact
      // deterministic across Chromium's CSS-page-size rounding. The application's
      // @page rule is still separately asserted by the source-level regression.
      await page.pdf({
        path: pdfPath,
        printBackground: true,
        width: "105mm",
        height: "148mm",
        preferCSSPageSize: false,
        scale: 1,
      });
      await page.emulateMedia({ media: "screen" });
      await writeFile(
        "artifacts/dokantools-a6-expectations.json",
        JSON.stringify(
          {
            shopName,
            ownerName: "Synthetic QA Owner Edited",
            address:
              "Shop 7, Ground Floor, Road 12, Block C, Gulshan-1, Dhaka 1212, Bangladesh",
            phone: "01000000000",
            mapsCaption: "Google Maps location",
            qrCaption: "Scan for shop location",
            qrDestination: mapUrl,
            logoPresent: true,
            qrPresent: true,
            lines: [
              {
                productName: firstProduct,
                quantity: "3",
                unit: "pcs",
                unitPrice: "12.50",
                lineTotal: "37.50",
              },
              {
                productName: secondProduct,
                quantity: "2",
                unit: "pcs",
                unitPrice: "5.00",
                lineTotal: "10.00",
              },
            ],
            subtotal: "47.50",
            discount: "1.00",
            taxRate: "10.00",
            tax: "4.65",
            grandTotal: "51.15",
            paid: "20.00",
            due: "31.15",
            discountEnabled: true,
            taxEnabled: true,
            paidEnabled: true,
            currency: "BDT",
          },
          null,
          2,
        ),
      );
    });
    await test.step("7. Delete saved draft, category and both products", async () => {
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByText("No drafts saved.")).toBeVisible();
      await page.goto(new URL("/dashboard/catalog", baseURL).toString());
      let inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(inputs).toHaveCount(2);
      page.once("dialog", (dialog) => dialog.accept());
      await categoryRegion
        .getByRole("button", { name: `${renamedCategory} delete` })
        .click();
      await expect(
        categoryRegion.getByRole("button", {
          name: `${renamedCategory} rename`,
        }),
      ).toHaveCount(0);
      inputs = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(
        inputs
          .nth(0)
          .locator("xpath=../..")
          .getByLabel("ক্যাটাগরি", { exact: true }),
      ).toHaveValue("");
      const unlinkedRow = page
        .getByLabel("পণ্যের নাম", { exact: true })
        .nth(1)
        .locator("xpath=../..");
      page.once("dialog", (dialog) => dialog.accept());
      await unlinkedRow.getByRole("button", { name: "মুছুন" }).click();
      await expect(page.getByLabel("পণ্যের নাম", { exact: true })).toHaveCount(
        1,
      );
      await expect(
        page.getByLabel("পণ্যের নাম", { exact: true }).first(),
      ).toHaveValue(firstProduct);
    });
    await page.goto(new URL("/dashboard/stock", baseURL).toString());
    await expect(
      page.getByRole("heading", { name: "ইনভেন্টরি ও পণ্য তালিকা" }),
    ).toBeVisible();
    await expect(page.getByText("কম স্টক: ৫ ইউনিটের কম")).toBeVisible();
  } catch (error) {
    const body = await page
      .locator("body")
      .innerText()
      .catch(() => "Unable to read page body");
    await test.info().attach("browser-diagnostics.json", {
      body: JSON.stringify(
        {
          url: page.url(),
          title: await page.title().catch(() => ""),
          body,
          diagnostics,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    throw error;
  }
});


test("local A6 PDF is regenerated after edits and device file sharing is invoked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: payload => Boolean(payload?.files?.length && payload.files[0].type === "application/pdf"),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async payload => {
        if (!payload?.files?.[0]?.name?.endsWith(".pdf")) throw new Error("Expected PDF file");
        window.__dokantoolsSharedFileName = payload.files[0].name;
      },
    });
  });
  await page.goto(new URL("/local-invoice/", baseURL).toString());
  await expect(page.getByRole("heading", { name: "Local Invoice Workspace" })).toBeVisible();
  await page.getByLabel("Customer name").fill("Share QA Customer");
  await page.getByLabel("Item").fill("Share QA Item");
  await page.getByLabel("Unit").fill("pc");
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit price (BDT)").fill("20");
  await page.getByRole("button", { name: "Generate A6 PDF" }).click();
  await expect(page.getByRole("button", { name: "Share PDF" })).toBeEnabled();
  await page.getByRole("button", { name: "Share PDF" }).click();
  await expect(page.getByRole("status")).toContainText("Device share sheet opened");
  expect(await page.evaluate(() => window.__dokantoolsSharedFileName)).toMatch(/\.pdf$/);
  await page.getByLabel("Quantity").fill("2");
  await expect(page.getByRole("button", { name: "Share PDF" })).toBeDisabled();
  await page.getByRole("button", { name: "Generate A6 PDF" }).click();
  await expect(page.getByRole("button", { name: "Share PDF" })).toBeEnabled();
});
