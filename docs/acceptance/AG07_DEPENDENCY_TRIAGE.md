# AG-07 dependency vulnerability triage — 2026-11-19

## Audit baseline and raw evidence

- Repository: `Hasnat26/DokanTools`, PRIVATE.
- Branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Last completed full audit at baseline: `c5516e7c6d02dc86f10ad99765df58534d7b7b76`.
- Audit command: `npm ci`, then `npm audit --json`.
- Runtime: GitHub Actions Ubuntu runner, Node 20, npm lockfile v3; 476 total dependency nodes (60 production, 363 dev, 82 optional).
- Raw report: [workflow artifact 14499538495](https://github.com/Hasnat26/DokanTools/actions/runs/44460878752/artifacts/14499538495).
- Summary: 7 moderate, 0 high, 0 critical, 0 low. Exit code 1 because advisories remain.
- All seven npm audit package rows are development-only/transitive. Six rows are one minimatch advisory propagated through the TypeScript ESLint chain; the seventh is one PostCSS selector parser advisory.

## Advisory A — minimatch globparts amplification denial of service

- Advisory: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), CVE-2026-118764.
- Severity: Moderate.
- Affected range: `>=7.0.0 <11.0.1`; fixed in `11.0.1`.
- Exact installed vulnerable package: `minimatch@10.2.6`, nested at `node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch`.
- Other installed `minimatch@3.1.5` instances are outside this advisory's affected range.
- Vulnerable path: `eslint-config-next@15.5.28` -> `@typescript-eslint/parser@8.71.2` -> `@typescript-eslint/typescript-estree@8.71.2` -> `minimatch@10.2.6`.
- The audit reports five additional affected TypeScript ESLint package rows at `8.71.2`: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, and `@typescript-eslint/utils`. These are propagated dependency-chain findings, not five separate root vulnerabilities.
- Parent declaration in the locked `@typescript-eslint/typescript-estree@8.71.2`: `minimatch: ^10.2.2`.
- Reachability: all packages are dev dependencies. The vulnerable minimatch call is in TypeScript parser/lint tooling, not the authenticated app runtime. The issue requires an attacker-controlled glob pattern; the current project source/config does not provide a public runtime input to this code path. Residual exposure is CI/developer build resource exhaustion if an attacker can control the relevant glob pattern/config or cause untrusted source to be parsed.
- Remediation investigation: upstream `@typescript-eslint/typescript-estree@8.73.0` (released 2026-11-16) changes its dependency declaration to `minimatch: ^11.0.1`; upstream release metadata was checked directly in the typescript-eslint repository. This is a same-major TypeScript ESLint update, not a forced minimatch override.
- Action: **UPDATE** the complete `@typescript-eslint/*` 8.71.2 toolchain to 8.73.0 (same major, peer-compatible with eslint-config-next's declared `^8` range), then regenerate lockfile and run full tests/lint/typecheck/build and npm audit. Candidate workflow: [run 44463144496](https://github.com/Hasnat26/DokanTools/actions/runs/44463144496). The candidate package/lock files are not committed until the validation run passes.
- Fallback if update cannot be validated: **ACCEPT RISK temporarily with mitigation** — keep this chain dev-only; do not expose minimatch glob pattern inputs to users; review changes to tsconfig/ESLint glob configuration; restrict CI to trusted private-repository contributors; monitor upstream fixes. This is not a permanent acceptance and does not close AG-07.

## Advisory B — postcss-selector-parser quadratic selector parsing

- Advisory: [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), CVE-2026-104844.
- Severity: Moderate; CVSS 3.1 5.9 (AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H).
- Installed: `postcss-selector-parser@6.1.4`, direct=false, dev=true, at `node_modules/postcss-selector-parser`.
- Parent paths: `tailwindcss@3.4.19` declares `^6.1.2`; `postcss-nested@6.2.0` declares `^6.1.1`.
- Affected: `<6.1.5` for the 6.x line. Fixed 6.x release: `6.1.5` (7.x fix 7.1.6 is not selected because the existing parents consume 6.x).
- Vulnerable code path: parsing a crafted flat selector with many class/id tokens can trigger quadratic work and CPU exhaustion. Exposure is relevant when attacker-controlled selectors are parsed synchronously; this app uses the parser in its development/build CSS toolchain and does not expose a public CSS selector parsing endpoint.
- Action: **PATCH** to `6.1.5` via a narrow npm override. Upstream advisory reports the patch uses Set membership and differential parsing across 8,413 selectors was byte-identical. The project's test/lint/typecheck/build suite must still pass.
- Candidate workflow: [run 44463144496](https://github.com/Hasnat26/DokanTools/actions/runs/44463144496). First candidate attempt [run 44462948771](https://github.com/Hasnat26/DokanTools/actions/runs/44462948771) failed because its test harness omitted the existing required Poppler/Ghostscript OS packages; the PDF test failed with `pdfinfo ENOENT`. This was a harness setup defect, not a code/test assertion against the patch. The workflow was corrected to install `ghostscript` and `poppler-utils` before retrying.

## Candidate remediation acceptance criteria

1. Candidate `package.json` and `package-lock.json` are generated by npm, not manually edited.
2. The locked PostCSS parser is exactly `6.1.5`.
3. The TypeScript ESLint family resolves consistently to `8.73.0`; its `typescript-estree` dependency resolves minimatch `11.0.1+`.
4. `npm ci` succeeds from the candidate lockfile.
5. `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass.
6. Fresh `npm audit --json` contains no unresolved advisory rows, or each remaining advisory receives a documented and PO-reviewed risk disposition.
7. Only after candidate validation, commit generated package files to the existing corrective branch and rerun full CI/security workflows.

## Candidate validation and committed remediation

- Candidate generation and validation run: [44463144496](https://github.com/Hasnat26/DokanTools/actions/runs/44463144496), conclusion SUCCESS.
- Candidate lock resolution: `@typescript-eslint/*` toolchain packages `8.73.0`; nested `minimatch@11.0.9`; `postcss-selector-parser@6.1.5`.
- Candidate npm audit: `info 0, low 0, moderate 0, high 0, critical 0, total 0`; `npm audit` exit code 0.
- Candidate regression: `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` all passed.
- The validated `package.json` and generated `package-lock.json` were committed by the workflow as `01e82e767eca29ccd986e5443fc6c455ae0c4296` (`fix: patch audited development dependencies`).
- Exact committed manifest/lock versions were independently fetched and checked at that SHA; package lock contains 8.73.0 TypeScript ESLint family, minimatch 11.0.9 and postcss-selector-parser 6.1.5.

## Current disposition

AG-07 remains **IN PROGRESS** until post-commit full CI and the normal security-audit workflow are confirmed against commit `01e82e767eca29ccd986e5443fc6c455ae0c4296`. Candidate-level audit and regression checks passed, but the gate will not be closed before the committed revision is rechecked. No broad `npm audit fix` was used; no unreviewed major upgrade was introduced.
