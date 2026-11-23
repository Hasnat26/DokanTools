#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const pdf = resolve(process.argv[2] || 'docs/evidence/draft-memo-a6-demo.pdf');
await access(pdf);
function run(command, args) {
  const r = spawnSync(command, args, { encoding: 'utf8' });
  if (r.error) throw r.error;
  assert.equal(r.status, 0, `${command} failed: ${r.stderr}`);
  return r.stdout;
}
const info = run('pdfinfo', ['-box', pdf]);
const one = (name) => {
  const m = info.match(new RegExp(`^${name}:\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*$`, 'm'));
  assert.ok(m, `${name} missing from pdfinfo output`);
  return m.slice(1).map(Number);
};
const media = one('MediaBox');
const crop = one('CropBox');
const target = [0, 0, 297.6378, 419.5276];
for (const [name, box] of [['MediaBox', media], ['CropBox', crop]]) {
  box.forEach((v, i) => assert.ok(Math.abs(v - target[i]) <= 0.01, `${name}[${i}] ${v} differs from target ${target[i]}`));
}
assert.match(info, /Pages:\s+1\b/, 'PDF must contain exactly one page');
assert.match(info, /Page rot:\s+0\b/, 'PDF must not be rotated');
const fonts = run('pdffonts', [pdf]);
assert.match(fonts, /NotoSansBengali-Regular.*yes\s+yes\s+yes/, 'Embedded Bengali font not found');
const text = run('pdftotext', [pdf, '-']);
assert.match(text, /Grand Total/);
assert.match(text, /331\.00/);
assert.match(text, /DRAFT ONLY/);
console.log(JSON.stringify({ pdf, pages: 1, mediaBoxPt: media, cropBoxPt: crop, targetPt: target, tolerancePt: 0.01, rotation: 0, fontTableAvailable: true, contentChecks: ['Grand Total', '331.00', 'DRAFT ONLY'] }, null, 2));
