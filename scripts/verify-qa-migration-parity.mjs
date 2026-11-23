import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const pairs = [
  ["supabase/tests/fixtures/v1_browser_qa_schema.sql", "qa/supabase-runner/supabase/migrations/20261119000000_v1_qa_baseline.sql"],
  ["supabase/migrations/202611180001_item_categories.sql", "qa/supabase-runner/supabase/migrations/20261119000100_item_categories.sql"],
  ["supabase/migrations/202611110001_invoice_first_foundation.sql", "qa/supabase-runner/supabase/migrations/20261119000200_invoice_first_foundation.sql"],
  ["supabase/migrations/202611220001_category_integrity_and_shop_map_validation.sql", "qa/supabase-runner/supabase/migrations/20261122000100_category_integrity_and_shop_map_validation.sql"],
];
for (const [source, qaCopy] of pairs) {
  const [a, b] = await Promise.all([readFile(source, "utf8"), readFile(qaCopy, "utf8")]);
  assert.equal(b, a, `QA migration copy drifted from source: ${source} → ${qaCopy}`);
}
console.log("Isolated QA baseline and migration copies are byte-identical to source SQL.");
