// ── Window caps + device modes ("Duo") ───────────────────────────────────────
// Every Shift canvas holds at most a few windows at once: a 2×2 on a WIDE board
// (desktop, iPad) and "Duo" — two windows stacked — on a PHONE. Opening one more
// EVICTS the window you touched least recently; locked windows never go. The cap
// never refuses a window: a generative canvas that said "no" would feel broken.
// It keeps the board readable and keeps WKWebView memory in check in the shells.
//
// Pure functions, no React — shared by the provider and its tests.

export const MAX_WINDOWS = 4;
export const MAX_WINDOWS_PHONE = 2;
export type CanvasMode = "wide" | "phone";
export type CanvasLimits = { wide?: number; phone?: number };

// The focused Duo window takes this share of the visible canvas; the other
// stays live beneath it (tap its title to swap).
export const DUO_FOCUS_SHARE = 0.62;
// Top bar + tab bar + canvas padding on a phone — what the Duo stack subtracts
// from the viewport height so both windows fit without scrolling.
export const PHONE_CHROME = 220;
export const DUO_GAP = 12;
// The lower Duo window never shrinks past this — a title bar plus a few rows is
// still a live window, and it keeps the stack inside a Safari-sized viewport.
export const DUO_MIN_H = 160;

// A phone is a viewport under 720px wide (every portrait phone), or a touch
// device whose shorter edge is under 600px (a phone held sideways). A narrow
// desktop window is NOT a phone: it keeps the wide engine, single-column.
export function detectMode(innerWidth: number, innerHeight: number, coarsePointer: boolean): CanvasMode {
  if (innerWidth < 720) return "phone";
  if (coarsePointer && Math.min(innerWidth, innerHeight) < 600) return "phone";
  return "wide";
}

export function maxWindowsFor(mode: CanvasMode, limits?: CanvasLimits): number {
  const n = mode === "phone" ? limits?.phone ?? MAX_WINDOWS_PHONE : limits?.wide ?? MAX_WINDOWS;
  return Math.max(1, Math.floor(n));
}

type Capped = { id: string; z: number; locked?: boolean };

// Evict the least-recently-touched UNLOCKED windows (lowest z) until the list
// fits `max` slots. `keepId` — the window being added or focused — is never a
// victim. When only locked windows remain the cap yields: the user pinned them
// on purpose, so the board overflows rather than losing a pin.
export function capList<T extends Capped>(list: T[], max: number, keepId?: string): T[] {
  let out = list;
  while (out.length > max) {
    const victim = out
      .filter((b) => !b.locked && b.id !== keepId)
      .sort((a, b) => a.z - b.z)[0];
    if (!victim) break;
    out = out.filter((b) => b.id !== victim.id);
  }
  return out;
}

type Tiled = { z: number; x: number; y: number; w: number; h: number; placed?: boolean };

// Duo (phone) layout: windows stack in FOCUS order — the most recently touched
// window on top with DUO_FOCUS_SHARE of the visible canvas, the other live
// beneath it. More than two only when locks hold extras; they share the rest.
// Returns the list in focus order so persistence and restore follow it, and
// clears `placed` — on a phone there is no free arrangement to keep.
export function tileDuo<T extends Tiled>(items: T[], boardW: number, boardH: number): T[] {
  const n = items.length;
  if (n === 0) return items;
  const sorted = [...items].sort((a, b) => b.z - a.z);
  const availH = Math.max(DUO_MIN_H * 2 + DUO_GAP, boardH - PHONE_CHROME);
  if (n === 1) return [{ ...sorted[0], x: 0, y: 0, w: boardW, h: availH, placed: false }];
  // The stack always fits availH: when the lower window would drop under its
  // floor, the focused window gives up the difference instead.
  const minRest = (DUO_MIN_H + DUO_GAP) * (n - 1);
  const focusH = Math.max(DUO_MIN_H, Math.min(Math.round(availH * DUO_FOCUS_SHARE), availH - minRest));
  const restH = Math.max(DUO_MIN_H, Math.round((availH - focusH - DUO_GAP * (n - 1)) / (n - 1)));
  let y = 0;
  return sorted.map((it, i) => {
    const h = i === 0 ? focusH : restH;
    const out = { ...it, x: 0, y, w: boardW, h, placed: false };
    y += h + DUO_GAP;
    return out;
  });
}

// True when two layouts put every window at the same place — lets a resize
// pass hand back the SAME array so React (and the persist layer) see no change.
export function sameGeometry<T extends Tiled & { id: string }>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((x) => [x.id, x]));
  return a.every((x) => {
    const y = byId.get(x.id);
    return !!y && x.x === y.x && x.y === y.y && x.w === y.w && x.h === y.h;
  });
}
