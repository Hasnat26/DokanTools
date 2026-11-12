import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = "scripts/guard-local-supabase.mjs";
const run = (api, db) => spawnSync(process.execPath,[script],{
  encoding:"utf8",
  env:{...process.env,SUPABASE_URL:api,SUPABASE_DB_URL:db,LS01_ALLOW_LOCAL_SUPABASE:"1"}
});
test("accepts only the pinned local API and DB endpoints",()=>{
  const r=run("http://127.0.0.1:54321","postgresql://postgres:local@127.0.0.1:54322/postgres");
  assert.equal(r.status,0,r.stderr);
});
for (const [name,api,db] of [
  ["hosted Supabase API","https://example.supabase.co","postgresql://postgres:x@127.0.0.1:54322/postgres"],
  ["remote DB","http://127.0.0.1:54321","postgresql://postgres:x@db.example.com:54322/postgres"],
  ["Render DB","http://127.0.0.1:54321","postgresql://postgres:x@foo.render.com:54322/postgres"],
  ["wrong API port","http://127.0.0.1:54322","postgresql://postgres:x@127.0.0.1:54322/postgres"],
  ["wrong DB port","http://127.0.0.1:54321","postgresql://postgres:x@127.0.0.1:54321/postgres"],
  ["wrong DB name","http://127.0.0.1:54321","postgresql://postgres:x@127.0.0.1:54322/production"]
]) test(`rejects ${name}`,()=>{
  const r=run(api,db);
  assert.equal(r.status,2);
  assert.match(r.stderr,/SAFETY GUARD: BLOCKED/);
});
