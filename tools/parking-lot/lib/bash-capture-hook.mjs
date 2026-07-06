#!/usr/bin/env node
// PostToolUse(Bash) hook — auto-captures milestone commands (git push / deploy /
// npm publish) to the parking lot. FAIL-SAFE + NON-BLOCKING: matches with a fast
// regex, fires the log DETACHED (never awaited), and exits immediately. Non-matching
// commands cost only node startup + a regex. Reads the tool payload from stdin.
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("error", () => process.exit(0));
process.stdin.on("end", () => {
  let cmd = "";
  try { cmd = (JSON.parse(Buffer.concat(chunks).toString("utf8")).tool_input || {}).command || ""; }
  catch { return process.exit(0); }
  if (!cmd) return process.exit(0);

  let type = null;
  if (/\bgit\s+push\b/.test(cmd)) type = "commit";
  else if (/\b(flyctl|fly)\s+deploy\b/.test(cmd) || /\bvercel\b[^\n]*\b(deploy|--prod)\b/.test(cmd) || /\bvercel\s+deploy\b/.test(cmd) || /\bnpm\s+publish\b/.test(cmd)) type = "deploy";
  if (!type) return process.exit(0);

  const title = (type === "deploy" ? "Deploy: " : "Pushed: ") + cmd.trim().replace(/\s+/g, " ").slice(0, 140);
  const script = path.join(os.homedir(), ".claude", "shift-parking-lot", "shiftlog.mjs");
  try {
    spawn(process.execPath, [script, "log", "--type", type, "--title", title, "--status", "done",
      "--detail", JSON.stringify({ command: cmd.trim().slice(0, 400), auto: true })],
      { detached: true, stdio: "ignore" }).unref();
  } catch { /* ignore */ }
  process.exit(0);
});
