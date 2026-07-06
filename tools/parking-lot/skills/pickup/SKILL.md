---
name: pickup
description: Resume work on a Shift product exactly where the last agent (previous OR currently-open) left off. Use when the user says "pickup <product>" (shapeshift, weldshift, realshift, lendshift, gso, finshift, surgeshift, sugarshift, allshift) or /pickup <product>. Pulls the central parking lot first, then the resume memory, then git state.
---

# /pickup <product> — resume where the last agent left off

Land on a product with full current context, sourced from the live cross-agent
parking lot (freshest) plus durable memory. Do these in order:

## 1. Parking lot FIRST (freshest cross-agent state)
```
node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs catchup --product <product>
```
Read the open **resume_point** (the single current "start here"), plus any open
handoffs/blockers and recent activity. This reflects what the previous OR a
currently-open agent last did. Each line ends with its id as `{#id}`.

## 2. Resume memory (durable baseline)
Read the product's resume-point memory file for architecture, gotchas, deploy, and
long-standing constraints (these don't change session to session).

## 3. Reconcile local ↔ prod — adopt the MOST advanced side (either)
The newest work can be on EITHER side — don't blindly trust local OR prod. Gather all
signals and converge on the most advanced/current state. See [[feedback-reconcile-local-prod]].
- `git fetch --all --prune` then `git status -sb`, and note the branch + whether it's the
  branch prod deploys. **Behind origin** → pull (another agent's commits are newer).
- `git status --porcelain` → uncommitted **local WIP is local-ahead work**; it may be the
  most advanced state — preserve it, don't overwrite; consider committing/pushing/deploying it.
- Check what's **LIVE**: `vercel ls` / the app's `/api/version`; Fly (`gso-backend`) →
  `flyctl status`. Prod may also hold newer **migrations/env/data** applied via the Supabase
  Management API or set as Vercel/Fly secrets — never in the local tree.
- **Diverged** (both sides unique, or local on a non-deployed feature branch) → don't guess;
  surface it and integrate deliberately. Never deploy from a branch behind its remote.

## 4. Work — and keep the source-of-truth board current (power-loss-proof)
`catchup`/`status` lead with `product_status` — the single current truth per product. Keep
it accurate as you go (not just at the end), so a new agent could resume exactly here if
power died right now:
```
node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs status --set \
  --summary "<complete current state>" --phase <live|in-dev|feature-complete|paused> \
  --health <green|yellow|red> --next "step1|step2" --blockers "..." \
  --reconcile '{"most_advanced":"local|prod|synced"}'
```
(Auto-collects git facts; a `Stop` hook also auto-syncs git state every turn — but YOU
capture intent/next_steps.) Use `/handoff` for a timeline event; `... resolve <id>` to
close someone's thread. Whole family board: `shiftlog board`.

Product not given? Infer it from the current working directory.
