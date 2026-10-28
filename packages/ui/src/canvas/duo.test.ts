import { describe, expect, it } from "vitest";
import { MAX_WINDOWS, MAX_WINDOWS_PHONE, DUO_FOCUS_SHARE, DUO_GAP, PHONE_CHROME, capList, detectMode, maxWindowsFor, sameGeometry, tileDuo } from "./duo";

const blk = (id: string, z: number, locked = false) => ({ id, z, locked, x: 0, y: 0, w: 0, h: 0 });

describe("detectMode", () => {
  it("every portrait phone is a phone", () => {
    expect(detectMode(390, 844, true)).toBe("phone");
    expect(detectMode(375, 667, true)).toBe("phone");
  });
  it("a phone held sideways stays a phone; a tablet is wide either way", () => {
    expect(detectMode(844, 390, true)).toBe("phone");
    expect(detectMode(1024, 768, true)).toBe("wide");
    expect(detectMode(768, 1024, true)).toBe("wide");
  });
  it("a short desktop window is NOT a phone (fine pointer)", () => {
    expect(detectMode(1400, 550, false)).toBe("wide");
    expect(detectMode(700, 900, false)).toBe("phone"); // narrow IS single-column phone layout
  });
});

describe("maxWindowsFor", () => {
  it("defaults to 4 wide / 2 phone and honors host limits", () => {
    expect(maxWindowsFor("wide")).toBe(MAX_WINDOWS);
    expect(maxWindowsFor("phone")).toBe(MAX_WINDOWS_PHONE);
    expect(maxWindowsFor("wide", { wide: 6 })).toBe(6);
    expect(maxWindowsFor("phone", { phone: 0 })).toBe(1); // never below one window
  });
});

describe("capList", () => {
  it("evicts the least-recently-touched unlocked windows first", () => {
    const list = [blk("a", 5), blk("b", 1), blk("c", 3), blk("d", 9), blk("e", 2)];
    expect(capList(list, 3).map((b) => b.id)).toEqual(["a", "c", "d"]);
  });
  it("never evicts a locked window, nor the one being kept", () => {
    const list = [blk("a", 1, true), blk("b", 2), blk("c", 3), blk("new", 0)];
    expect(capList(list, 2, "new").map((b) => b.id)).toEqual(["a", "new"]);
  });
  it("yields when only locked windows remain over the cap", () => {
    const list = [blk("a", 1, true), blk("b", 2, true), blk("c", 3, true)];
    expect(capList(list, 2)).toHaveLength(3);
  });
  it("returns the same array when already within the cap", () => {
    const list = [blk("a", 1), blk("b", 2)];
    expect(capList(list, 4)).toBe(list);
  });
});

describe("tileDuo", () => {
  it("one window fills the visible canvas", () => {
    const [w] = tileDuo([blk("a", 1)], 350, 844);
    expect(w).toMatchObject({ x: 0, y: 0, w: 350, h: 844 - PHONE_CHROME, placed: false });
  });
  it("stacks two in focus order: most recent on top with the focus share", () => {
    const out = tileDuo([blk("old", 1), blk("new", 2)], 350, 844);
    const availH = 844 - PHONE_CHROME;
    const focusH = Math.round(availH * DUO_FOCUS_SHARE);
    expect(out.map((b) => b.id)).toEqual(["new", "old"]);
    expect(out[0]).toMatchObject({ y: 0, h: focusH, w: 350 });
    expect(out[1]).toMatchObject({ y: focusH + DUO_GAP, h: availH - focusH - DUO_GAP, w: 350 });
    // The stack fits the visible canvas exactly — no scrolling on a phone.
    expect(out[1].y + out[1].h).toBe(availH);
  });
  it("keeps a floor height on a very short viewport", () => {
    const out = tileDuo([blk("a", 1), blk("b", 2)], 350, 480);
    expect(out.every((b) => b.h >= 160)).toBe(true);
  });
  it("fits a Safari-sized phone viewport (664px) without scrolling", () => {
    const out = tileDuo([blk("a", 1), blk("b", 2)], 350, 664);
    expect(out[1].y + out[1].h).toBe(664 - PHONE_CHROME);
  });
  it("leaves an empty list alone", () => {
    const list: ReturnType<typeof blk>[] = [];
    expect(tileDuo(list, 350, 844)).toBe(list);
  });
});

describe("sameGeometry", () => {
  it("ignores order, compares rectangles by id", () => {
    const a = [{ ...blk("a", 1), x: 0, y: 0, w: 10, h: 10 }, { ...blk("b", 2), x: 0, y: 20, w: 10, h: 10 }];
    const b = [a[1], a[0]];
    expect(sameGeometry(a, b)).toBe(true);
    expect(sameGeometry(a, [a[0], { ...a[1], h: 11 }])).toBe(false);
    expect(sameGeometry(a, [a[0]])).toBe(false);
  });
});
