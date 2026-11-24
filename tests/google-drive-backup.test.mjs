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
