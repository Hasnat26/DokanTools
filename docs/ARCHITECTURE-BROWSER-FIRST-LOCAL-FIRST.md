# DokanTools V1 — Browser-First / Local-First Architecture

## Core invoice workflow

\`\`\`mermaid
flowchart LR
  U[Shop owner browser] --> PWA[Static Next.js PWA<br/>Cloudflare Pages]
  PWA --> CALC[Client-side invoice calculation<br/>integer minor units]
  CALC --> IDB[(IndexedDB<br/>drafts, catalogue, customers)]
  CALC --> PDF[Client-side jsPDF<br/>A6 PDF]
  PDF --> DL[Download]
  PDF --> SHARE[Web Share API<br/>device share sheet]
  IDB --> BACKUP[Manual backup/export]
  BACKUP --> DRIVE[Customer Google Drive<br/>appDataFolder]
  DRIVE --> RESTORE[Validate and merge restore]
  RESTORE --> IDB
  ISSUE[Invoice issuance guard<br/>OFF] -.-> CALC
  ISSUE -.-> NOAPI[No static invoice API]
\`\`\`

## Trust and data boundaries

- Application hosting distributes static HTML, JavaScript, CSS and assets. Invoice content is not sent to Cloudflare by the core invoice workflow.
- IndexedDB is local browser storage and is not permanent. Browser storage can be cleared or evicted.
- Google OAuth uses the user's consent and the Drive appDataFolder scope. The access token remains in memory.
- Drive backup is manual and user-controlled. It is not real-time synchronization and is subject to Google API quotas.
- The legacy dashboard features (shop administration, stock, memo, baki and public shop data) still use Supabase and remain outside the standalone local invoice path.
- Invoice issuance remains disabled; the local workspace only creates drafts and draft PDFs.
