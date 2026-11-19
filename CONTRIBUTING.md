# Contributing to DokanTools

Changes require project-owner approval. Never commit secrets, tokens, service-role keys, customer data or local environment files. Use `.env.example` placeholders. Preserve owner/shop isolation, draft-only behavior and immutable line snapshots. Do not alter invoice issuance, stock, sales, tax, discount, paid/due, ledger, public QR/verification, production data or repository visibility without explicit authorization.

Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. For PDF changes, install Ghostscript and Poppler utilities, run `npm run verify:draft-memo:pdf -- <file>`, and attach the PDF plus `pdfinfo -box` and `pdffonts` output. Report only tests actually executed. PRs should state base SHA, files changed, exclusions, evidence, risks and required approvals. No merge, deployment or publication without separate authorization.
