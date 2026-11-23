import { readdir } from "node:fs/promises";
import assert from "node:assert/strict";

const directory = "supabase/migrations";
const entries = await readdir(directory, { withFileTypes: true });
const forbidden = entries
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => /(?:\.down\.sql$|(?:^|[._-])rollback(?:[._-]|$))/i.test(name));
assert.deepEqual(forbidden, [], `Destructive rollback files must not be in ${directory}: ${forbidden.join(", ")}`);
console.log(`Forward migration directory guard passed: ${entries.filter(entry => entry.isFile() && entry.name.endsWith(".sql")).length} SQL files.`);
