import { describe, expect, it } from "vitest";
import type { ModelProvider, ProviderMessage, ProviderTool, ToolExecutor } from "./model.js";
import {
  buildConciergeSystemPrompt,
  conciergeTools,
  formatFieldsForPrompt,
  parseConciergeToolUse,
  runConcierge,
  type ConciergeContext,
} from "./concierge.js";

const ctx: ConciergeContext = {
  product: { name: "RealShift", noun: "real estate investor", blurb: "It runs rentals and deals in one place." },
  moment: "fill",
  signedIn: true,
  name: "Tyler",
  stepTitle: "Strategy",
  stepIndex: 3,
  stepCount: 5,
  fields: [
    { id: "target_strategy", label: "Primary strategy", type: "select", required: true, options: [{ value: "flip", label: "Fix & Flip" }], value: "" },
    { id: "target_markets", label: "Target markets", type: "multi", value: ["Topeka"] },
  ],
};

describe("conciergeTools", () => {
  it("offers only set_name before login and the full pack after", () => {
    expect(conciergeTools(false).map((t) => t.name)).toEqual(["set_name"]);
    expect(conciergeTools(true).map((t) => t.name)).toEqual(["fill_fields", "next_step", "prev_step", "explain_field", "ask_me", "set_name"]);
  });
});

describe("parseConciergeToolUse", () => {
  it("parses well-formed calls and rejects junk", () => {
    expect(parseConciergeToolUse("set_name", { name: "  Tyler " })).toEqual({ type: "set_name", name: "Tyler" });
    expect(parseConciergeToolUse("set_name", { name: "" })).toBeNull();
    expect(parseConciergeToolUse("fill_fields", { fields: [{ id: "a", value: 1 }, { nope: 1 }, null] })).toEqual({ type: "fill_fields", fields: [{ id: "a", value: 1 }] });
    expect(parseConciergeToolUse("fill_fields", { fields: [] })).toBeNull();
    expect(parseConciergeToolUse("next_step", {})).toEqual({ type: "next_step" });
    expect(parseConciergeToolUse("explain_field", { id: "x" })).toEqual({ type: "explain_field", id: "x" });
    expect(parseConciergeToolUse("explain_field", {})).toBeNull();
    expect(parseConciergeToolUse("delete_everything", {})).toBeNull();
  });
});

describe("buildConciergeSystemPrompt", () => {
  it("describes the step and fields when signed in", () => {
    const p = buildConciergeSystemPrompt(ctx);
    expect(p).toContain("You are Will");
    expect(p).toContain('step 4 of 5: "Strategy"');
    expect(p).toContain("- target_strategy — Primary strategy [select, required] currently empty. choices: flip=Fix & Flip");
    expect(p).toContain('- target_markets — Target markets [multi] currently "Topeka".');
    expect(p).toContain("The user's name is Tyler");
  });
  it("is landing-safe when signed out: no fields, no data, invite to sign up", () => {
    const p = buildConciergeSystemPrompt({ ...ctx, signedIn: false, moment: "landing", name: null, faq: "Price: free for 5 properties." });
    expect(p).toContain("has not signed up");
    expect(p).toContain("NO access to any account");
    expect(p).toContain("Price: free for 5 properties.");
    expect(p).not.toContain("FIELDS ON THIS STEP");
  });
  it("is byte-stable for the same context", () => {
    expect(buildConciergeSystemPrompt(ctx)).toBe(buildConciergeSystemPrompt({ ...ctx }));
  });
});

describe("formatFieldsForPrompt", () => {
  it("handles an empty step", () => {
    expect(formatFieldsForPrompt(undefined)).toBe("(no fields on this step)");
  });
});

class FakeProvider implements ModelProvider {
  readonly name = "fake";
  readonly modelId = "fake-1";
  calls: Array<{ system: string; messages: ProviderMessage[]; tools?: ProviderTool[] }> = [];
  async complete(opts: { system: string; messages: ProviderMessage[]; tools?: ProviderTool[]; toolExecutor?: ToolExecutor; maxTokens?: number }) {
    this.calls.push({ system: opts.system, messages: opts.messages, tools: opts.tools });
    // Pretend the model filled two fields then answered.
    await opts.toolExecutor?.("fill_fields", { fields: [{ id: "target_strategy", value: "flip" }, { id: "target_markets", value: "Kansas City" }] });
    await opts.toolExecutor?.("bogus", {});
    return { text: " I put Fix and Flip under strategy and Kansas City under markets. Keep going? ", toolsInvoked: ["fill_fields", "bogus"] };
  }
  async stream(): Promise<never> {
    throw new Error("not used");
  }
}

describe("runConcierge", () => {
  it("collects the actions the model asked for and trims the reply", async () => {
    const provider = new FakeProvider();
    const turn = await runConcierge({ provider, context: ctx, message: "Kansas City, flipping", history: [{ role: "assistant", content: "Hello Tyler." }] });
    expect(turn.text).toBe("I put Fix and Flip under strategy and Kansas City under markets. Keep going?");
    expect(turn.actions).toEqual([{ type: "fill_fields", fields: [{ id: "target_strategy", value: "flip" }, { id: "target_markets", value: "Kansas City" }] }]);
    expect(provider.calls[0].messages.map((m) => m.role)).toEqual(["assistant", "user"]);
    expect(provider.calls[0].tools?.map((t) => t.name)).toContain("fill_fields");
  });
});
