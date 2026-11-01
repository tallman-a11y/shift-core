# Will-First UI — the Shift Concierge

**Spec v1 · 2026-10-31 · status: PROPOSED (nothing built yet)**
Owner: Tyler. Author: Claude. Canonical copy lives here in shift-core because the engine piece ships in `@allshift/ui` / `@allshift/core`; each product's `PLATFORM_BRAIN.md` §B points at this file.

---

## 0. The vision (Tyler, Saturday 2026-10-31)

> From the moment someone lands on the webpage or downloads the app, Will is there: *"Good afternoon friend — enter an email and create a password and let's dive in."* The second the account exists: *"Great, first things first, what's your name? You can give microphone permission to answer with your voice, or type in the Shift box below."* They answer. *"Hello X, nice to meet you. You're looking at the onboarding forms — keep typing your answers, but I'm here if you have questions, and I can type all this in for you if you'd like. I can ask and you tell me. I'm your personal assistant."*
>
> Movie-style. Fully conversational, taken further than today's companion. Smooth, anyone can use it, **no learning curve.** Applies to every Shift product that has the generative UI.

The scripts above are the *feel*, not final copy.

## 1. The laws

1. **Will speaks first.** At every threshold (landing, account created, each onboarding step, completion) Will opens his mouth before the user has to find anything. Nobody hunts for a mic or a chat button.
2. **Two channels, always both open.** Voice and the **Shift box** (one text input). The user can switch mid-sentence. The forms stay visible and typeable the whole time.
3. **Will fills the form, the form saves.** "I can type this in for you" is literal: Will writes into the on-screen fields (with a visible fill animation), then the user confirms and the form's *existing* save path runs. Will never writes onboarding data to the database directly. One writer, same validation, same triggers.
4. **Zero learning curve.** No modes, no settings, no discovery. If a first-timer has to figure anything out, we failed.
5. **One Will.** Same engine, same voice (ElevenLabs *Will*), same Shift Bar states, same timing rules (Companion Standard) in every product. Products supply scripts and field maps, never a fork.
6. **Honest about permission.** Will asks for the mic in his own words, once, with two visible choices. A "no" is final for the session and the text path is first-class, not a fallback.
7. **Host, not badge.** During onboarding the Shift box is the one persistent control on the page (No-Permanent-AI-Badges law). When onboarding ends it hands off to the product's normal companion pill. Never two Wills on screen.
8. **Captions always.** Every spoken line is also text in the transcript (`aria-live`). Reduced motion honored. Keyboard-first.

## 2. The experience — moments

| # | Moment | Trigger | Will | Screen |
|---|---|---|---|---|
| 0 | **Landing** | signed-out visit to `/` (web) or app cold start without session | time-of-day greeting; invites email + password | hero becomes the signup: email, password, one button. Will's line **live-types as text** immediately. Voice starts on the first gesture (focusing the email field counts). In the App Store shells autoplay is granted, so Will speaks from the first frame. |
| 1 | **Account created** | `signUp` returns a session | "First things first, what's your name? Use your voice or type in the Shift box." | permission card with two choices: **Use my voice** / **I'll type**. Only the first tap triggers `getUserMedia`. |
| 2 | **Meet** | name captured | "Hello X, nice to meet you. You're looking at the onboarding…" | onboarding renders **on the living canvas** as a window; fields assemble with `GenerativeView`. Shift box docked (bottom on phones, right column on wide). |
| 3 | **Fill** | user speaks/types facts ("Kansas City, flipping, about forty thousand") | maps facts → fields, fills them with a typing animation, confirms: "Here's what I've got — keep going?" | filled fields highlight; nothing is saved until the user taps **Next** or says "yes / next". Will can also ask the step's questions one at a time on request ("ask me"). |
| 4 | **Done** | last step saved via existing `finish` / `saveProfile` | "You're set — this is your canvas." | hands off to what already exists: Command Center guided start / TodayPrompt / FirstRunShift / InterfaceWalkthrough. The Shift box becomes the companion pill. |
| R | **Returning** | session exists at `/` or app open | "Welcome back, X." + the product's brief (RealShift already speaks it in the shell) | login inline if the session is stale. v1 scope: greeting only; brief unification is Phase 5. |

**Interruption rules.** Tapping anywhere while Will speaks pauses him; typing into a field pauses narration; "stop" / "quiet" mutes voice for the session (per-device flag); Escape closes the transcript. The question window after a Will question is 15 s (Companion Standard), then the mic closes quietly.

**Phone (Duo).** Portrait only. Form window on top, Shift box docked beneath. The dock is 100% wide and never exceeds 390 px (phone-shell law). When the keyboard is up the Shift box stays visible (`visualViewport` resize → dock pins to the keyboard top).

## 3. Architecture

### 3.1 Shared — `@allshift/ui` 0.7.0, new `src/concierge/`

| Piece | What it is |
|---|---|
| `concierge.ts` | Pure state machine (vitest, like `duo.ts`): moments 0→4, step index, field registry snapshot, pending fills, `voiceUnlocked`, `micChoice` (`unset`/`voice`/`text`/`denied`), mute flag. Reducer + selectors, no React. |
| `FieldRegistry` + `<ConciergeField>` | `registerField({ id, label, type, options?, required, get, set, validate })`. `<ConciergeField id label>` wraps a plain input/select and registers it automatically; plays the fill animation when Will sets it. Snapshot (`ids, labels, options, current values`) is what the brain sees. |
| `<ShiftConcierge>` | The host: transcript of Will's lines (live-typed), the Shift box (text + one mic button showing `ShiftBar` state), the permission card. Layout: `dock` (phone) / `column` (wide). Brand-neutral — colors via `--shift-*` tokens. |
| `useAudioGate()` | Canonical audio unlock (today each product has its own `initAudioUnlock`): `canSpeak`, first gesture listener, app-shell detection (UA `*ShiftApp/`) → immediate. Queues scripted lines as text until unlocked, then speaks the *current* line (never replays the backlog). |
| `ConciergeScript` type | `{ product: { name, noun }, lines: { landing(ctx), askName, meet(name), step(stepId, ctx), confirmFill(summary), done(name) } }` — product supplies strings/functions. Dynamic replies come from the brain route. |
| `useConcierge({ script, api, speak, listen })` | Glue: runs the machine, calls TTS, drives STT, posts to the API adapter, applies `fill_fields` results to the registry. |

### 3.2 Shared — `@allshift/core` 0.6.0, `concierge` tool pack

- Tools: `fill_fields({ fields: [{ id, value }] })`, `next_step()`, `prev_step()`, `explain_field({ id })`, `set_name({ name })`, `ask_me()` (Will asks the step's questions in order).
- `publicConciergeHandler()` — for the **signed-out** moments (0 and 1): Haiku, no memory, no product data, only `set_name`, per-IP rate limit, transcript never stored. Products mount it at `app/api/concierge/public/route.ts`.
- After login the product's **existing** companion route takes over with the concierge pack added and the field-registry snapshot injected into the system prompt. One brain, one persona.
- TTS for scripted lines is a **cache hit**: every static script line is pre-synthesized into the shared `tts-cache` at build time, so a landing greeting costs zero ElevenLabs calls per visitor. Dynamic answers synthesize on demand under the existing per-IP/day limits.

### 3.3 Per product (thin)

1. The `ConciergeScript` strings.
2. Field map: wrap the onboarding inputs in `<ConciergeField>` (ids = the existing state keys). The step's existing `finish()` / `saveProfile` stays the only DB writer.
3. Mount `<ShiftConcierge>` on `/`, signup, and onboarding — exactly the paths where the companion is hidden today. The companion stays hidden there (law 7).
4. Onboarding page wraps its form in `CanvasProvider` with one `locked` window (the form). `GenerativeView` assembles the fields.
5. Open the `/api/voice/speak` route to signed-out callers with IP + daily limits (RealShift and AgentShift already do; FundShift and AbleShift require login today).
6. Playwright acceptance run (section 6) on iPhone 13 emulation + desktop.

**STT.** Web Speech where the browser has it. The server transcribe route requires login in every product, so signed-out Moment 1 is Web-Speech-only; if unsupported Will says "type it below" and moves on. After login both paths work (MediaRecorder → `/api/voice/transcribe`), exactly as the companion does now.

## 4. Per-product plan (what exists → what changes)

### RealShift — canon, first
- **Today:** `app/signup/SignupClient.tsx` (name/email/password, client `signUp`, "check your email" when no session); 6-step `OnboardingWizard` (About You → Your Path → *Shift Says Hi* stream → Capital → Strategy → Launch) saved by server action `saveProfile` → `profiles.onboarding_complete=true`; `ShiftCompanion` returns null on `/`, `/signup`, `/onboarding`; `update_profile` tool writes DB directly; `/api/voice/speak` already open with limits; mobile has its own native 5-step onboarding.
- **Changes:** hero → inline email + password (name moves to Moment 1 and prefills `display_name`); delete the stream-only *Shift Says Hi* step (Moment 2 *is* that moment, spoken); wrap the five remaining steps' inputs in `<ConciergeField>`; mount `ShiftConcierge` on the three hidden paths; onboarding on `CanvasProvider`; in concierge mode the brain uses `fill_fields`, not `update_profile`; `property_intent` (currently unsaved) either saved or dropped — decide. **Mobile:** retire `app/onboarding.tsx` native flow, load web `/onboarding` in the canvas WebView like AgentShift does (one onboarding to maintain); login screen gets Will's greeting (autoplay OK in shell).
- **Blocker:** web `signUp` can return no session when email confirmation is on, which strands Moment 1. See decision 1.

### AgentShift
- **Today:** `app/signup/page.tsx` (full_name/email/password → `/onboarding`); 7-step wizard (Welcome, License, CompPlan, Market, ShiftLine-skip, Sphere csv/paste/fresh, Ready) drafted in `sessionStorage`, `finish()` updates `agents` + `onboarded_at`; text-only `ShiftPanel` on `/api/ai/onboarding-chat` (no tools); companion hidden on `/`, `/login`, `/signup`, `/onboarding`; speak route open; mobile already loads web `/onboarding` in `mode: "onboarding"` and grants mic.
- **Changes:** hero inline signup; replace `ShiftPanel` with `ShiftConcierge`; `<ConciergeField>` on License/CompPlan/Market (CompPlan's ranges and percents are the hardest fills — Will must read back numbers: "eighty-twenty split, cap sixteen thousand"); Sphere step: Will offers paste-your-contacts by voice? No — v1 keeps csv/paste/fresh as buttons and Will explains them; `app/onboarding/layout.tsx` gets `CanvasProvider`; keep the 1.5 s `FirstRunShift` handoff as Moment 4.

### FundShift (lender side)
- **Today:** marketing landing; `SignupForm` (full_name/"Work Email"/password, 2 s timeout then `/dashboard/onboarding`); 6-step lender onboarding (Welcome, Credentials nmls/title/phone, Specialties required, Where states+markets, Social, Done listPublic) → `profiles.onboarded=true` + nurture; text-only `ShiftPanel`; companion mounted on `/dashboard/*` only (so it *is* on onboarding today — two helpers); speak and transcribe routes require login; mobile has no signup at all; borrower side has no onboarding.
- **Changes:** hero inline signup (name → Moment 1); replace `ShiftPanel` and hide the dashboard companion on `/dashboard/onboarding` while the concierge is mounted; `<ConciergeField>` across the 5 field steps (Specialties is a multi-toggle — `fill_fields` accepts arrays); open `/api/voice/speak` to signed-out IPs with limits; onboarding on `CanvasProvider`. **Mobile:** "Create account" on `app/login.tsx` opens the web landing in the shell (`?shell=1`) — the landing *is* the signup now. Borrower onboarding: out of scope v1.

### AbleShift — invite-first variant
- **Today:** no signup anywhere (admin creates users; `/auth/callback` handles invite links), no onboarding, `ShiftBar` mounted only in the coordinator app `/app`, all brain tools read-only by design, speak route requires login, `/m` portal for mentors/family, no mobile app. Bug: a signed-in user with no `profiles` row loops `/login → /go → /login`.
- **Changes:** Will-first applies to **invite acceptance**: callback lands on a `/welcome` page where Will says "Welcome to AbleShift — {org} invited you. Set a password and let's get you set up," then a two-field profile completion (`full_name` confirm, `phone`; `title` for staff) through `<ConciergeField>`, then Will tours Command Center (Moment 4 → existing canvas `[/app/today, /app/schedule]`). `/login` gets Will's greeting (login stays fully functional without him). `/m` gets the dock in Phase 3 for mentors and family — this is the product where "anyone can use it" matters most, so Will also offers "I can make the text bigger" (a `large-text` body class, persisted per device). Prerequisite: fix the no-profile loop. Tools stay read-only — `fill_fields` only touches the form, which matches their design.

### GroundShift (GSA) — contractor + driver variant (Tyler, 2026-11-01: "I'm going to want GroundShift to have this as well")

- **Today:** marketing landing (`/`) → "Get Early Access" → `/register` (contractor name → auto contractor_id, first/last name, email, password → Express `/auth/register` + `/auth/login` JWT, not Supabase Auth) → `/dashboard` with **no first-run setup**. Drivers never register: `/driver/login` is pick-your-name + PIN. Frontend already ships `@allshift/ui` 0.5 + core 0.5 (companion on the dashboard canvas).
- **Changes (contractor side):** bump to ui 0.7 / core 0.6; `lib/concierge/script.ts` in GroundShift's voice ("Good evening, boss. Tell me your company name and I'll set up your account"); `<ShiftConcierge moment="landing">` on `/` and `/register` (auto-float); `<ConciergeField>` around the five register fields (Will fills `contractor_name`, `first_name`, `last_name`, `email`; the password he never fills — he explains it). New **first-run wizard** `/setup` (Moment 3) mounted right after register: step 1 station + CSA number(s) (default a single CSA), step 2 fleet shape (routes per day, drivers, trucks ≥50 cu, 401/pickup preference), step 3 nightly report (phone for SMS at 20:30 CT, email). Existing backend writers only (`/api/contractors/:id`, settings routes); nothing new persists from the concierge. Moment 4 → Will tours the canvas (`/dashboard`, `/dashboard/scheduling`, `/dashboard/optimizer`).
- **Changes (driver side):** `/driver/login` gets Will's greeting ("Pick your name and type your PIN — or just tell me who you are") with `set_name` matching the driver list; PIN is typed only. The native driver app (Expo) inherits the same script through the web view later (Phase 4 shells).
- **API:** `/api/concierge` as RealShift's, calling `runConcierge` with `signedIn=false` on landing/register and `true` on `/setup`; the speak route is already open to the dashboard — open it to signed-out callers with IP + daily caps.
- **Phase:** 2b, after AgentShift + FundShift, before AbleShift (contractor acquisition is the paying funnel).

## 5. Build order

| Phase | Scope | Exit |
|---|---|---|
| **0 Engine** (shift-core) | `concierge.ts` + tests, `FieldRegistry`/`ConciergeField`, `ShiftConcierge` dock+column, `useAudioGate`, script type → **ui 0.7.0**; concierge tool pack + `publicConciergeHandler` → **core 0.6.0**. Publish via `shift-ops/publish-ui.ps1` (granular token, Tyler). | vitest green; Storybook-free demo page in `packages/ui` probed at 390 px. |
| **1 RealShift** | Moments 0–4 end-to-end web, Duo phone probe, acceptance suite below, decision 1 resolved. Ship behind `NEXT_PUBLIC_CONCIERGE=1` first, then default on. | prod run of the acceptance suite; Tyler walks it on his phone. |
| **2 AgentShift + FundShift** | Script + field map + mounts (recipe from Phase 1). | same suite per product. |
| **2b GroundShift** | ui/core bump + register fields + `/setup` first-run wizard + `/driver/login` greeting + open speak route. | suite on `/register` → `/setup` → `/dashboard`; driver PIN flow. |
| **3 AbleShift** | invite variant + `/login` greeting + `/m` dock + large-text. | suite + a screen-reader pass. |
| **4 Shells** | RealShift native onboarding retired → web; FundShift mobile "Create account"; first-frame speech in all three shells; new EAS builds. | TestFlight walk on iPhone + iPad. |
| **5 Returning** | one "welcome back + brief" moment across the family (RealShift's spoken brief as the model). | later. |

Guardrails that apply throughout: phone-shell 390 px law, Fluid-UI law (nothing fixed-size in canvas blocks), No-Permanent-AI-Badges, Apple WebView laws, Store-shell review standard (the reviewer's demo login must work with Will muted and no mic), check `PLATFORM_BRAIN.md` before each product's build, `npx eslint .` + `tsc` before push, never OTA a build under review.

## 6. Acceptance (Playwright, iPhone 13 emulation + desktop, per product)

1. **Landing:** Will's first line is visible as text within 1 s of load with no click; no `getUserMedia` and no audio element plays before a gesture; focusing the email field unlocks audio and `speak` is called exactly once.
2. **Signup → name:** create account → permission card shows two choices → choose *I'll type* → type a name in the Shift box → "Hello {name}" line within 3 s; `full_name` metadata set.
3. **Fill:** on the strategy/market step type "Kansas City, flipping, about 40k" → the mapped fields fill and highlight; **no** profile row change until Next; Next → row written through the existing save path; completion flag true.
4. **Decline mic:** choose *I'll type* → no second permission prompt anywhere later in onboarding.
5. **Phone:** `innerWidth === 390`, dock width ≤ 390, form window above the dock, Shift box still visible with the keyboard open (viewport resize simulated).
6. **Reviewer path:** muted + no mic → login and onboarding complete by typing only; nothing blocks on voice.
7. **Cost:** scripted lines served from `tts-cache` (cache header / no ElevenLabs call in logs).

## 7. Decisions for Tyler

1. **Email confirmation on web signup.** Recommend auto-confirm for all three self-serve products (mobile already auto-confirms) with a soft "verify your email" banner later, so Moment 1 never strands. Alternative: magic link, with Will saying "I just sent you a link — tap it and I'll be right here."
2. **Landing = signup.** Email + password live in the hero on RealShift, AgentShift, FundShift. Name is asked by Will after.
3. **Mic ask at Moment 1 only** (recommended), never on the landing page.
4. **RealShift native onboarding → web.** Retire the Expo 5-step flow so there is one onboarding to keep in sync.
5. **AbleShift invite-first variant** as written in section 4.
6. **RealShift `property_intent`:** save it (new column) or drop the step.

## 8. Related

Memory: `project_shift_will_first_ui`, `reference_shift_companion_standard`, `project_shift_duo` (window caps + Duo), `feedback_shift_no_permanent_ai_badges`, `feedback_shift_fluid_ui_law`, `reference_apple_webview_laws`, `feedback_shift_store_shell_standard`. Engine: `packages/ui/src/canvas/duo.ts`, `packages/ui/src/voice/*`.
