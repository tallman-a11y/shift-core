---
name: catchup
description: Pull the latest cross-product agent activity from the central Shift parking lot (north-star Supabase) — open handoffs, blockers, decisions, and recent timeline — so you can pick up where other agents left off. Run at the start of work on any Shift product, or to see what's happening across the whole family.
---

# /catchup — pick up where other agents left off

Read the shared, cross-product timeline from the north-star `shift-brain` Supabase and
brief yourself before starting work.

## How
```
node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs catchup
```
- Auto-detects the product from the current directory.
- Whole family (every product): `--product all` (or run from a non-Shift dir).
- A specific product: `--product realshift` (etc.).
- Whole-family status board: `node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs board`
- Full raw feed: `node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs timeline --limit 30 [--product x]`

`catchup` leads with **`product_status`** — the source-of-truth current state of the product
(prod + local + phase + blockers + next). Trust that first, then the open threads below it.

## What to do with it
1. Read **"Open threads / handoffs"** first — those are where work was left off, is
   blocked, or needs review. Each line ends with its id as `{#id}`.
2. Use **Recent activity** for context on what just happened.
3. If you take over an open thread and finish it, resolve it so it drops off the list:
   ```
   node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs resolve <id> --status done
   ```
4. As you work and reach a stopping point, log it with **/handoff** so the next agent
   is set up.

Note: a SessionStart hook already surfaces a brief version of this automatically when
you start in a Shift repo — run `/catchup` when you want the full picture or another
product's threads.
