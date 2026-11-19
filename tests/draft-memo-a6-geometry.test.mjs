import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('generated Draft Memo PDF has exact A6 MediaBox/CropBox and embedded Bengali font', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-a6-pdf.mjs', 'docs/evidence/draft-memo-a6-demo.pdf'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.pages, 1);
  assert.deepEqual(evidence.mediaBoxPt, [0, 0, 297.64, 419.53]);
  assert.deepEqual(evidence.cropBoxPt, [0, 0, 297.64, 419.53]);
  assert.equal(evidence.bengaliFontEmbedded, true);
});
