import { performance } from "node:perf_hooks";
import { calculateMemoTotals, applySaleToStock } from "../src/lib/reliability-core.mjs";

const rounds = Number(process.env.BENCH_ROUNDS || 20000);
const stockCount = 100;
const stockSeed = Array.from({ length: stockCount }, (_, i) => ({ id: `sku-${i}`, name: `Product ${i}`, qty: 1_000_000 }));
const saleLines = Array.from({ length: 8 }, (_, i) => ({
  name: `Product ${i}`,
  stock_item_id: `sku-${i}`,
  qty: 0.25 + (i % 4) * 0.25,
  unit_price: 19.95 + i,
}));

// Preview math throughput (same helper imported by the memo UI).
const memoStart = performance.now();
let centsChecksum = 0;
for (let i = 0; i < rounds; i += 1) {
  centsChecksum += calculateMemoTotals(saleLines).totalMinor;
}
const memoMs = performance.now() - memoStart;

// Pure reference workload for validation/stock movements. This does not contact Supabase/Postgres.
const stockStart = performance.now();
let currentStock = stockSeed;
let movementCount = 0;
for (let i = 0; i < rounds; i += 1) {
  const operationId = `bench-${i}`;
  const result = applySaleToStock({ stockItems: currentStock, items: saleLines, operationId });
  currentStock = result.stockItems;
  movementCount += result.movements.length;
}
const stockMs = performance.now() - stockStart;
const memosPerSecond = Math.round((rounds / memoMs) * 1000);
const stockOpsPerSecond = Math.round((rounds / stockMs) * 1000);
const heapMb = Math.round(process.memoryUsage().heapUsed / (1024 * 1024) * 10) / 10;

const result = {
  profile: "local synthetic domain-core microbenchmark",
  node: process.version,
  rounds,
  lines_per_memo: saleLines.length,
  stock_rows: stockCount,
  results: {
    memo_total_calculations: { elapsed_ms: Math.round(memoMs * 100) / 100, operations_per_second: memosPerSecond, checksum_minor_units: centsChecksum },
    stock_transaction_simulations: { elapsed_ms: Math.round(stockMs * 100) / 100, operations_per_second: stockOpsPerSecond, movement_rows: movementCount },
    final_heap_used_mb: heapMb,
  },
  limitations: [
    "Synthetic CPU-only benchmark of the deterministic client/domain helper.",
    "Does not measure Next.js build/startup, browser rendering, network, Supabase latency, PostgreSQL locks, or multi-user concurrency.",
    "Use staging-load tests against a configured Supabase project before production conclusions."
  ]
};
console.log(JSON.stringify(result, null, 2));
