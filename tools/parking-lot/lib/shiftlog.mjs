#!/usr/bin/env node
// ── Shift central parking lot — CLI ───────────────────────────────────────────
// One shared, cross-product timeline of what every dev agent does, in the
// north-star "shift-brain" Supabase, so any agent can pick up where another left
// off. Used by the /handoff + /catchup skills and by the SessionStart / commit
// hooks. FAIL-SAFE: never throws in a way that could block a hook — on any error it
// warns to stderr and exits 0 (unless --strict).
//
// Usage:
//   node shiftlog.mjs log  --type handoff --title "..." [--product x] [--status ...]
//                          [--session s] [--agent a] [--detail '{"next_steps":[...]}']
//                          [--refs a,b]
//   node shiftlog.mjs catchup [--product x] [--brief]      # pick-up briefing
//   node shiftlog.mjs timeline [--product x] [--limit 20]
//   node shiftlog.mjs resolve <id> [--status done]
//
// Config: env SHIFT_PARKING_LOT_URL + SHIFT_PARKING_LOT_KEY, else ~/.claude/shift-parking-lot.json
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const argv = process.argv.slice(2);
const cmd = argv[0];
const STRICT = argv.includes("--strict");

function flag(name, def = undefined) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
}
function has(name) { return argv.includes(`--${name}`); }

function die(msg) { console.error(`[shiftlog] ${msg}`); process.exit(STRICT ? 1 : 0); }

function loadConfig() {
  const envUrl = process.env.SHIFT_PARKING_LOT_URL, envKey = process.env.SHIFT_PARKING_LOT_KEY;
  if (envUrl && envKey) return { url: envUrl.replace(/\/$/, ""), key: envKey };
  try {
    const file = path.join(os.homedir(), ".claude", "shift-parking-lot.json");
    const c = JSON.parse(fs.readFileSync(file, "utf8"));
    return { url: (c.url || "").replace(/\/$/, ""), key: c.service_key };
  } catch { return null; }
}

// Map a working directory to a Shift product key.
function detectProduct(cwd = process.cwd()) {
  const p = cwd.toLowerCase().replace(/\\/g, "/");
  const table = [
    [/\/gso(\/|$)/, "gso"], [/groundshift/, "gso"],
    [/lendshift/, "lendshift"],
    [/realshift/, "realshift"],
    [/weldshift/, "weldshift"],
    [/shapeshift/, "shapeshift"],
    [/finshift/, "finshift"],
    [/marketshift|surgeshift/, "surgeshift"],
    [/t1care|sugarshift/, "sugarshift"],
    [/shift-core/, "shift-core"],
    [/allshift/, "allshift"],
  ];
  for (const [re, name] of table) if (re.test(p)) return name;
  return "unknown";
}

function agentLabel() {
  return process.env.SHIFT_AGENT || `claude-code@${os.hostname()}`;
}
function sessionId(product) {
  return flag("session") || process.env.SHIFT_SESSION || `${product}-${new Date().toISOString().slice(0, 10)}`;
}

async function sb(pathAndQuery, opts = {}) {
  const cfg = loadConfig();
  if (!cfg || !cfg.url || !cfg.key) return die("no config (set SHIFT_PARKING_LOT_URL/KEY or ~/.claude/shift-parking-lot.json)");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${pathAndQuery}`, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    if (!res.ok) return die(`REST ${res.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return die(`request failed: ${e.message}`);
  } finally { clearTimeout(t); }
}

async function cmdLog() {
  const product = flag("product") || detectProduct();
  const type = flag("type", "note");
  const title = flag("title");
  if (!title) return die("log needs --title");
  let detail = {};
  const d = flag("detail");
  if (d) { try { detail = JSON.parse(d); } catch { detail = { notes: d }; } }
  const refs = (flag("refs") || "").split(",").map((s) => s.trim()).filter(Boolean);
  // A resume_point is the SINGLE current "start here" for a product — supersede any
  // older open ones so `catchup` / "pickup X" always shows exactly the freshest.
  if (type === "resume_point") {
    await sb(`agent_activity?product=eq.${product}&event_type=eq.resume_point&status=not.in.(done,resolved)`,
      { method: "PATCH", body: JSON.stringify({ status: "resolved" }) }).catch(() => {});
  }
  const row = {
    product, agent: agentLabel(), session_id: sessionId(product),
    event_type: type, title, status: flag("status", type === "resume_point" ? "in_progress" : "info"),
    detail, refs,
  };
  const out = await sb("agent_activity", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row),
  });
  const id = Array.isArray(out) && out[0] ? out[0].id : "?";
  console.log(`logged #${id} [${product}] ${type}: ${title}`);
}

function line(r) {
  const when = new Date(r.ts).toISOString().replace("T", " ").slice(0, 16);
  const ns = r.detail && r.detail.next_steps ? ` → next: ${[].concat(r.detail.next_steps).join("; ")}` : "";
  const st = r.status && r.status !== "info" ? ` (${r.status})` : "";
  return `  • [${when}] ${r.product} · ${r.event_type}${st}: ${r.title}${ns}  {#${r.id}}`;
}

async function cmdCatchup() {
  const product = flag("product") || detectProduct();
  const hookMode = has("hook");
  // In hook mode (SessionStart), stay silent outside a recognized Shift repo.
  if (hookMode && product === "unknown") return;
  const scope = product && product !== "unknown" ? `&product=eq.${product}` : "";
  const statusScope = product && product !== "unknown" ? `?product=eq.${product}` : "?order=product.asc";
  const status = await sb(`product_status${statusScope}`) || [];
  const open = await sb(`agent_open_threads?order=ts.desc&limit=25${scope}`) || [];
  const recent = await sb(`agent_timeline?order=ts.desc&limit=12${scope}`) || [];
  const latest = await sb(`agent_latest_per_product?order=ts.desc`) || [];

  // Hook mode: emit a compact brief ONLY if there's something worth surfacing.
  if (hookMode) {
    if (status.length === 0 && open.length === 0 && recent.length === 0) return; // nothing → no context noise
    const H = [`🅿️ Shift parking lot — ${product}: current status + where the last agent left off.`];
    if (status.length) { H.push(`STATUS (source of truth):`); status.forEach((r) => H.push(statusLine(r, true))); }
    if (open.length) {
      H.push(`Open threads / handoffs to pick up (${open.length}):`);
      open.slice(0, 6).forEach((r) => H.push(line(r)));
    }
    if (recent.length) {
      H.push(`Recent:`);
      recent.slice(0, 4).forEach((r) => H.push(line(r)));
    }
    H.push(`Run /catchup for the full picture; reconcile local↔prod before continuing; update status with /handoff.`);
    console.log(H.join("\n"));
    return;
  }

  const brief = has("brief");
  const L = [];
  L.push(`🅿️  Shift parking lot — ${product !== "unknown" ? product : "all products"}`);
  if (status.length) {
    L.push(`\nCURRENT STATUS (source of truth):`);
    status.forEach((r) => L.push(statusLine(r, true)));
  } else {
    L.push(`\n(no product_status yet — set it: shiftlog status --set --summary "..." --phase live)`);
  }
  if (open.length) {
    L.push(`\nOpen threads / handoffs (${open.length}) — pick up here:`);
    open.slice(0, brief ? 6 : 25).forEach((r) => L.push(line(r)));
  } else {
    L.push(`\nNo open threads for ${product}. Clean slate.`);
  }
  if (!brief) {
    L.push(`\nRecent activity:`);
    recent.forEach((r) => L.push(line(r)));
    if (product === "unknown" || !scope) {
      L.push(`\nLatest per product:`);
      latest.forEach((r) => L.push(`  • ${r.product}: ${r.event_type} — ${r.title} (${new Date(r.ts).toISOString().slice(0, 10)})`));
    }
  }
  L.push(`\n(Log with /handoff or: node ~/.claude/shift-parking-lot/shiftlog.mjs log --type handoff --title "…". Resolve with: … resolve <id>.)`);
  console.log(L.join("\n"));
}

async function cmdTimeline() {
  const product = flag("product");
  const limit = flag("limit", "20");
  const scope = product ? `&product=eq.${product}` : "";
  const rows = await sb(`agent_timeline?order=ts.desc&limit=${limit}${scope}`) || [];
  console.log(rows.map(line).join("\n") || "(empty)");
}

async function cmdResolve() {
  const id = argv[1];
  if (!id || id.startsWith("--")) return die("resolve needs an id");
  const status = flag("status", "done");
  await sb(`agent_activity?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  console.log(`#${id} → ${status}`);
}

// Collect fast git facts from cwd (no network unless --fetch). These populate the
// `local` side of a product's status so the board reflects real repo state.
function gitFacts() {
  const run = (a) => { try { return execSync(`git ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 }).trim(); } catch { return null; } };
  if (run("rev-parse --is-inside-work-tree") !== "true") return {};
  const local = { branch: run("rev-parse --abbrev-ref HEAD"), head: run("rev-parse --short HEAD") };
  local.dirty = (run("status --porcelain") || "").split("\n").filter(Boolean).length;
  const counts = run("rev-list --left-right --count @{u}...HEAD");
  if (counts) { const m = counts.split(/\s+/); local.behind = +m[0]; local.ahead = +m[1]; }
  return local;
}

function healthDot(h) { return h === "red" ? "🔴" : h === "yellow" ? "🟡" : "🟢"; }
function statusLine(r, detailed = false) {
  const when = new Date(r.updated_at).toISOString().slice(0, 10);
  const loc = r.local || {}, prod = r.prod || {};
  const locs = loc.branch ? `local ${loc.branch}@${loc.head || "?"}${loc.dirty ? ` +${loc.dirty}wip` : ""}${loc.behind ? ` ↓${loc.behind}` : ""}${loc.ahead ? ` ↑${loc.ahead}` : ""}` : "";
  const prods = prod.url ? `live ${prod.url}${prod.live_commit ? ` @${prod.live_commit}` : ""}` : "";
  const rec = r.reconcile && r.reconcile.most_advanced ? ` [ahead: ${r.reconcile.most_advanced}]` : "";
  const L = [`${healthDot(r.health)} ${r.product}  [${r.phase || "?"}]${rec}  ${r.summary || ""}`];
  const meta = [locs, prods].filter(Boolean).join("  ·  ");
  if (meta) L.push(`     ${meta}  (updated ${when} by ${r.updated_by || "?"})`);
  if (detailed) {
    const ns = r.next_steps || [], bl = r.blockers || [];
    if (bl.length) L.push(`     blockers: ${bl.join("; ")}`);
    if (ns.length) L.push(`     next: ${ns.join("; ")}`);
  }
  return L.join("\n");
}

function parseListFlag(s) {
  if (!s) return null;
  try { const j = JSON.parse(s); return Array.isArray(j) ? j : [String(j)]; }
  catch { return s.split("|").map((x) => x.trim()).filter(Boolean); }
}

async function cmdStatus() {
  if (has("set")) {
    const product = flag("product") || detectProduct();
    if (has("fetch")) { try { execSync("git fetch --all --prune", { stdio: "ignore", timeout: 20000 }); } catch { /* ignore */ } }
    const now = new Date().toISOString();
    const payload = { product, updated_by: agentLabel(), updated_at: now, last_verified_at: now, local: gitFacts() };
    if (flag("summary")) payload.summary = flag("summary");
    if (flag("phase")) payload.phase = flag("phase");
    if (flag("health")) payload.health = flag("health");
    const ns = parseListFlag(flag("next")); if (ns) payload.next_steps = ns;
    const bl = parseListFlag(flag("blockers")); if (bl) payload.blockers = bl;
    if (flag("prod")) { try { payload.prod = JSON.parse(flag("prod")); } catch { /* ignore */ } }
    if (flag("reconcile")) { try { payload.reconcile = JSON.parse(flag("reconcile")); } catch { payload.reconcile = { notes: flag("reconcile") }; } }
    const refs = (flag("refs") || "").split(",").map((s) => s.trim()).filter(Boolean); if (refs.length) payload.refs = refs;
    await sb("product_status", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(payload) });
    const l = payload.local;
    console.log(`status updated [${product}] phase=${payload.phase || "?"} health=${payload.health || "?"}${l.branch ? ` | local ${l.branch}@${l.head}${l.dirty ? ` +${l.dirty}wip` : ""}${l.behind ? ` ↓${l.behind}` : ""}` : ""}`);
    return;
  }
  const product = flag("product") || (argv[1] && !argv[1].startsWith("--") ? argv[1] : null);
  const scope = product && product !== "all" ? `?product=eq.${product}` : "?order=product.asc";
  const rows = await sb(`product_status${scope}`) || [];
  if (!rows.length) return console.log("(no product_status yet — set one with: status --set --summary \"...\" --phase live)");
  console.log(`🅿️  Shift product status — source of truth\n`);
  console.log(rows.map((r) => statusLine(r, !!product && product !== "all")).join("\n"));
}

const table = { log: cmdLog, catchup: cmdCatchup, timeline: cmdTimeline, resolve: cmdResolve, status: cmdStatus, board: cmdStatus };
(table[cmd] || (() => die(`unknown command "${cmd}". Use: log | catchup | timeline | resolve`)))();
