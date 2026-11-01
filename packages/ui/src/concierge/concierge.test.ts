import { describe, expect, it } from "vitest";
import {
  cleanName,
  coerceFill,
  coerceFills,
  conciergeReducer,
  endsWithQuestion,
  greetingForHour,
  initialConciergeState,
  matchOption,
  parseMoney,
  snapshotForPrompt,
  summarizeFills,
  type FieldSnapshot,
} from "./concierge";

describe("greetingForHour", () => {
  it("splits the day the way a person would", () => {
    expect(greetingForHour(6)).toBe("Good morning");
    expect(greetingForHour(11)).toBe("Good morning");
    expect(greetingForHour(12)).toBe("Good afternoon");
    expect(greetingForHour(16)).toBe("Good afternoon");
    expect(greetingForHour(17)).toBe("Good evening");
    expect(greetingForHour(2)).toBe("Good evening");
  });
});

describe("cleanName", () => {
  it("strips the ways people say their name", () => {
    expect(cleanName("my name is tyler")).toBe("Tyler");
    expect(cleanName("Hi, I'm Tyler Allman.")).toBe("Tyler Allman");
    expect(cleanName("it's jordan")).toBe("Jordan");
    expect(cleanName("call me T")).toBe("T");
    expect(cleanName("um, Angela")).toBe("Angela");
    expect(cleanName("tyler, nice to meet you")).toBe("Tyler");
  });
  it("refuses things that are not a name", () => {
    expect(cleanName("")).toBeNull();
    expect(cleanName("I'd rather not say that right now thanks")).toBeNull();
    expect(cleanName("what is this app for?")).toBeNull();
    expect(cleanName("40000")).toBeNull();
  });
});

describe("parseMoney", () => {
  it("reads the ways people say money", () => {
    expect(parseMoney("$40,000")).toBe(40000);
    expect(parseMoney("40k")).toBe(40000);
    expect(parseMoney("about 40 thousand")).toBe(40000);
    expect(parseMoney("1.2m")).toBe(1200000);
    expect(parseMoney("forty thousand")).toBe(40000);
    expect(parseMoney("two hundred fifty thousand")).toBe(250000);
    expect(parseMoney(85000)).toBe(85000);
  });
  it("returns null for non-numbers", () => {
    expect(parseMoney("not sure")).toBeNull();
    expect(parseMoney("")).toBeNull();
    expect(parseMoney(null)).toBeNull();
  });
});

const STRATEGY = [
  { value: "flip", label: "Fix & Flip", description: "Buy distressed, renovate, sell" },
  { value: "brrrr", label: "BRRRR", description: "Buy, rehab, rent, refi, repeat" },
  { value: "rental", label: "Buy & Hold Rental", description: "Long-term cash flow" },
  { value: "str", label: "Short-Term Rental", description: "Vacation rentals on Airbnb/VRBO" },
  { value: "mixed", label: "Mixed / All", description: "Depends on the deal" },
];

describe("matchOption", () => {
  it("matches value, label, prefix, contains, and description", () => {
    expect(matchOption(STRATEGY, "flip")?.value).toBe("flip");
    expect(matchOption(STRATEGY, "Fix & Flip")?.value).toBe("flip");
    expect(matchOption(STRATEGY, "fix and flip")?.value).toBe("flip");
    expect(matchOption(STRATEGY, "flipping")?.value).toBe("flip");
    expect(matchOption(STRATEGY, "airbnb")?.value).toBe("str");
    expect(matchOption(STRATEGY, "cash flow")?.value).toBe("rental");
  });
  it("refuses ambiguous or unknown answers", () => {
    expect(matchOption(STRATEGY, "rent")).toBeNull(); // rental vs short-term rental
    expect(matchOption(STRATEGY, "crypto")).toBeNull();
  });
});

describe("coerceFill", () => {
  it("handles each field type", () => {
    expect(coerceFill({ id: "s", label: "Strategy", type: "select", options: STRATEGY }, "flipping")).toEqual({ id: "s", ok: true, value: "flip" });
    expect(coerceFill({ id: "m", label: "Markets", type: "multi" }, "Kansas City, MO and Topeka")).toEqual({ id: "m", ok: true, value: ["Kansas City", "MO", "Topeka"] });
    expect(coerceFill({ id: "m", label: "Markets", type: "multi" }, ["Wichita", "Wichita"])).toEqual({ id: "m", ok: true, value: ["Wichita"] });
    expect(coerceFill({ id: "c", label: "Capital", type: "money" }, "about 40k")).toEqual({ id: "c", ok: true, value: 40000 });
    expect(coerceFill({ id: "p", label: "Phone", type: "tel" }, "(913) 555-0100")).toEqual({ id: "p", ok: true, value: "(913) 555-0100" });
    expect(coerceFill({ id: "e", label: "Email", type: "email" }, "t@x.io")).toEqual({ id: "e", ok: true, value: "t@x.io" });
    expect(coerceFill({ id: "n", label: "Name", type: "text" }, "  Tyler ")).toEqual({ id: "n", ok: true, value: "Tyler" });
  });
  it("fails with a reason instead of writing junk", () => {
    expect(coerceFill({ id: "s", label: "Strategy", type: "select", options: STRATEGY }, "crypto").ok).toBe(false);
    expect(coerceFill({ id: "c", label: "Capital", type: "money" }, "a lot").ok).toBe(false);
    expect(coerceFill({ id: "p", label: "Phone", type: "tel" }, "soon").ok).toBe(false);
    expect(coerceFill({ id: "n", label: "Name", type: "text" }, "").ok).toBe(false);
  });
});

const FIELDS: FieldSnapshot[] = [
  { id: "target_strategy", label: "Primary strategy", type: "select", options: STRATEGY, required: true, value: "" },
  { id: "target_markets", label: "Target markets", type: "multi", value: [] },
  { id: "available_capital", label: "Available capital", type: "money", value: "", hint: "rough number is fine" },
];

describe("coerceFills + summarizeFills", () => {
  it("coerces a batch and names unknown fields without throwing", () => {
    const res = coerceFills(FIELDS, [
      { id: "target_strategy", value: "fix and flip" },
      { id: "target_markets", value: "Kansas City" },
      { id: "available_capital", value: "40k" },
      { id: "nope", value: 1 },
    ]);
    expect(res.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(summarizeFills(FIELDS, res)).toBe("I put Fix & Flip under Primary strategy, Kansas City under Target markets and $40,000 under Available capital.");
  });
  it("summarizes one fill as a sentence", () => {
    const res = coerceFills(FIELDS, [{ id: "target_markets", value: "Topeka" }]);
    expect(summarizeFills(FIELDS, res)).toBe("I put Topeka under Target markets.");
    expect(summarizeFills(FIELDS, [{ id: "x", ok: false, reason: "no" }])).toBe("");
  });
});

describe("snapshotForPrompt", () => {
  it("lists ids, labels, requiredness, current values and choices", () => {
    const s = snapshotForPrompt(FIELDS);
    expect(s).toContain("- target_strategy — Primary strategy [select, required] currently empty. choices: flip=Fix & Flip");
    expect(s).toContain("- available_capital — Available capital [money] currently empty. (rough number is fine)");
    expect(snapshotForPrompt([])).toBe("(no fields on this step)");
  });
});

describe("conciergeReducer", () => {
  it("records lines, caps the transcript, and makes a mic denial final", () => {
    let s = initialConciergeState("askName");
    s = conciergeReducer(s, { type: "will", text: "What's your name?" });
    s = conciergeReducer(s, { type: "user", text: "Tyler" });
    expect(s.lines.map((l) => l.who)).toEqual(["will", "user"]);
    s = conciergeReducer(s, { type: "chooseMic", choice: "denied" });
    s = conciergeReducer(s, { type: "chooseMic", choice: "voice" });
    expect(s.micChoice).toBe("denied");
    for (let i = 0; i < 60; i++) s = conciergeReducer(s, { type: "will", text: `${i}` });
    expect(s.lines.length).toBe(40);
    expect(conciergeReducer(s, { type: "moment", moment: "askName" })).toBe(s); // no-op keeps identity
  });
});

describe("endsWithQuestion", () => {
  it("opens the mic only after a question", () => {
    expect(endsWithQuestion("What's your name? ")).toBe(true);
    expect(endsWithQuestion("Nice to meet you.")).toBe(false);
  });
});
