#!/usr/bin/env node
// SessionStart hook — surfaces "where other agents left off" (a brief) as session
// context when starting in a Shift repo. FAIL-SAFE: any error or empty result → no
// output, exit 0 (never blocks or noises up a session). Silent outside Shift repos.
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const script = path.join(os.homedir(), ".claude", "shift-parking-lot", "shiftlog.mjs");
let out = "";
try {
  out = execFileSync(process.execPath, [script, "catchup", "--hook"], {
    timeout: 7000, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch { process.exit(0); }

if (!out) process.exit(0);
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: out },
}));
