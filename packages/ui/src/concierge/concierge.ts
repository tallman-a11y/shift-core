// ── Shift Concierge — the Will-first onboarding engine (pure rules) ──────────
// From the first second on a landing page or app open, Will greets the visitor,
// walks them through signup and onboarding by voice or the Shift box, and can
// fill the on-screen form fields for them. These are the rules with no React in
// them, shared by the hook, the host component and the tests.
//
// Laws (docs/WILL_FIRST_UI.md): Will speaks first at every threshold; voice and
// text are always both open; Will fills the FORM and the form saves (never the
// database directly); a "no" to the microphone is final for the session.

export type Moment = "landing" | "askName" | "meet" | "fill" | "done";
export type MicChoice = "unset" | "voice" | "text" | "denied";
export type FieldType = "text" | "number" | "money" | "tel" | "email" | "select" | "multi";

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  required?: boolean;
  /** One line Will can use to explain the field ("Rough number is fine"). */
  hint?: string;
}

export interface FieldSnapshot extends FieldSpec {
  value: unknown;
}

export interface FillRequest {
  id: string;
  value: unknown;
}

export type FillResult =
  | { id: string; ok: true; value: unknown }
  | { id: string; ok: false; reason: string };

export interface Line {
  id: string;
  who: "will" | "user";
  text: string;
  at: number;
}

export interface ConciergeState {
  moment: Moment;
  name: string | null;
  micChoice: MicChoice;
  muted: boolean;
  voiceUnlocked: boolean;
  lines: Line[];
  busy: boolean;
}

export type ConciergeEvent =
  | { type: "unlockVoice" }
  | { type: "chooseMic"; choice: MicChoice }
  | { type: "setName"; name: string }
  | { type: "will"; text: string; id?: string }
  | { type: "user"; text: string; id?: string }
  | { type: "moment"; moment: Moment }
  | { type: "mute"; muted: boolean }
  | { type: "busy"; busy: boolean };

export const MAX_LINES = 40;

export function initialConciergeState(moment: Moment = "landing"): ConciergeState {
  return { moment, name: null, micChoice: "unset", muted: false, voiceUnlocked: false, lines: [], busy: false };
}

let lineSeq = 0;
export function nextLineId(): string {
  lineSeq += 1;
  return `l${Date.now().toString(36)}${lineSeq}`;
}

export function conciergeReducer(state: ConciergeState, ev: ConciergeEvent): ConciergeState {
  switch (ev.type) {
    case "unlockVoice":
      return state.voiceUnlocked ? state : { ...state, voiceUnlocked: true };
    case "chooseMic":
      // A denial is final for the session — the text path is first-class.
      if (state.micChoice === "denied" && ev.choice === "voice") return state;
      return { ...state, micChoice: ev.choice };
    case "setName":
      return { ...state, name: ev.name };
    case "will":
    case "user": {
      const line: Line = { id: ev.id ?? nextLineId(), who: ev.type, text: ev.text, at: Date.now() };
      const lines = [...state.lines, line];
      return { ...state, lines: lines.length > MAX_LINES ? lines.slice(lines.length - MAX_LINES) : lines };
    }
    case "moment":
      return state.moment === ev.moment ? state : { ...state, moment: ev.moment };
    case "mute":
      return { ...state, muted: ev.muted };
    case "busy":
      return { ...state, busy: ev.busy };
    default:
      return state;
  }
}

// ── Greeting ─────────────────────────────────────────────────────────────────

export function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Names ────────────────────────────────────────────────────────────────────
// "my name is tyler", "I'm Tyler.", "it's tyler allman", "call me T" → "Tyler".
// Returns null when the utterance doesn't look like a name (so the caller can
// hand it to the model instead of saving "I'd rather not say" as a name).

const NAME_PREFIX = /^(?:hi|hello|hey|yo|um+|uh+|well|so|ok(?:ay)?)[,.!\s]+/i;
const NAME_LEAD = /^(?:my name(?:'s| is)|i am|i'm|im|it's|its|this is|call me|name's|name is|they call me)\s+/i;

export function cleanName(raw: string): string | null {
  let s = raw.trim().replace(/\s+/g, " ");
  if (!s) return null;
  s = s.replace(NAME_PREFIX, "");
  s = s.replace(NAME_LEAD, "");
  s = s.replace(/[.!?,;:"']+$/g, "").trim();
  // "tyler, nice to meet you" → "tyler"
  s = s.split(/[,.!?;]/)[0].trim();
  if (!s) return null;
  const words = s.split(" ");
  if (words.length > 4) return null;
  if (!/^[\p{L}\p{M}'’\-\s]+$/u.test(s)) return null;
  const titled = words
    .map((w) => (w.length <= 1 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
  return titled.slice(0, 60);
}

// ── Values ───────────────────────────────────────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

/** "$40,000" | "40k" | "about 40 thousand" | "1.2m" | "forty thousand" → 40000 … */
export function parseMoney(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  let s = input.toLowerCase().replace(/[$,]/g, "").replace(/\b(about|around|roughly|approximately|maybe|like)\b/g, "").trim();
  if (!s) return null;
  let mult = 1;
  if (/\b(million|mil|mm)\b|m$/.test(s)) mult = 1_000_000;
  else if (/\b(thousand|grand)\b|k$/.test(s)) mult = 1_000;
  s = s.replace(/\b(million|mil|mm|thousand|grand)\b/g, "").replace(/[km]$/, "").trim();
  const num = Number(s);
  if (Number.isFinite(num) && s !== "") return Math.round(num * mult);
  // Number words: "forty", "forty five", "two hundred"
  const words = s.split(/[\s-]+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let sawWord = false;
  for (const w of words) {
    const n = WORD_NUMBERS[w];
    if (n === undefined) {
      if (w === "and") continue;
      return null;
    }
    sawWord = true;
    if (n === 100) current = Math.max(current, 1) * 100;
    else current += n;
  }
  total += current;
  return sawWord ? Math.round(total * mult) : null;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

// "flipping" ~ "flip", "rental" ~ "rent": same word or one is a 4+ char prefix of the other.
function stemEq(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  return a.startsWith(b) || b.startsWith(a);
}

function uniqueBest(options: FieldOption[], score: (o: FieldOption) => number): FieldOption | null | undefined {
  const scored = options.map((o) => ({ o, s: score(o) })).filter((x) => x.s > 0);
  if (!scored.length) return undefined; // nothing matched at all → caller may try another source
  const best = Math.max(...scored.map((x) => x.s));
  const top = scored.filter((x) => x.s === best);
  return top.length === 1 ? top[0].o : null; // a tie is ambiguous → refuse rather than guess
}

/**
 * Match a spoken/typed value to one option: exact value or label first, then
 * word-stem matches against label + value ("flipping" → Fix & Flip), then the
 * description ("airbnb" → Short-Term Rental). Ties are refused — Will asks.
 */
export function matchOption(options: FieldOption[], value: unknown): FieldOption | null {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (!v) return null;
  const exact = options.find((o) => o.value === v) ?? options.find((o) => o.label === v);
  if (exact) return exact;
  const nv = norm(v);
  const ci = options.find((o) => norm(o.value) === nv) ?? options.find((o) => norm(o.label) === nv);
  if (ci) return ci;
  const inTok = tokens(v);
  if (!inTok.length) return null;
  const byWords = uniqueBest(options, (o) => {
    const ot = Array.from(new Set([...tokens(o.label), ...tokens(o.value)]));
    return inTok.filter((t) => ot.some((x) => stemEq(t, x))).length;
  });
  if (byWords !== undefined) return byWords;
  const byDesc = uniqueBest(options, (o) => {
    if (!o.description) return 0;
    const dt = tokens(o.description);
    return inTok.filter((t) => dt.some((x) => stemEq(t, x))).length;
  });
  return byDesc ?? null;
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== "string") return value === null || value === undefined ? [] : [String(value)];
  return value
    .split(/\s*(?:,|;|\band\b|\bplus\b|\n)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Coerce a value Will proposed into what the field accepts, or say why not. */
export function coerceFill(spec: FieldSpec, value: unknown): FillResult {
  const { id } = spec;
  switch (spec.type) {
    case "select": {
      const opt = matchOption(spec.options ?? [], value);
      return opt ? { id, ok: true, value: opt.value } : { id, ok: false, reason: `"${String(value)}" is not one of the choices` };
    }
    case "multi": {
      const parts = splitList(value);
      if (parts.length === 0) return { id, ok: false, reason: "nothing to add" };
      if (spec.options?.length) {
        const vals = parts.map((p) => matchOption(spec.options!, p)?.value).filter((v): v is string => !!v);
        if (!vals.length) return { id, ok: false, reason: "none of those matched the choices" };
        return { id, ok: true, value: Array.from(new Set(vals)) };
      }
      return { id, ok: true, value: Array.from(new Set(parts)) };
    }
    case "number":
    case "money": {
      const n = parseMoney(value);
      return n === null ? { id, ok: false, reason: `"${String(value)}" is not a number` } : { id, ok: true, value: n };
    }
    case "tel": {
      const digits = String(value ?? "").replace(/[^\d+]/g, "");
      return digits.replace(/\D/g, "").length >= 7
        ? { id, ok: true, value: String(value).trim() }
        : { id, ok: false, reason: "that doesn't look like a phone number" };
    }
    case "email": {
      const s = String(value ?? "").trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? { id, ok: true, value: s } : { id, ok: false, reason: "that doesn't look like an email" };
    }
    case "text":
    default: {
      const s = Array.isArray(value) ? value.join(", ") : String(value ?? "").trim();
      return s ? { id, ok: true, value: s } : { id, ok: false, reason: "empty" };
    }
  }
}

/** Coerce a batch against the live snapshot; unknown ids fail instead of throwing. */
export function coerceFills(fields: FieldSnapshot[], fills: FillRequest[]): FillResult[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  return fills.map((f) => {
    const spec = byId.get(f.id);
    return spec ? coerceFill(spec, f.value) : { id: f.id, ok: false as const, reason: "no such field on this step" };
  });
}

/** The field list as the model sees it: ids, labels, choices, current values. */
export function snapshotForPrompt(fields: FieldSnapshot[]): string {
  if (!fields.length) return "(no fields on this step)";
  return fields
    .map((f) => {
      const cur = f.value === null || f.value === undefined || f.value === "" || (Array.isArray(f.value) && !f.value.length)
        ? "empty"
        : `"${Array.isArray(f.value) ? f.value.join(", ") : String(f.value)}"`;
      const opts = f.options?.length ? ` choices: ${f.options.map((o) => `${o.value}=${o.label}`).join(" | ")}` : "";
      return `- ${f.id} — ${f.label} [${f.type}${f.required ? ", required" : ""}] currently ${cur}.${opts}${f.hint ? ` (${f.hint})` : ""}`;
    })
    .join("\n");
}

/** "I put Kansas City under markets and Fix & Flip under strategy." */
export function summarizeFills(fields: FieldSnapshot[], results: FillResult[]): string {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const ok = results.filter((r): r is Extract<FillResult, { ok: true }> => r.ok);
  if (!ok.length) return "";
  const parts = ok.map((r) => {
    const spec = byId.get(r.id);
    const label = spec?.label ?? r.id;
    const shown = spec?.type === "select" && spec.options
      ? spec.options.find((o) => o.value === r.value)?.label ?? String(r.value)
      : Array.isArray(r.value) ? r.value.join(", ") : spec?.type === "money" ? `$${Number(r.value).toLocaleString()}` : String(r.value);
    return `${shown} under ${label}`;
  });
  return parts.length === 1 ? `I put ${parts[0]}.` : `I put ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
}

/** Does this Will line expect an answer? (Opens the mic window after speaking.) */
export function endsWithQuestion(text: string): boolean {
  return /\?\s*$/.test(text.trim());
}
