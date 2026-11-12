#!/usr/bin/env node
import process from "node:process";

const fail = (message) => { console.error(`LOCAL SUPABASE SAFETY GUARD: BLOCKED — ${message}`); process.exit(2); };
const parse = (raw, label) => {
  let u;
  try { u = new URL(raw); } catch { fail(`${label} is missing or is not a valid URL.`); }
  if (!["http:", "https:", "postgres:", "postgresql:"].includes(u.protocol)) fail(`${label} uses an unsupported protocol.`);
  const host = (u.hostname || "").toLowerCase();
  if (host.endsWith(".supabase.co") || host.includes("render.com") || host.includes("render.internal")) fail(`${label} points to a hosted Supabase/Render endpoint.`);
  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") fail(`${label} host must be loopback; received '${host}'.`);
  return u;
};
const api = parse(process.env.SUPABASE_URL || "", "SUPABASE_URL");
const db = parse(process.env.SUPABASE_DB_URL || "", "SUPABASE_DB_URL");
if (api.protocol !== "http:" || api.port !== "54321") fail("SUPABASE_URL must be http://127.0.0.1:54321 (or localhost equivalent).");
if (!["postgres:", "postgresql:"].includes(db.protocol) || db.port !== "54322") fail("SUPABASE_DB_URL must target the local PostgreSQL port 54322.");
if (db.pathname !== "/postgres") fail("database name must be the disposable local 'postgres' database.");
if (process.env.LS01_ALLOW_LOCAL_SUPABASE !== "1") fail("explicit LS01_ALLOW_LOCAL_SUPABASE=1 opt-in is required.");
console.log("PASS: Supabase API and database endpoints are loopback-only and match LS-01 pinned ports.");
