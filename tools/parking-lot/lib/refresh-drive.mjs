#!/usr/bin/env node
// Auto-refresh the master-key drive: find it (any drive letter) and re-run its builder,
// so while it's plugged in it stays current with code, memory, env, and the parking-lot
// state. Incremental (only changed files copied). Safe no-op when the drive is absent.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

function findDrive() {
  const cands = [];
  for (let c = 68; c <= 90; c++) cands.push(`${String.fromCharCode(c)}:\\SHIFT-MASTER-KEY`); // D..Z (external)
  cands.push(path.join(os.homedir(), "SHIFT-MASTER-KEY")); // staging fallback
  for (const d of cands) { try { if (fs.existsSync(path.join(d, "build-master-key.mjs"))) return d; } catch { /* skip */ } }
  return null;
}

function once() {
  const drive = findDrive();
  if (!drive) { console.log("[refresh] no master-key drive found - skipping"); return; }
  try {
    console.log(`[refresh] refreshing ${drive} @ ${new Date().toISOString()}`);
    execSync(`node "${path.join(drive, "build-master-key.mjs")}"`, { stdio: "inherit", timeout: 900000 });
  } catch (e) { console.error("[refresh] failed:", e.message); }
}

// --daemon: run forever, refreshing every 30 min (started at logon; no admin needed).
// Otherwise: one-shot.
once();
if (process.argv.includes("--daemon")) setInterval(once, 30 * 60 * 1000);
