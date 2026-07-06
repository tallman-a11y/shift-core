#!/usr/bin/env node
// Auto-refresh the master-key drive: find it (any drive letter) and re-run its builder,
// so while it's plugged in it stays current with code, memory, env, and the parking-lot
// state. Incremental (only changed files copied). Safe no-op when the drive is absent.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

// Return EVERY master-key copy present — the local one plus any plugged-in drive(s).
// Refreshing them all = redundant, always-current backups (two beats one).
function findDrives() {
  const found = [];
  for (let c = 68; c <= 90; c++) { const d = `${String.fromCharCode(c)}:\\SHIFT-MASTER-KEY`; try { if (fs.existsSync(path.join(d, "build-master-key.mjs"))) found.push(d); } catch { /* skip */ } }
  const local = path.join(os.homedir(), "SHIFT-MASTER-KEY");
  try { if (fs.existsSync(path.join(local, "build-master-key.mjs"))) found.push(local); } catch { /* skip */ }
  return found;
}

function once() {
  const drives = findDrives();
  if (!drives.length) { console.log("[refresh] no master-key copy found - skipping"); return; }
  for (const drive of drives) {
    try {
      console.log(`[refresh] refreshing ${drive} @ ${new Date().toISOString()}`);
      execSync(`node "${path.join(drive, "build-master-key.mjs")}"`, { stdio: "inherit", timeout: 900000 });
    } catch (e) { console.error(`[refresh] ${drive} failed:`, e.message); }
  }
}

// --daemon: run forever, refreshing every 30 min (started at logon; no admin needed).
// Otherwise: one-shot.
once();
if (process.argv.includes("--daemon")) setInterval(once, 30 * 60 * 1000);
