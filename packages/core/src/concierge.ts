// ── Shift Concierge — server side ────────────────────────────────────────────
// The tool pack and prompt builder behind Will-first onboarding. Every tool here
// is a UI ACTION the client performs (fill a form field, move a step, remember a
// name) — nothing writes a database. The route collects the actions the model
// asked for and hands them back with Will's reply; the page applies them through
// its field registry, and the form's own save path remains the only writer.
//
// Two modes:
//   signed-out  (landing, "what's your name?") — set_name only, no product data.
//   signed-in   (onboarding)                   — fill_fields / next_step / prev_step /
//                                                explain_field / ask_me + the field snapshot.

import type { ModelProvider, ProviderMessage, ProviderTool } from './model.js';

export type ConciergeMoment = 'landing' | 'askName' | 'meet' | 'fill' | 'done';

export interface ConciergeFieldSnapshot {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  value: unknown;
}

export interface ConciergeContext {
  product: {
    name: string;
    /** What a user of this product is, in one or two words: "real estate investor". */
    noun: string;
    /** One paragraph Will may draw on before login (what the product does, price, no promises). */
    blurb: string;
  };
  moment: ConciergeMoment;
  signedIn: boolean;
  name?: string | null;
  stepTitle?: string;
  stepIndex?: number;
  stepCount?: number;
  fields?: ConciergeFieldSnapshot[];
  /** Short Q&A Will may use for pre-login questions. */
  faq?: string;
}

export type ConciergeAction =
  | { type: 'fill_fields'; fields: Array<{ id: string; value: unknown }> }
  | { type: 'set_name'; name: string }
  | { type: 'next_step' }
  | { type: 'prev_step' }
  | { type: 'explain_field'; id: string }
  | { type: 'ask_me' };

export interface ConciergeTurn {
  text: string;
  actions: ConciergeAction[];
  toolsInvoked: string[];
}

export const CONCIERGE_TOOL_NAMES = ['fill_fields', 'set_name', 'next_step', 'prev_step', 'explain_field', 'ask_me'] as const;

const SET_NAME: ProviderTool = {
  name: 'set_name',
  description:
    "Remember the user's first name (or how they want to be addressed) the moment they tell you. Call it with just the name, cleaned up: \"my name's tyler\" → \"Tyler\".",
  parameters: { type: 'object', properties: { name: { type: 'string', description: 'The name, title-cased, no filler words.' } }, required: ['name'] },
};

const FILL_FIELDS: ProviderTool = {
  name: 'fill_fields',
  description:
    'Type values into the on-screen form fields for the user. Use the exact field ids from the FIELDS list. For choice fields pass the option value (or its label). For list fields pass an array. For money pass a plain number. Only fill what the user actually told you; never invent values. The user still confirms before anything is saved.',
  parameters: {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, value: { description: 'string | number | string[]' } },
          required: ['id', 'value'],
        },
      },
    },
    required: ['fields'],
  },
};

const NEXT_STEP: ProviderTool = {
  name: 'next_step',
  description: 'Move the form to the next step. Only when the user says they are done with this step ("next", "continue", "that is it", "yes keep going") or after you have filled every required field and they confirm.',
  parameters: { type: 'object', properties: {} },
};

const PREV_STEP: ProviderTool = {
  name: 'prev_step',
  description: 'Go back one step when the user asks to change something they already answered.',
  parameters: { type: 'object', properties: {} },
};

const EXPLAIN_FIELD: ProviderTool = {
  name: 'explain_field',
  description: 'Highlight a field on screen while you explain it (use when the user asks what a field means).',
  parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

const ASK_ME: ProviderTool = {
  name: 'ask_me',
  description: 'The user wants you to drive: ask them the step\'s questions one at a time instead of waiting. Call this, then ask the FIRST unfilled required field\'s question in your reply.',
  parameters: { type: 'object', properties: {} },
};

export function conciergeTools(signedIn: boolean): ProviderTool[] {
  return signedIn ? [FILL_FIELDS, NEXT_STEP, PREV_STEP, EXPLAIN_FIELD, ASK_ME, SET_NAME] : [SET_NAME];
}

/** Turn a tool call into a UI action; unknown or malformed calls return null. */
export function parseConciergeToolUse(name: string, input: Record<string, unknown>): ConciergeAction | null {
  switch (name) {
    case 'set_name': {
      const n = typeof input.name === 'string' ? input.name.trim() : '';
      return n ? { type: 'set_name', name: n.slice(0, 60) } : null;
    }
    case 'fill_fields': {
      const raw = Array.isArray(input.fields) ? input.fields : [];
      const fields = raw
        .filter((f): f is { id: string; value: unknown } => !!f && typeof f === 'object' && typeof (f as { id?: unknown }).id === 'string')
        .map((f) => ({ id: f.id, value: f.value }));
      return fields.length ? { type: 'fill_fields', fields } : null;
    }
    case 'next_step':
      return { type: 'next_step' };
    case 'prev_step':
      return { type: 'prev_step' };
    case 'explain_field':
      return typeof input.id === 'string' && input.id ? { type: 'explain_field', id: input.id } : null;
    case 'ask_me':
      return { type: 'ask_me' };
    default:
      return null;
  }
}

export function formatFieldsForPrompt(fields: ConciergeFieldSnapshot[] | undefined): string {
  if (!fields?.length) return '(no fields on this step)';
  return fields
    .map((f) => {
      const empty = f.value === null || f.value === undefined || f.value === '' || (Array.isArray(f.value) && f.value.length === 0);
      const cur = empty ? 'empty' : `"${Array.isArray(f.value) ? f.value.join(', ') : String(f.value)}"`;
      const opts = f.options?.length ? ` choices: ${f.options.map((o) => `${o.value}=${o.label}`).join(' | ')}` : '';
      return `- ${f.id} — ${f.label} [${f.type}${f.required ? ', required' : ''}] currently ${cur}.${opts}${f.hint ? ` (${f.hint})` : ''}`;
    })
    .join('\n');
}

const VOICE_RULES = `HOW YOU TALK
- You are Will — warm, calm, plain-spoken, a little dry. One to three short sentences. You are SPOKEN ALOUD as well as shown, so no markdown, no lists, no emoji, no headings. Write numbers as words when small, digits with commas when large.
- Never say "as an AI". Never apologize twice. Never promise results, returns, approvals, or anything about money the product cannot guarantee.
- Ask one question at a time. End with a question when you need something from the user; otherwise end with a statement.`;

/** The system prompt for a concierge turn. Byte-stable for a given moment so it caches well. */
export function buildConciergeSystemPrompt(ctx: ConciergeContext): string {
  const who = ctx.name ? `The user's name is ${ctx.name}; use it now and then, not every line.` : "You don't know the user's name yet.";
  const head = `You are Will, the personal assistant built into ${ctx.product.name}. ${ctx.product.name} is for ${ctx.product.noun}s. ${ctx.product.blurb}
${who}

${VOICE_RULES}`;

  if (!ctx.signedIn) {
    const faq = ctx.faq ? `\n\nTHINGS YOU CAN ANSWER BEFORE SIGN-UP\n${ctx.faq}` : '';
    const moment = ctx.moment === 'askName'
      ? `RIGHT NOW: the account was just created and you asked for their name. When they tell you, call set_name with the cleaned-up name and greet them by it in one short sentence. If they ask something else first, answer briefly and ask again.`
      : `RIGHT NOW: the visitor is on the landing page and has not signed up. Your job is to be friendly, answer quick questions about ${ctx.product.name}, and invite them to enter an email and create a password right here. You have NO access to any account or data. Do not collect anything but a name.`;
    return `${head}

${moment}${faq}`;
  }

  const step = ctx.stepTitle
    ? `RIGHT NOW: the user is looking at onboarding step ${(ctx.stepIndex ?? 0) + 1} of ${ctx.stepCount ?? '?'}: "${ctx.stepTitle}". The form is on screen; they can type into it directly, type to you in the Shift box, or talk.`
    : `RIGHT NOW: the user is in onboarding.`;
  return `${head}

${step}

FIELDS ON THIS STEP
${formatFieldsForPrompt(ctx.fields)}

HOW YOU HELP
- When the user gives you facts ("Kansas City, flipping, about forty thousand"), call fill_fields with every field those facts answer — exact ids, option values for choices — then tell them what you put where in one sentence and ask if you should keep going.
- If a value does not fit a field's choices, say so and ask which choice is closest. Never guess.
- Only fill fields the user actually answered. Never fill required fields with assumptions.
- When they say "next", "continue", "done", "yes" after a confirmation, call next_step. "Go back" → prev_step. "What does X mean" → explain_field + a one-sentence explanation. "Ask me" / "you drive" / "walk me through it" → ask_me, then ask the first unfilled required field's question.
- If every required field on the step is filled and they confirm, call next_step.
- You cannot save, submit, or see anything outside this step. The user presses Continue, or says so, to save.`;
}

/**
 * Run one concierge turn: Will's reply plus the UI actions the model asked for.
 * The provider runs the tool loop; each tool "executes" by recording the action
 * and returning a short acknowledgement so the model finishes its sentence.
 */
export async function runConcierge(opts: {
  provider: ModelProvider;
  context: ConciergeContext;
  message: string;
  history?: ProviderMessage[];
  maxTokens?: number;
}): Promise<ConciergeTurn> {
  const { provider, context, message, history = [], maxTokens = 300 } = opts;
  const actions: ConciergeAction[] = [];
  const system = buildConciergeSystemPrompt(context);
  const res = await provider.complete({
    system,
    messages: [...history.slice(-12), { role: 'user', content: message }],
    tools: conciergeTools(context.signedIn),
    maxTokens,
    toolExecutor: async (name, input) => {
      const action = parseConciergeToolUse(name, input);
      if (!action) return { ok: false, error: 'malformed tool input' };
      actions.push(action);
      switch (action.type) {
        case 'fill_fields':
          return { ok: true, note: 'The page is filling those fields now; the user still confirms before saving.' };
        case 'set_name':
          return { ok: true, name: action.name };
        case 'next_step':
        case 'prev_step':
          return { ok: true, note: 'The form is moving. Keep your reply to one sentence.' };
        case 'explain_field':
          return { ok: true, note: 'Highlighted.' };
        case 'ask_me':
          return { ok: true, note: 'Ask the first unfilled required field now.' };
        default:
          return { ok: true };
      }
    },
  });
  return { text: res.text.trim(), actions, toolsInvoked: res.toolsInvoked };
}
