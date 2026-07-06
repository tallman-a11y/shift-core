---
name: handoff
description: Log a handoff, resume-point, decision, or blocker to the central Shift parking lot (north-star Supabase) so any agent on any Shift product can pick up where you left off. Use when finishing a chunk of work, hitting a blocker, making a cross-cutting decision, or handing off.
---

# /handoff — log to the central Shift parking lot

Record what you just did (or a blocker / next-steps) to the shared, cross-product
timeline in the north-star `shift-brain` Supabase, so other agents — on this product
or any other Shift product — can continue seamlessly. This is the shared successor to
per-repo `PLATFORM_BRAIN.md` notes.

## How
Run the helper (it auto-detects product from the current directory, plus agent + session):

```
node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs log \
  --type <type> --title "<one-line summary>" --status <status> \
  --detail '{"next_steps":["...","..."],"files":["..."],"notes":"...","commit":"<sha>","urls":["..."]}' \
  --refs <comma,separated,related,products,or,files>
```

- `--title` and `--type` are required; everything else is optional.
- Override product only if the cwd isn't the repo: `--product` = one of
  `gso | lendshift | realshift | weldshift | shapeshift | finshift | surgeshift | sugarshift | allshift | shift-core`.

## Choosing type + status
- **handoff** (default stopping point) — status `in_progress` if there's more to do, `done` if complete.
- **blocker** — status `blocked`; put the exact ask in `next_steps` so the next agent knows what's needed.
- **decision** — a cross-cutting choice other agents should honor; status `info`.
- **resume_point** — the canonical "start here next time" for a product; status `in_progress`.
- **progress / deploy / commit** — milestones (commits & deploys are also auto-captured by a hook).

## Also update the source-of-truth board
A handoff is a timeline event. The **current complete status** of the product lives in
`product_status` — update it at the same time so the board (`shiftlog board`) and the next
"pickup" reflect reality:
```
node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs status --set \
  --summary "<complete current state>" --phase <live|in-dev|...> --health <green|yellow|red> \
  --next "step1|step2" --blockers "..." --reconcile '{"most_advanced":"local|prod|synced"}'
```
(Auto-collects git facts. A `Stop` hook auto-syncs git state every turn; you supply intent.)

## Guidance
- Keep the title tight; put the actionable substance in `detail.next_steps` (that's what
  `/catchup` surfaces first).
- One handoff per meaningful stopping point — don't spam.
- If you just resolved someone else's open thread, also resolve it:
  `node C:/Users/tyler/.claude/shift-parking-lot/shiftlog.mjs resolve <id> --status done`
