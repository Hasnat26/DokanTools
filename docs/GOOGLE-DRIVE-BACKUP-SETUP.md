# Google Drive backup — setup and data handling

## Google Cloud setup

1. Create or select a Google Cloud project controlled by the product owner.
2. Enable Google Drive API.
3. Create an OAuth 2.0 Web application client.
4. Add the exact Cloudflare Pages origin to Authorized JavaScript origins. No redirect URI is used by the Google Identity Services token-client flow.
5. Configure the public client ID as NEXT_PUBLIC_GOOGLE_CLIENT_ID in the Pages build environment.
6. Do not create a service account for browser backup. Do not embed a client secret, service-account key or privileged credential in the application.

## Scope and token lifecycle

The implementation requests only https://www.googleapis.com/auth/drive.appdata. The backup is stored in the user's hidden Drive appDataFolder, not in their visible root Drive folder. This scope is restricted to app-specific data and does not grant general access to the user's Drive files.

Access tokens are held in component memory only. They are not written to IndexedDB, localStorage, backup JSON or application logs. The user can revoke the app in Google Account security settings. The in-app disconnect action attempts to revoke the current token; local data is not deleted.

## Backup format and recovery

The versioned JSON backup contains the workspace, draft invoices, product catalogue and customer contacts. It excludes OAuth tokens and transient PDF objects.

- Manual backup updates the latest appDataFolder backup file.
- Manual restore validates the schema and merges records by ID into the active local workspace.
- A local JSON export/import is available independently of Drive.
- Drive unavailable, expired authorization, network failure, HTTP 403 quota/rate-limit, HTTP 429 and 5xx responses do not delete or block local records.
- Retry/backoff is bounded. Reconnect is required after token expiry/revocation.
- Duplicate backup files are paginated and detected; manual backup updates the newest file and reports older duplicates without silently deleting them. Restore uses the newest modified backup and applies the timestamp-based record merge policy. This is not real-time multi-device synchronization.

## Privacy and storage limitation

Invoice data remains in the browser and the user's own Google account backup. IndexedDB is best-effort browser storage and may be cleared by the user, browser profile removal, storage pressure or device failure. Export/backup is essential. Do not use a shared browser profile for confidential multi-user work.

Google Drive quotas and rate limits apply. The app does not claim unlimited API usage.