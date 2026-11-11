import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: path.resolve(process.cwd(), "playwright-report"), open: "never" }],
    ["junit", { outputFile: path.resolve(process.cwd(), "test-results/junit.xml") }],
  ],
  outputDir: path.resolve(process.cwd(), "test-results"),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
});
