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
