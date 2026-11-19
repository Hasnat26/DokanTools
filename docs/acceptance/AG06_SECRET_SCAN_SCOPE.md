# AG-06 secret scan scope and retained evidence

## Scan identity

- Repository: `Hasnat26/DokanTools` (PRIVATE).
- Branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Scan commit: `c5516e7c6d02dc86f10ad99765df58534d7b7b76`.
- Tool: Gitleaks Docker image `zricethezav/gitleaks:latest` (workflow did not pin an immutable image digest).
- Command: `gitleaks detect --source=/repo --log-opts=--all --redact --report-format=json --report-path=/repo/gitleaks-report.json --exit-code=1`.
- Checkout: `actions/checkout@v4`, `fetch-depth: 0` (complete Git history).
- Latest scan: GitHub Actions run [44460878752](https://github.com/Hasnat26/DokanTools/actions/runs/44460878752), on the full-history checkout.
- Result: 109 commits scanned, approximately 956 KB, no leaks found.
- Redacted report artifact: [dokantools-security-audit.zip, artifact 14499538495](https://github.com/Hasnat26/DokanTools/actions/runs/44460878752/artifacts/14499538495). The ZIP contains `gitleaks-report.json` (empty findings array) and `npm-audit-report.json`. Artifact retention is 30 days from 2026-11-19.

## What was in scope

- Repository checkout working tree, including tracked source, configuration, docs, GitHub Actions workflows, `.env.example`, sample configuration and any files present in the checkout workspace.
- Git history reachable through all refs fetched by the full-history checkout (`--log-opts=--all`).
- Gitleaks default detectors, with report redaction enabled.

## Explicit exclusions / not verified

- GitHub Actions repository/environment secret stores and their secret values. The available GitHub integration does not expose the secrets API; no claim is made that stored secrets were enumerated or validated.
- Supabase project settings, Supabase Auth keys, service-role keys or other external Supabase secrets.
- Render credentials, database passwords, API keys or other external Render secrets.
- Secrets held in external CI providers, developer workstations, password managers or untracked files outside the GitHub Actions checkout.
- The Gitleaks container image was referenced by mutable `latest`, not pinned by digest. A future repeat should pin a verified version/digest and retain tool version output.

## Interpretation

`no leaks found` is a scanner result for the stated repository checkout/history and detector set. It is not proof that no secret exists anywhere, nor does it prove external secret stores are clean. If any credential is suspected to have been committed or exposed, rotate it through its provider even if the scan reports no finding. Do not paste secret values into issues, logs or this document.

## Follow-up

- Keep the private workflow artifact as the redacted machine-readable scan record; download and archive it in the PO-designated secure evidence store before its 30-day expiry.
- Repeat the scan with a pinned Gitleaks image and a controlled secret-store inventory performed by an authorized administrator.
- No history rewrite was performed or authorized.
