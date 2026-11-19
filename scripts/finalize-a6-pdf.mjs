#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/finalize-a6-pdf.mjs <browser-print.pdf> <exact-a6-output.pdf>');
  process.exit(2);
}
const input = resolve(inputArg);
const output = resolve(outputArg);
if (input === output) throw new Error('Input and output must be different files.');
await access(input);
const gs = spawnSync('gs', [
  '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.7', '-dFIXEDMEDIA',
  '-dDEVICEWIDTHPOINTS=297.6378', '-dDEVICEHEIGHTPOINTS=419.5276',
  '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${output}`, input,
], { encoding: 'utf8' });
if (gs.error) throw gs.error;
if (gs.status !== 0) throw new Error(gs.stderr || `Ghostscript exited ${gs.status}`);
const size = await stat(output);
if (!size.size) throw new Error('Output PDF is empty.');
console.log(`Wrote fixed-media A6 PDF: ${output} (${size.size} bytes). Content is not scaled; page edges outside the target box are clipped.`);
