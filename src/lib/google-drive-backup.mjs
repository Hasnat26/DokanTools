import { validateLocalBackup } from "./local-first-invoice.mjs";

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const DRIVE_BACKUP_NAME = "dokantools-local-backup.json";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function requireToken(token) {
  if (typeof token !== "string" || token.trim().length < 20) throw new Error("DRIVE_AUTH_REQUIRED");
}

function classifyError(status, payload) {
  const reasons = payload?.error?.errors?.map(item => item.reason) || [];
  if (status === 401) return "DRIVE_AUTH_EXPIRED";
  if (status === 403 && reasons.some(reason => /quota|rateLimit|userRateLimit/i.test(reason))) return "DRIVE_QUOTA_OR_RATE_LIMIT";
  if (status === 403) return "DRIVE_ACCESS_DENIED";
  if (status === 404) return "DRIVE_FILE_NOT_FOUND";
  if (status === 429) return "DRIVE_RATE_LIMITED";
  if (status >= 500) return "DRIVE_SERVICE_UNAVAILABLE";
  return "DRIVE_REQUEST_FAILED";
}

async function driveFetch(token, url, options = {}) {
  requireToken(token);
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: { Authorization: "Bearer " + token, ...(options.headers || {}) },
      });
    } catch {
      if (attempt === maxAttempts - 1) throw new Error("DRIVE_NETWORK_ERROR");
      await wait(Math.min(8000, 500 * (2 ** attempt)));
      continue;
    }
    if (response.ok) return response;
    const payload = await response.clone().json().catch(() => null);
    const retryable = response.status === 429 || response.status >= 500 ||
      (response.status === 403 && classifyError(403, payload) === "DRIVE_QUOTA_OR_RATE_LIMIT");
    if (retryable && attempt < maxAttempts - 1) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(8000, retryAfter * 1000)
        : Math.min(8000, 500 * (2 ** attempt));
      await wait(delay);
      continue;
    }
    throw new Error(classifyError(response.status, payload));
  }
  throw new Error("DRIVE_REQUEST_FAILED");
}

export async function findDriveBackup(token) {
  const query = new URLSearchParams({
    q: "name = '" + DRIVE_BACKUP_NAME + "' and 'appDataFolder' in parents and trashed = false",
    spaces: "appDataFolder",
    pageSize: "100",
    orderBy: "modifiedTime desc",
    fields: "files(id,name,modifiedTime,size,md5Checksum),nextPageToken",
  });
  const response = await driveFetch(token, API + "/files?" + query.toString());
  const payload = await response.json();
  return (payload.files || []).sort((a, b) => String(b.modifiedTime).localeCompare(String(a.modifiedTime)));
}

function multipartBody(metadata, payload, boundary) {
  return [
    "--" + boundary,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    "--" + boundary,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(payload),
    "--" + boundary + "--",
    "",
  ].join("\r\n");
}

export async function backupToDrive(token, backup) {
  validateLocalBackup(backup);
  const existing = await findDriveBackup(token);
  const file = existing[0] || null;
  const boundary = "dokantools_" + globalThis.crypto.randomUUID().replace(/-/g, "");
  const metadata = { name: DRIVE_BACKUP_NAME, mimeType: "application/json" };
  if (!file) metadata.parents = ["appDataFolder"];
  const method = file ? "PATCH" : "POST";
  const url = file
    ? UPLOAD + "/files/" + encodeURIComponent(file.id) + "?uploadType=multipart&fields=id,name,modifiedTime,size"
    : UPLOAD + "/files?uploadType=multipart&fields=id,name,modifiedTime,size";
  const response = await driveFetch(token, url, {
    method,
    headers: { "Content-Type": "multipart/related; boundary=" + boundary },
    body: multipartBody(metadata, backup, boundary),
  });
  return response.json();
}

export async function restoreFromDrive(token) {
  const files = await findDriveBackup(token);
  if (!files.length) throw new Error("DRIVE_BACKUP_NOT_FOUND");
  const response = await driveFetch(token, API + "/files/" + encodeURIComponent(files[0].id) + "?alt=media");
  const backup = await response.json().catch(() => { throw new Error("DRIVE_BACKUP_INVALID_JSON"); });
  validateLocalBackup(backup);
  return { backup, file: files[0] };
}

export async function disconnectDrive(token) {
  requireToken(token);
  try {
    const response = await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!response.ok) throw new Error("DRIVE_DISCONNECT_FAILED");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVE_DISCONNECT_FAILED") throw error;
    throw new Error("DRIVE_DISCONNECT_NETWORK_ERROR");
  }
}
