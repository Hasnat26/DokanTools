#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const pdf = resolve(process.argv[2] || "artifacts/dokantools-authenticated-a6.pdf");
const manifestPath = resolve(process.argv[3] || "artifacts/dokantools-a6-expectations.json");
const expected = JSON.parse(await readFile(manifestPath, "utf8"));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed: ${result.stderr}`);
  return result.stdout;
}

const info = run("pdfinfo", ["-box", pdf]);
const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
const rotation = Number(info.match(/^Page rot:\s+(\d+)/m)?.[1]);
const size = info.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
assert.equal(pages, 1, "PDF must contain exactly one page");
assert.equal(rotation, 0, "PDF rotation must be 0 degrees");
assert.ok(size, "PDF page size missing");
const width = Number(size[1]), height = Number(size[2]);
const expectedWidth = 105 * 72 / 25.4, expectedHeight = 148 * 72 / 25.4;
assert.ok(Math.abs(width - expectedWidth) <= 0.5, `A6 portrait width mismatch: ${width}pt`);
assert.ok(Math.abs(height - expectedHeight) <= 0.5, `A6 portrait height mismatch: ${height}pt`);
assert.ok(width < height, "A6 page must be portrait");

const fontTable = run("pdffonts", [pdf]);
assert.match(fontTable, /NotoSansBengali.*\byes\s+yes\s+yes\b/, "embedded Bengali font with Unicode mapping is required");

const xml = run("pdftohtml", ["-xml", "-stdout", pdf]);
const fontSizes = [...xml.matchAll(/<fontspec\b[^>]*\bsize="(\d+)"/g)].map(match => Number(match[1]));
assert.ok(fontSizes.length > 0, "PDF text font metadata was not found");
const minFontSize = Math.min(...fontSizes);
assert.ok(minFontSize >= 8, `PDF contains text below 8pt: minimum ${minFontSize}pt`);

const page = xml.match(/<page\b[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/);
assert.ok(page, "PDF XML page dimensions missing");
const xmlWidth = Number(page[1]), xmlHeight = Number(page[2]);
const safeX = xmlWidth * (3 / 105), safeY = xmlHeight * (3 / 148);
const textBoxes = [...xml.matchAll(/<text\b[^>]*\btop="([\d.]+)"[^>]*\bleft="([\d.]+)"[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/g)];
assert.ok(textBoxes.length > 0, "No PDF text bounding boxes found");
const outOfBounds = textBoxes.map(match => ({
  top: Number(match[1]), left: Number(match[2]), width: Number(match[3]), height: Number(match[4]),
})).filter(box =>
  box.left < safeX - 1 || box.top < safeY - 1 ||
  box.left + box.width > xmlWidth - safeX + 1 ||
  box.top + box.height > xmlHeight - safeY + 1
);
assert.equal(outOfBounds.length, 0, `PDF text exceeds 3mm safe content area: ${JSON.stringify(outOfBounds.slice(0, 5))}`);

const extracted = run("pdftotext", [pdf, "-"]).replace(/\s+/g, " ");
const required = [
  expected.shopName, expected.productName, expected.quantity, expected.unit,
  expected.unitPrice, expected.lineTotal, expected.grandTotal,
  "Grand Total", expected.draftLabel, expected.banglaDraftLabel,
];
for (const value of required) assert.ok(extracted.includes(value), `Expected PDF content missing: ${value}`);

const report = {
  result: "PASS",
  file: pdf,
  pages,
  rotationDegrees: rotation,
  pageSizePoints: [width, height],
  expectedA6PortraitPoints: [expectedWidth, expectedHeight],
  embeddedBengaliFont: true,
  minimumFontSizePt: minFontSize,
  safeContentMarginMm: 3,
  textBoundingBoxesChecked: textBoxes.length,
  outOfBoundsTextBoxes: outOfBounds.length,
  expectedContentVerified: required,
};
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/dokantools-a6-validation.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
