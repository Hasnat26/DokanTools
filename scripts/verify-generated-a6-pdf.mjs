#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";

const pdf = resolve(process.argv[2] || "artifacts/dokantools-authenticated-a6.pdf");
await access(pdf);
function run(command,args){
  const r=spawnSync(command,args,{encoding:"utf8"});
  if(r.error) throw r.error;
  assert.equal(r.status,0,`${command} failed: ${r.stderr}`);
  return r.stdout;
}
const info=run("pdfinfo",["-box",pdf]);
assert.match(info,/Pages:\\s+1\\b/,"fresh application PDF must be one page");
assert.match(info,/Page rot:\\s+0\\b/,"PDF rotation must be zero");
const size=info.match(/^Page size:\\s+([\\d.]+) x ([\\d.]+) pts/m);
assert.ok(size,"PDF page size missing");
const width=Number(size[1]),height=Number(size[2]);
const targetWidth=105*72/25.4,targetHeight=148*72/25.4;
assert.ok(Math.abs(width-targetWidth)<0.1,`width ${width}pt is not A6`);
assert.ok(Math.abs(height-targetHeight)<0.1,`height ${height}pt is not A6`);
const fonts=run("pdffonts",[pdf]);
assert.match(fonts,/NotoSansBengali.*yes\\s+yes\\s+yes/,"embedded Bengali font missing");
const text=run("pdftotext",[pdf,"-"]);
assert.match(text,/Grand Total/);
assert.match(text,/37\\.50/,"expected edited quantity total 37.50 missing");
assert.match(text,/Draft only/i);
assert.match(text,/খসড়া/);
console.log(JSON.stringify({pdf,pages:1,pageSizePt:[width,height],targetA6Pt:[targetWidth,targetHeight],rotation:0,bengaliFontEmbedded:true,content:["Grand Total","37.50","Draft only","খসড়া"]},null,2));
