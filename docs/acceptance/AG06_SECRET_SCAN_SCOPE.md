# AG-06 secret scan scope and retained evidence

## Scan identity

- Repository: `Hasnat26/DokanTools` (PRIVATE).
- Branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Scan commit: `0808f43ab9e15a8acb44ccfc8903ea50880b0a0b` (latest completed full-history scan available at the time of this document update; subsequent dependency remediation and documentation commits are not included in this scan).
- Tool: Gitleaks Docker image `zricethezav/gitleaks:latest` (workflow did not pin an immutable image digest).
- Command: `gitleaks detect --source=/repo --log-opts=--all --redact --report-format=json --report-path=/repo/gitleaks-report.json --exit-code=1`.
- Checkout: `actions/checkout@v4`, `fetch-depth: 0` (complete Git history).
- Latest completed scan before the final dependency commit: GitHub Actions run [44463002873](https://github.com/Hasnat26/DokanTools/actions/runs/44463002873), on the full-history checkout.
- Result: 115 commits scanned, approximately 1 MB, no leaks found.
- Redacted report artifact: [dokantools-security-audit.zip, artifact 14500648262](https://github.com/Hasnat26/DokanTools/actions/runs/44463002873/artifacts/14500648262). The ZIP contains `gitleaks-report.json` (empty findings array) and `npm-audit-report.json`. Artifact retention is 30 days from 2026-11-19.
- A new scan is triggered by the acceptance-register update on the dependency-remediated branch; its result will be linked in the execution report.

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
