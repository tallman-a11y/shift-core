#!/usr/bin/env node
// ── One-command installer for the Shift parking lot ───────────────────────────
// Wires up the cross-product agent coordination system on ANY machine: copies the
// helper + hooks + skills into ~/.claude, writes the config (service key from env —
// never committed), and merges the hooks into ~/.claude/settings.json (idempotent).
//
// Usage (from this directory or anywhere):
//   SHIFT_PARKING_LOT_KEY=<service_role_jwt> node install.mjs
//   # or auto-fetch the key with a Supabase Management PAT:
//   SUPABASE_PAT=<pat> node install.mjs
//   # or, if ~/.claude/shift-parking-lot.json already exists, just: node install.mjs
//
// Re-run any time to update the installed copy after editing the repo sources.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();
const CLAUDE = path.join(HOME, ".claude");
const PL = path.join(CLAUDE, "shift-parking-lot");
const REF = "btwpscaeiwwgysfogbno";                    // public project ref (not secret)
const DEFAULT_URL = `https://${REF}.supabase.co`;
const tilde = (p) => p.replace(HOME, "~");
const log = (...a) => console.log("[install]", ...a);

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  log("→", tilde(dst));
}

// 1) helper + hooks
fs.mkdirSync(PL, { recursive: true });
for (const f of ["shiftlog.mjs", "session-start-hook.mjs", "bash-capture-hook.mjs", "status-sync-hook.mjs"]) {
  copy(path.join(HERE, "lib", f), path.join(PL, f));
}
// 2) skills
for (const s of ["handoff", "catchup", "pickup"]) {
  copy(path.join(HERE, "skills", s, "SKILL.md"), path.join(CLAUDE, "skills", s, "SKILL.md"));
}

// 3) config — service key from env or existing file; NEVER hardcoded/committed.
const cfgPath = path.join(CLAUDE, "shift-parking-lot.json");
async function resolveKey() {
  if (process.env.SHIFT_PARKING_LOT_KEY) return process.env.SHIFT_PARKING_LOT_KEY;
  if (process.env.SUPABASE_PAT) {
    try {
      const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: "Bearer " + process.env.SUPABASE_PAT } });
      const keys = await r.json();
      const svc = (keys || []).find((k) => k.name === "service_role");
      if (svc) return svc.api_key || svc.api_key_secret || svc.secret || svc.value;
    } catch (e) { log("WARN: PAT key fetch failed:", e.message); }
  }
  try { return JSON.parse(fs.readFileSync(cfgPath, "utf8")).service_key; } catch { return null; }
}
const key = await resolveKey();
if (key) {
  const url = process.env.SHIFT_PARKING_LOT_URL || DEFAULT_URL;
  fs.writeFileSync(cfgPath, JSON.stringify({ url, ref: REF, service_key: key }, null, 2), { mode: 0o600 });
  log("wrote config →", tilde(cfgPath));
} else {
  log("WARN: no service key found. Set SHIFT_PARKING_LOT_KEY or SUPABASE_PAT and re-run,");
  log("      or create", tilde(cfgPath), 'as {"url":"' + DEFAULT_URL + '","service_key":"<jwt>"}');
}

// 4) merge hooks into settings.json (idempotent — matched by script filename)
const settingsPath = path.join(CLAUDE, "settings.json");
let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); } catch { /* fresh */ }
settings.hooks = settings.hooks || {};
const cmd = (f) => ({ type: "command", command: `node ${path.join(PL, f).replace(/\\/g, "/")}` });
function ensureHook(event, matcher, file) {
  settings.hooks[event] = settings.hooks[event] || [];
  const present = settings.hooks[event].some((g) => (g.hooks || []).some((h) => (h.command || "").includes(file)));
  if (present) { log(`hook ${event}/${file} already present`); return; }
  settings.hooks[event].push(matcher ? { matcher, hooks: [cmd(file)] } : { hooks: [cmd(file)] });
  log(`added hook ${event}${matcher ? `(${matcher})` : ""} → ${file}`);
}
ensureHook("SessionStart", null, "session-start-hook.mjs");
ensureHook("PostToolUse", "Bash", "bash-capture-hook.mjs");
ensureHook("Stop", null, "status-sync-hook.mjs");
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
log("merged hooks →", tilde(settingsPath));

log("done. Restart Claude Code sessions to load skills/hooks. Smoke test:");
log("  node " + tilde(path.join(PL, "shiftlog.mjs")) + " board");
