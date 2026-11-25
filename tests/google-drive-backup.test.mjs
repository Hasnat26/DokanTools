import test from "node:test";
import assert from "node:assert/strict";
import { GOOGLE_DRIVE_SCOPE, backupToDrive, findDriveBackup } from "../src/lib/google-drive-backup.mjs";

test("Drive integration requests only appDataFolder scope", () => {
  assert.equal(GOOGLE_DRIVE_SCOPE, "https://www.googleapis.com/auth/drive.appdata");
});

test("backup validates payload before contacting Google", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("should not be called"); };
  try {
    await assert.rejects(backupToDrive("valid-token-long-enough", { schemaVersion: 99 }), /INVALID_BACKUP_FORMAT/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("Drive 401 is classified as expired authorization", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "Invalid Credentials" } }), { status: 401 });
  try {
    await assert.rejects(findDriveBackup("valid-token-long-enough"), /DRIVE_AUTH_EXPIRED/);
  } finally {
    globalThis.fetch = original;
  }
});

test("backup updates the newest duplicate and reports older duplicates", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options = {}) => {
    calls += 1;
    assert.match(options.headers.Authorization, /^Bearer /);
    if (calls === 1) {
      return new Response(JSON.stringify({
        files: [
          { id: "newest", name: "dokantools-local-backup.json", modifiedTime: "2026-11-24T12:00:00Z" },
          { id: "older", name: "dokantools-local-backup.json", modifiedTime: "2026-11-23T12:00:00Z" },
        ],
      }), { status: 200 });
    }
    assert.equal(options.method, "PATCH");
    assert.match(String(url), /files\/newest/);
    return new Response(JSON.stringify({ id: "newest", name: "dokantools-local-backup.json" }), { status: 200 });
  };
  const backup = {
    schemaVersion: 1,
    workspace: { id: "workspace-1" },
    data: { invoices: [], products: [], customers: [] },
  };
  try {
    const result = await backupToDrive("valid-token-long-enough", backup);
    assert.equal(result.id, "newest");
    assert.equal(result.duplicateBackupCount, 1);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test("Drive restore fetches and validates the latest appDataFolder backup", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  const backup = {
    schemaVersion: 1,
    workspace: { id: "workspace-restore" },
    data: { invoices: [], products: [], customers: [] },
  };
  globalThis.fetch = async (url) => {
    calls += 1;
    if (calls === 1) {
      assert.match(String(url), /spaces=appDataFolder/);
      return new Response(JSON.stringify({
        files: [{ id: "backup-latest", modifiedTime: "2026-11-24T12:00:00Z" }],
      }), { status: 200 });
    }
    assert.match(String(url), /files\/backup-latest\?alt=media/);
    return new Response(JSON.stringify(backup), { status: 200 });
  };
  try {
    const { restoreFromDrive } = await import("../src/lib/google-drive-backup.mjs");
    const result = await restoreFromDrive("valid-token-long-enough");
    assert.equal(result.file.id, "backup-latest");
    assert.deepEqual(result.backup, backup);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test("Drive quota/rate-limit response retries within bounded retry policy", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({
        error: { errors: [{ reason: "userRateLimitExceeded" }] },
      }), { status: 403, headers: { "Retry-After": "0.001" } });
    }
    return new Response(JSON.stringify({ files: [] }), { status: 200 });
  };
  try {
    assert.deepEqual(await findDriveBackup("valid-token-long-enough"), []);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test("Drive service unavailable is surfaced without corrupting local backup state", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "unavailable" } }), { status: 503 });
  try {
    await assert.rejects(findDriveBackup("valid-token-long-enough"), /DRIVE_SERVICE_UNAVAILABLE/);
  } finally {
    globalThis.fetch = original;
  }
});
