#!/usr/bin/env node
// Stop hook — per-turn auto-sync of git state → product_status (POWER-LOSS SAFETY NET).
// After every agent turn in a recognized Shift repo, silently record the current git
// facts (branch / HEAD / uncommitted-WIP / behind-ahead) to the source-of-truth board,
// so a new agent can resume exactly here even if power died mid-work. The uncommitted
// work itself lives on disk; this just makes the board point at it.
//
// Silent, DETACHED, fail-safe: never blocks turn completion, never throws, no output.
// Only touches semantic-free columns (local + timestamps) — merge-duplicates retains
// the agent's summary/next_steps/blockers.
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const p = process.cwd().toLowerCase().replace(/\\/g, "/");
const map = [
  [/\/gso(\/|$)/, "gso"], [/groundshift/, "gso"],
  [/lendshift/, "lendshift"], [/realshift/, "realshift"], [/weldshift/, "weldshift"],
  [/shapeshift/, "shapeshift"], [/finshift/, "finshift"], [/marketshift|surgeshift/, "surgeshift"],
  [/t1care|sugarshift/, "sugarshift"], [/shift-core/, "shift-core"], [/allshift/, "allshift"],
];
const script = path.join(os.homedir(), ".claude", "shift-parking-lot", "shiftlog.mjs");
const fire = (args) => { try { spawn(process.execPath, [script, ...args], { detached: true, stdio: "ignore" }).unref(); } catch { /* ignore */ } };

// ALWAYS back up memory to the cloud (global, not per-repo) — skips when unchanged, so
// the latest brain is always recoverable even after total machine loss. Then, if we're
// in a Shift repo, also sync the git state into product_status.
fire(["memory-push", "--quiet"]);

let product = null;
for (const [re, n] of map) { if (re.test(p)) { product = n; break; } }
if (!product) process.exit(0);
try {
  if (execSync("git rev-parse --is-inside-work-tree", { stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).toString().trim() !== "true") process.exit(0);
} catch { process.exit(0); }
fire(["status", "--set", "--product", product]);
process.exit(0);
