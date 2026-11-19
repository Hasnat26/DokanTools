import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.DOKANTOOLS_QA_URL;
const email = process.env.DOKANTOOLS_QA_EMAIL;
const password = process.env.DOKANTOOLS_QA_PASSWORD;
const pdfPath = process.env.DOKANTOOLS_A6_PDF_OUTPUT || "artifacts/dokantools-authenticated-a6.pdf";

test("authenticated V1 shop, catalogue, IndexedDB draft and A6 PDF workflow", async ({ page }) => {
  test.skip(!baseURL || !email || !password, "Set QA URL and synthetic-account credentials as CI secrets.");
  await page.goto(new URL("/login", baseURL).toString());
  await page.getByLabel("ইমেইল").fill(email!);
  await page.getByLabel("পাসওয়ার্ড").fill(password!);
  await page.getByRole("button", { name: "লগইন" }).click();
  await expect(page).toHaveURL(/dashboard/);

  // The synthetic account must be new and must not already own a shop.
  await expect(page.getByRole("heading", { name: "আপনার দোকান তৈরি করুন" })).toBeVisible();
  const shopName = `V1 QA Shop ${Date.now()}`;
  await page.getByLabel("দোকানের নাম *").fill(shopName);
  await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner");
  await page.getByLabel("দোকানের ফোন").fill("01000000000");
  await page.getByLabel("ঠিকানা").fill("Isolated QA");
  await page.getByRole("button", { name: "দোকান তৈরি করুন" }).click();
  await expect(page.getByRole("heading", { name: shopName })).toBeVisible();

  // Shop Profile edit and persistence after reload.
  await page.getByRole("button", { name: "তথ্য সম্পাদনা" }).click();
  await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner Edited");
  await page.getByRole("button", { name: "পরিবর্তন সংরক্ষণ" }).click();
  await expect(page.getByText("Synthetic QA Owner Edited")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: shopName })).toBeVisible();

  // Catalogue/category CRUD. Do not use stock create/adjust controls.
  await page.goto(new URL("/dashboard/stock", baseURL).toString());
  const category = `QA Category ${Date.now()}`;
  const renamedCategory = `${category} Edited`;
  await page.getByPlaceholder("নতুন ক্যাটাগরির নাম").fill(category);
  await page.getByRole("button", { name: "ক্যাটাগরি যোগ করুন" }).click();
  await expect(page.getByText(category, { exact: true })).toBeVisible();
  page.once("dialog", dialog => dialog.accept(renamedCategory));
  await page.getByRole("button", { name: `${category} rename` }).click();
  await expect(page.getByText(renamedCategory, { exact: true })).toBeVisible();

  const product = `QA Product ${Date.now()}`;
  const editedProduct = `${product} Edited`;
  const categorySelect = page.getByLabel("ক্যাটাগরি").first();
  await page.getByLabel("নতুন পণ্যের নাম").fill(product);
  await categorySelect.selectOption({ label: renamedCategory });
  const selectedCategoryId = await categorySelect.inputValue();
  await page.getByLabel("ইউনিট").last().fill("pcs");
  await page.getByLabel("ক্রয়মূল্য").last().fill("8.00");
  await page.getByLabel("বিক্রয়মূল্য").last().fill("12.50");
  await page.getByRole("button", { name: "Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)" }).click();
  await expect(page.getByDisplayValue(product)).toBeVisible();

  const productRow = page.getByDisplayValue(product).locator("xpath=../..");
  await expect(productRow.getByLabel("ক্যাটাগরি")).toHaveValue(selectedCategoryId);
  await productRow.getByLabel("পণ্যের নাম").fill(editedProduct);
  await productRow.getByRole("button", { name: "সেভ" }).click();
  await expect(page.getByDisplayValue(editedProduct)).toBeVisible();

  // Draft Memo calculation + IndexedDB persistence across reload/edit/delete.
  await page.goto(new URL("/dashboard/draft-memo", baseURL).toString());
  const productOption = page.locator("select").first().locator("option").filter({ hasText: editedProduct });
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

  // Exercise the application's font/overflow validation and print action, then capture its print DOM.
  await page.evaluate(() => {
    window.__dokantoolsPrintCalled = false;
    window.print = () => { window.__dokantoolsPrintCalled = true; };
  });
  await page.getByRole("button", { name: "A6 Print / PDF" }).click();
  await expect.poll(() => page.evaluate(() => window.__dokantoolsPrintCalled)).toBe(true);
  await mkdir("artifacts", { recursive: true });
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: "screen" });

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No drafts saved.")).toBeVisible();

  await page.goto(new URL("/dashboard/stock", baseURL).toString());
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: `${renamedCategory} delete` }).click();
  await expect(page.getByText(renamedCategory, { exact: true })).toHaveCount(0);

  const finalProductRow = page.getByDisplayValue(editedProduct).locator("xpath=../..");
  page.once("dialog", dialog => dialog.accept());
  await finalProductRow.getByRole("button", { name: "মুছুন" }).click();
  await expect(page.getByDisplayValue(editedProduct)).toHaveCount(0);
});
