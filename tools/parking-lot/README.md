# Shift Parking Lot

A central, cross-product **coordination system for dev agents** working on the Shift
family. It's the single source of truth for *what every agent is doing* and *the complete
current status of every product*, so any agent (on any machine) can pick up exactly where
another left off — even after a power loss.

Backed by the north-star **`shift-brain`** Supabase project (`btwpscaeiwwgysfogbno`):

- **`product_status`** — one row per product = its complete current status (summary, phase,
  health, next steps, blockers, prod state, local git state, which side is ahead). **The
  source of truth.**
- **`agent_activity`** — append-only timeline of every agent action (handoffs, decisions,
  commits, deploys, blockers) + views (`agent_open_threads`, `agent_timeline`, …).

This is distinct from `shift_brain_events`, which is the products' *runtime AI* corpus.

## Install (any machine)

```bash
# with the service key in an env var:
SHIFT_PARKING_LOT_KEY=<service_role_jwt> node tools/parking-lot/install.mjs

# or auto-fetch the key with a Supabase Management PAT:
SUPABASE_PAT=<pat> node tools/parking-lot/install.mjs

# or, if ~/.claude/shift-parking-lot.json already exists:
node tools/parking-lot/install.mjs
```

Installs into `~/.claude/` (per-machine, so the secret never lives in the repo):
- `shift-parking-lot/` — the `shiftlog.mjs` helper + 3 hooks
- `skills/{handoff,catchup,pickup}/` — the slash-command skills
- `shift-parking-lot.json` — config (url + service key), `0600`
- merges `SessionStart` + `PostToolUse(Bash)` + `Stop` hooks into `settings.json` (idempotent)

Restart Claude Code sessions afterward so the skills/hooks load. Smoke test:
`node ~/.claude/shift-parking-lot/shiftlog.mjs board`.

## How agents use it

- **Start of work** → `/catchup` (or the `SessionStart` hook auto-surfaces it) — leads with
  the product's `product_status`, then open threads.
- **"pickup <product>"** → reconcile local ↔ prod (adopt the most advanced side), then resume.
- **As you work** → `status --set` keeps the source-of-truth board current; `/handoff` logs
  timeline events. Commits/deploys auto-log; a `Stop` hook auto-syncs git state every turn
  (the power-loss safety net).
- **Family board** → `node ~/.claude/shift-parking-lot/shiftlog.mjs board`

## Helper commands

```
shiftlog status --set --summary "..." --phase live --health green --next "a|b" \
                --blockers "..." --reconcile '{"most_advanced":"local|prod|synced"}'
shiftlog status [--product X]          # one product (detailed)
shiftlog board                         # all products
shiftlog catchup [--product X]         # status + open threads + recent
shiftlog log --type handoff --title "..." --detail '{"next_steps":[...]}'
shiftlog timeline [--product X] [--limit N]
shiftlog resolve <id> [--status done]
```

## Editing

The repo copies under `lib/` and `skills/` are canonical. Edit them, then re-run
`install.mjs` to propagate to `~/.claude`. (Keep this machine's `~/.claude` in sync by
re-installing after repo edits, or copy the other way and commit.)
