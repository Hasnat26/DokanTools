import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
test("retained A6 reference PDF geometry and bill totals remain valid",()=>{
 const result=spawnSync(process.execPath,["scripts/verify-a6-pdf.mjs","docs/evidence/draft-memo-a6-demo.pdf"],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr||result.stdout);
 const evidence=JSON.parse(result.stdout);
 assert.equal(evidence.pages,1);
 assert.deepEqual(evidence.mediaBoxPt,[0,0,297.64,419.53]);
 assert.deepEqual(evidence.cropBoxPt,[0,0,297.64,419.53]);
 assert.equal(evidence.rotation,0);
});

test("print stylesheet declares valid A6 portrait dimensions",()=>{
 const source=readFileSync("src/app/dashboard/draft-memo/page.tsx","utf8");
 assert.match(source,/@page\{size:297\.6378pt 419\.5276pt;margin:8\.50394pt;\}/);
});
