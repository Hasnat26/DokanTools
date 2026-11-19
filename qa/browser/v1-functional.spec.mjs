import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const baseURL = process.env.DOKANTOOLS_QA_URL;
const email = process.env.DOKANTOOLS_QA_EMAIL;
const password = process.env.DOKANTOOLS_QA_PASSWORD;
const pdfPath = process.env.DOKANTOOLS_A6_PDF_OUTPUT || "artifacts/dokantools-authenticated-a6.pdf";
const shopName = "DokanTools V1 QA Shop";
const categoryName = "QA Category";
const renamedCategory = "QA Category Edited";
const productName = "QA Product";
const editedProduct = "QA Product Edited";

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" });

if (!baseURL || !email || !password) {
  throw new Error("CH4_CONFIGURATION_ERROR: DOKANTOOLS_QA_URL, DOKANTOOLS_QA_EMAIL and DOKANTOOLS_QA_PASSWORD are mandatory; browser QA must never silently skip.");
}

test("authenticated V1 Shop Profile, catalogue, IndexedDB Draft Memo and fresh A6 PDF", async ({ page }) => {
  test.setTimeout(120_000);
  const diagnostics = [];
  const categoryRegion = page.getByRole("region", { name: "ক্যাটাগরি ব্যবস্থাপনা" });
  page.on("console", message => { if (message.type() === "error") diagnostics.push({ type: "console", text: message.text() }); });
  page.on("pageerror", error => diagnostics.push({ type: "pageerror", text: error.message }));
  page.on("requestfailed", request => diagnostics.push({ type: "requestfailed", url: request.url(), error: request.failure()?.errorText }));

  try {
    await test.step("1. Authenticate synthetic owner account", async () => {
      await page.goto(new URL("/login", baseURL).toString());
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: "লগইন" }).click();
      await expect(page).toHaveURL(/\/dashboard(?:$|[/?#])/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "আপনার দোকান তৈরি করুন" })).toBeVisible();
    });

    await test.step("2. Create Shop Profile and verify edit/reload persistence", async () => {
      await page.getByLabel("দোকানের নাম *").fill(shopName);
      await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner");
      await page.getByLabel("দোকানের ফোন").fill("01000000000");
      await page.getByLabel("ঠিকানা").fill("Isolated local QA");
      await page.getByRole("button", { name: "দোকান তৈরি করুন" }).click();
      await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
      await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
      await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner Edited");
      await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
      await expect(page.getByText("Synthetic QA Owner Edited")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
      await expect(page.getByText("Synthetic QA Owner Edited")).toBeVisible();
    });

    await test.step("3. Category CRUD and product catalogue CRUD (no stock operations)", async () => {
      await page.goto(new URL("/dashboard/stock", baseURL).toString());
      await expect(page.getByRole("heading", { name: "পণ্য ও ক্যাটাগরি" })).toBeVisible();
      const categoryInput = page.getByPlaceholder("নতুন ক্যাটাগরির নাম");
      await expect(categoryInput).toBeVisible({ timeout: 20_000 });
      await categoryInput.fill(categoryName);
      await page.getByRole("button", { name: "ক্যাটাগরি যোগ করুন" }).click();
      await expect(categoryRegion.getByRole("button", { name: `${categoryName} rename` })).toBeVisible();
      page.once("dialog", dialog => dialog.accept(renamedCategory));
      await page.getByRole("button", { name: `${categoryName} rename` }).click();
      await expect(categoryRegion.getByRole("button", { name: `${renamedCategory} rename` })).toBeVisible();
      await page.reload();
      await expect(categoryRegion.getByRole("button", { name: `${renamedCategory} rename` })).toBeVisible();

      const productForm = page.getByRole("form", { name: "পণ্য তৈরি" });
      await productForm.getByLabel("নতুন পণ্যের নাম").fill(productName);
      const categorySelect = productForm.getByLabel("ক্যাটাগরি");
      await categorySelect.selectOption({ label: renamedCategory });
      const selectedCategoryId = await categorySelect.inputValue();
      expect(selectedCategoryId).toBeTruthy();
      await productForm.getByLabel("ইউনিট").fill("pcs");
      await productForm.getByLabel("ক্রয়মূল্য", { exact: true }).fill("8.00");
      await productForm.getByLabel("বিক্রয়মূল্য", { exact: true }).fill("12.50");
      await productForm.getByRole("button", { name: "Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)" }).click();
      const productNameInput = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(productNameInput).toBeVisible();
      const productRow = productNameInput.locator("xpath=../..");
      await expect(productRow.getByLabel("ক্যাটাগরি", { exact: true })).toHaveValue(selectedCategoryId);
      await productRow.getByLabel("পণ্যের নাম", { exact: true }).fill(editedProduct);
      await productRow.getByRole("button", { name: "সেভ" }).click();
      await expect(productRow.getByLabel("পণ্যের নাম", { exact: true })).toHaveValue(editedProduct);
      await page.reload();
      await expect(categoryRegion.getByRole("button", { name: `${renamedCategory} rename` })).toBeVisible();
      const reloadedProductInput = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(reloadedProductInput).toHaveValue(editedProduct);
      const reloadedProductRow = reloadedProductInput.locator("xpath=../..");
      await expect(reloadedProductRow.getByLabel("ক্যাটাগরি", { exact: true })).toHaveValue(selectedCategoryId);
    });

    await test.step("4. Draft Memo calculation and IndexedDB save/reload/edit persistence", async () => {
      await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
      await expect(page.getByRole("heading", { name: "Draft Memo · A6" })).toBeVisible();
      const productOption = page.locator("select").first().locator("option").filter({ hasText: editedProduct });
      await expect(productOption).toHaveCount(1);
      const productId = await productOption.getAttribute("value");
      expect(productId).toBeTruthy();
      await page.locator("select").first().selectOption(productId);
      await page.getByLabel("Quantity").fill("2");
      await page.getByLabel("Unit price snapshot").fill("12.50");
      await expect(page.getByText("৳ 25.00")).toBeVisible();
      await page.getByRole("button", { name: "Save / Update Draft" }).click();
      await expect(page.getByText("Saved locally")).toBeVisible();
      await page.reload();
      await expect(page.getByText("1 lines")).toBeVisible();
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel("Quantity").fill("3");
      await expect(page.getByText("৳ 37.50")).toBeVisible();
      await page.getByRole("button", { name: "Save / Update Draft" }).click();
      await expect(page.getByText("Saved locally")).toBeVisible();
      await page.reload();
      await expect(page.getByText("1 lines")).toBeVisible();
      await page.getByRole("button", { name: "Edit" }).click();
      await expect(page.getByLabel("Quantity")).toHaveValue("3");
      await expect(page.getByText("৳ 37.50")).toBeVisible();
    });

    await test.step("5. Invoke application print handler and generate fresh A6 PDF", async () => {
      await page.evaluate(() => {
        window.__dokantoolsPrintCalled = false;
        window.print = () => { window.__dokantoolsPrintCalled = true; };
      });
      await page.getByRole("button", { name: "A6 Print / PDF" }).click();
      await expect.poll(() => page.evaluate(() => window.__dokantoolsPrintCalled), { timeout: 10_000 })
        .toBe(true);
      await mkdir(dirname(pdfPath), { recursive: true });
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true, scale: 1 });
      await page.emulateMedia({ media: "screen" });
      await writeFile("artifacts/dokantools-a6-expectations.json", JSON.stringify({
        shopName, productName: editedProduct, quantity: "3", unit: "pcs",
        unitPrice: "12.50", lineTotal: "37.50", grandTotal: "37.50",
        draftLabel: "Draft only", currency: "BDT",
      }, null, 2));
    });

    await test.step("6. Delete local draft and verify catalogue/category delete semantics", async () => {
      page.once("dialog", dialog => dialog.accept());
      await page.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByText("No drafts saved.")).toBeVisible();
      await page.goto(new URL("/dashboard/stock", baseURL).toString());
      const finalProductNameInput = page.getByLabel("পণ্যের নাম", { exact: true });
      await expect(finalProductNameInput).toHaveValue(editedProduct);
      page.once("dialog", dialog => dialog.accept());
      await categoryRegion.getByRole("button", { name: `${renamedCategory} delete` }).click();
      await expect(categoryRegion.getByRole("button", { name: `${renamedCategory} rename` })).toHaveCount(0);
      const finalProductRow = finalProductNameInput.locator("xpath=../..");
      await expect(finalProductRow.getByLabel("ক্যাটাগরি", { exact: true })).toHaveValue("");
      page.once("dialog", dialog => dialog.accept());
      await finalProductRow.getByRole("button", { name: "মুছুন" }).click();
      await expect(page.getByLabel("পণ্যের নাম", { exact: true })).toHaveCount(0);
    });
  } catch (error) {
    const body = await page.locator("body").innerText().catch(() => "Unable to read page body");
    await test.info().attach("browser-diagnostics.json", {
      body: JSON.stringify({ url: page.url(), title: await page.title().catch(() => ""), body, diagnostics }, null, 2),
      contentType: "application/json",
    });
    throw error;
  }
});
