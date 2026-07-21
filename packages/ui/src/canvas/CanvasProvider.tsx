"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// ── Free-floating canvas engine ───────────────────────────────────────────────
// Windows live at absolute (x, y) with a free pixel size (w, h) — you can put any
// window anywhere, leave gaps, and stack them. Moving a window only nudges OTHERS
// out of the way when you drop it on top of them. The launcher composes
// side-by-side by auto-tiling its event payloads into this same coordinate space,
// so it keeps looking grid-clean without a separate layout engine.
//
// Brand-neutral: the engine knows nothing about which block keys exist or what
// they render — the host app injects `resolveBlock(key)` to validate a key and
// supply its default width, and reads `block.context` (typed `unknown` here) with
// its own cast. Both Shift apps share this one engine so their canvases feel
// identical; keep changes here, not in per-app forks.

export const GAP = 20;          // gutter between auto-tiled windows
export const DEFAULT_H = 420;   // default window height (px)
export const MIN_W = 240;
export const MIN_H = 200;

// Canonical tile-weight presets (a block is sm/md/lg/xl; the number is its column
// span out of 12). Identical across every Shift app that uses the canvas.
export type BlockWidth = "sm" | "md" | "lg" | "xl";
export const WIDTH_SPAN: Record<BlockWidth, number> = {
  sm: 4,   // 1/3
  md: 6,   // 1/2
  lg: 8,   // 2/3
  xl: 12,  // full
};

// The minimum a host's block-registry lookup must return: whether the key is real
// (non-null) and the block's preferred width. Apps pass their `getBlockDef`.
export type ResolveBlock = (key: string) => { defaultWidth?: BlockWidth } | null | undefined;

export interface CanvasBlock {
  id: string;
  key: string;
  // App-specific per-window context — the engine only stores/passes it through and
  // never inspects it, so it's `unknown` here (host casts when it renders the block).
  context?: unknown;
  // Session-only "lock": the window is anchored in place — it can't be moved or
  // resized itself, and other windows can't push/snap/shrink it. NOT persisted.
  locked?: boolean;
  // Absolute board geometry (px).
  x: number;
  y: number;
  w: number;
  h: number;
  // Most-recently-touched window sits on top.
  z: number;
  // True once the user has manually moved/resized it — auto-tile then leaves it.
  placed?: boolean;
  // Tile weight source (sm/md/lg/xl) + persisted preset.
  width?: BlockWidth;
}

export interface SavedBlock {
  key: string;
  width?: BlockWidth;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

// Windows-style snap zones for the maximize button's hover menu.
export type SnapLayout = "full" | "left" | "right" | "top" | "bottom" | "tl" | "tr" | "bl" | "br";

// A board-relative rectangle in percent (for drawing the little snap-menu diagrams).
export type SnapBox = { left: number; top: number; width: number; height: number };
// Adapted preview for a zone: where the window lands (carved around locked windows)
// plus the locked regions to shade behind it, plus where the OTHER unlocked windows
// reflow to. `blocked` = a locked window covers the whole zone (no usable free
// space) → the option is disabled in the menu.
export type SnapPreview = { rect: SnapBox; locked: SnapBox[]; others: SnapBox[]; blocked: boolean };

// Live on-board snap ghost: absolute-px rects for the window being snapped + where
// every other unlocked window reflows to, drawn as translucent guides on the board.
export type SnapGhost = { target: { x: number; y: number; w: number; h: number }; others: { x: number; y: number; w: number; h: number }[] } | null;

interface CanvasApi {
  blocks: CanvasBlock[];
  addBlock: (key: string, context?: unknown, width?: BlockWidth, append?: boolean) => void;
  removeBlock: (id: string) => void;
  resizeBlock: (id: string, width: BlockWidth) => void;
  // Snap a window to a board zone (Windows-style): full screen, halves, quadrants.
  // Carves around any locked window, and REFLOWS the other unlocked windows into the
  // complementary free space (Windows 11 "snap assist") instead of overlapping them.
  snapTo: (id: string, layout: SnapLayout) => void;
  // Adapted preview of where a zone would land (carved around locked windows) plus
  // the locked regions and where the other windows reflow — for the snap menu diagram.
  snapPreview: (id: string, layout: SnapLayout) => SnapPreview;
  // Live on-board ghost: set/clear the translucent guide drawn on the board while a
  // snap option is hovered, so you see the result in real time before committing.
  previewSnap: (id: string, layout: SnapLayout) => void;
  clearSnapPreview: () => void;
  snapGhost: SnapGhost;
  // Free move / resize (absolute px). All mark the window as user-placed and clamp
  // the window inside the board so it can't be dragged/resized off-canvas.
  moveTo: (id: string, x: number, y: number) => void;
  sizeTo: (id: string, w: number, h: number) => void;
  // Set position + size together — used by left/top-edge resize where the opposite
  // edge is the anchor.
  setRect: (id: string, r: { x: number; y: number; w: number; h: number }) => void;
  // Tiling resize: grow a window and push/shrink its row-neighbors (origin = layout
  // snapshot from gesture start). Keeps everything on the board.
  resizeRow: (id: string, x: number, w: number, h: number, origin: { id: string; x: number; y: number; w: number; h: number }[]) => void;
  bringToFront: (id: string) => void;
  // Push any windows the given one overlaps out of the way (called on drop).
  resolveCollisions: (id: string) => void;
  // Lock / unlock a single window in place for this session.
  toggleLock: (id: string) => void;
  clear: (keepKey?: string) => void;
  // True while a window is being dragged or resized (disables iframe pointer
  // events so the gesture isn't swallowed by an embedded page).
  interacting: boolean;
  setInteracting: (v: boolean) => void;
  // The window currently being dragged/resized (rendered without spring lag).
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  // Measured board width (px) for sizing presets + tiling.
  boardWidth: number;
}

const CanvasContext = createContext<CanvasApi | null>(null);

export function useCanvas(): CanvasApi {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used inside <CanvasProvider>");
  return ctx;
}

let _seq = 0;
function nextId() { return `blk-${Date.now()}-${_seq++}`; }

// Build a fresh window from a saved/keyed entry. Saved coordinates → user-placed
// (kept as-is); a bare key → tiled on mount. Locks are session-only, so a
// restored/seeded window always starts unlocked.
function blockFromSaved(s: SavedBlock | string, z: number): CanvasBlock {
  const sb: SavedBlock = typeof s === "string" ? { key: s } : s;
  const hasCoords = typeof sb.x === "number" && typeof sb.y === "number" && typeof sb.w === "number";
  return {
    id: nextId(),
    key: sb.key,
    width: sb.width,
    z,
    placed: hasCoords,
    x: sb.x ?? 0,
    y: sb.y ?? 0,
    w: sb.w ?? 0,
    h: sb.h ?? DEFAULT_H,
  };
}

function colWidth(boardW: number): number {
  return (boardW - GAP * 11) / 12;
}
function pxWidth(weight: number, boardW: number): number {
  return Math.max(MIN_W, weight * colWidth(boardW) + (weight - 1) * GAP);
}

// A FULLY-EXPANDED window height — fills nearly the whole viewport below the nav
// so a window reads as the focus of the screen, not a short box floating in black.
// (~150px accounts for the top bar + canvas padding.) The board scrolls if a
// composition needs more than one row.
export function tallH(boardH: number): number {
  return Math.max(460, boardH - 150);
}

type PxRect = { x: number; y: number; w: number; h: number };

// Largest sub-rectangle of `zone` that avoids every locked window. Greedy slab
// carving: repeatedly clip the rect to the biggest side of whatever locked block
// still intrudes. Handles the common one/two-locked cases cleanly.
function carveAround(zone: PxRect, locked: PxRect[]): PxRect {
  const hit = (a: PxRect, b: PxRect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  let r: PxRect = { ...zone };
  for (let i = 0; i < locked.length + 2; i++) {
    const L = locked.find((l) => hit(r, l));
    if (!L) break;
    const ix = Math.max(r.x, L.x), iy = Math.max(r.y, L.y);
    const ir = Math.min(r.x + r.w, L.x + L.w), ib = Math.min(r.y + r.h, L.y + L.h);
    const slabs: PxRect[] = [
      { x: r.x, y: r.y, w: ix - r.x, h: r.h },              // left of the locked block
      { x: ir,  y: r.y, w: r.x + r.w - ir, h: r.h },        // right of it
      { x: r.x, y: r.y, w: r.w, h: iy - r.y },              // above it
      { x: r.x, y: ib,  w: r.w, h: r.y + r.h - ib },        // below it
    ].filter((s) => s.w > 1 && s.h > 1);
    if (slabs.length === 0) break;
    r = slabs.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
  }
  return r;
}

// A carved rect is "blocked" when there's no usable free space in the zone — it
// still overlaps a locked window, or what's left is smaller than a minimum window.
function zoneBlocked(c: PxRect, locked: PxRect[]): boolean {
  if (c.w < MIN_W || c.h < MIN_H) return true;
  return locked.some((L) => c.x < L.x + L.w && c.x + c.w > L.x && c.y < L.y + L.h && c.y + c.h > L.y);
}

// The nine snap zones (full / halves / quadrants) in board pixels. Shared by the
// snap action and the preview so both agree on exact geometry.
function snapZones(boardW: number, H: number): Record<SnapLayout, PxRect> {
  const halfW = Math.round((boardW - GAP) / 2);
  const halfH = Math.round((H - GAP) / 2);
  const rightX = boardW - halfW;
  const bottomY = H - halfH;
  return {
    full:   { x: 0,      y: 0,       w: boardW, h: H },
    left:   { x: 0,      y: 0,       w: halfW,  h: H },
    right:  { x: rightX, y: 0,       w: halfW,  h: H },
    top:    { x: 0,      y: 0,       w: boardW, h: halfH },
    bottom: { x: 0,      y: bottomY, w: boardW, h: halfH },
    tl:     { x: 0,      y: 0,       w: halfW,  h: halfH },
    tr:     { x: rightX, y: 0,       w: halfW,  h: halfH },
    bl:     { x: 0,      y: bottomY, w: halfW,  h: halfH },
    br:     { x: rightX, y: bottomY, w: halfW,  h: halfH },
  };
}

// Tile a set of windows into an arbitrary rectangular region (rows of two, trailing
// odd window spans the region's full width). Used to reflow the OTHER windows into
// the space left over after a snap.
function tileRect<T extends CanvasBlock>(items: T[], region: PxRect): T[] {
  const n = items.length;
  if (n === 0) return items;
  const rows = Math.ceil(n / 2);
  const rowH = Math.max(MIN_H, Math.round((region.h - GAP * (rows - 1)) / rows));
  const halfW = Math.round((region.w - GAP) / 2);
  const single = region.w < MIN_W * 2 + GAP; // too narrow for two columns → stack
  return items.map((it, i) => {
    if (single) {
      const h = Math.max(MIN_H, Math.round((region.h - GAP * (n - 1)) / n));
      return { ...it, x: region.x, y: region.y + i * (h + GAP), w: Math.max(MIN_W, region.w), h, placed: true };
    }
    const row = Math.floor(i / 2);
    const lastOdd = row === rows - 1 && n % 2 === 1;
    const y = region.y + row * (rowH + GAP);
    const w = lastOdd ? region.w : halfW;
    const x = lastOdd ? region.x : region.x + (i % 2) * (halfW + GAP);
    return { ...it, x, y, w: Math.max(MIN_W, w), h: rowH, placed: true };
  });
}

// The largest rectangular region of the board NOT covered by the snap zone `z` —
// i.e. where the other windows should reflow to. Picks the biggest of the four
// bands adjacent to the zone (right / left / below / above), which yields the
// opposite half for a half-snap and the larger adjacent band for a quadrant.
function bestComplement(z: PxRect, boardW: number, H: number): PxRect | null {
  const cands: PxRect[] = [
    { x: z.x + z.w + GAP, y: 0, w: boardW - (z.x + z.w + GAP), h: H },   // right of zone
    { x: 0, y: 0, w: z.x - GAP, h: H },                                  // left of zone
    { x: 0, y: z.y + z.h + GAP, w: boardW, h: H - (z.y + z.h + GAP) },   // below zone
    { x: 0, y: 0, w: boardW, h: z.y - GAP },                             // above zone
  ].filter((c) => c.w >= MIN_W && c.h >= MIN_H);
  if (cands.length === 0) return null;
  return cands.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
}

// Compute the full next layout for snapping window `id` to `layout`: the target's
// carved rect plus where every OTHER unlocked window reflows. Returns null when the
// zone is fully blocked by a locked window (snap is a no-op). Pure — shared by the
// snap action and the live preview so they always agree.
function computeSnap(blocks: CanvasBlock[], id: string, layout: SnapLayout, boardW: number, H: number): Map<string, PxRect> | null {
  const target = blocks.find((b) => b.id === id);
  if (!target || target.locked) return null;
  const zone = snapZones(boardW, H)[layout];
  const locked = blocks.filter((b) => b.id !== id && b.locked);
  const tRect = carveAround(zone, locked);
  if (zoneBlocked(tRect, locked)) return null;
  const placements = new Map<string, PxRect>();
  placements.set(id, { x: Math.round(tRect.x), y: Math.round(tRect.y), w: Math.max(MIN_W, Math.round(tRect.w)), h: Math.max(MIN_H, Math.round(tRect.h)) });

  const others = blocks.filter((b) => b.id !== id && !b.locked);
  if (others.length > 0) {
    const comp = bestComplement(zone, boardW, H);
    if (comp) {
      const region = carveAround(comp, locked);
      if (region.w >= MIN_W && region.h >= MIN_H) {
        tileRect(others, region).forEach((o) => placements.set(o.id, { x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.w), h: Math.round(o.h) }));
      }
    }
  }
  return placements;
}

// Default count-based auto-layout — windows fill the screen, like a tiling window
// manager. The rule (rows of two, a trailing odd window spans full width):
//   1 → full screen
//   2 → side by side, full height
//   3 → two on top (half height) + one full-width below (half height)
//   4 → 2×2 equal quarters
//   5 → two + two + one full-width;  6 → 2×2×2;  and so on.
// This is the layout until the user moves or resizes a window, after which their
// own arrangement is kept. The board scrolls if rows exceed the viewport.
function tileItems<T extends CanvasBlock>(items: T[], boardW: number, boardH: number): T[] {
  const n = items.length;
  if (n === 0) return items;
  const availH = Math.max(MIN_H * 2 + GAP, boardH - 150);
  const rows = Math.ceil(n / 2);
  const rowH = Math.max(300, Math.round((availH - GAP * (rows - 1)) / rows));
  const halfW = Math.round((boardW - GAP) / 2);
  // Narrow viewports: stack every window full-width in a single column.
  const single = boardW < 720;
  return items.map((it, i) => {
    if (single) {
      const h = Math.max(MIN_H, Math.round(tallH(boardH) * 0.72));
      return { ...it, x: 0, y: i * (h + GAP), w: boardW, h };
    }
    const row = Math.floor(i / 2);
    const lastOdd = row === rows - 1 && n % 2 === 1; // trailing solo window
    const y = row * (rowH + GAP);
    const w = lastOdd ? boardW : halfW;
    const x = lastOdd ? 0 : (i % 2) * (halfW + GAP);
    return { ...it, x, y, w, h: rowH };
  });
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Smallest move that takes `b` off `m` — try left/right/up/down, pick the nearest
// feasible one (prefer horizontal on a tie), clamp to the top-left of the board.
function pushOut(b: CanvasBlock, m: CanvasBlock): { x: number; y: number } {
  const cands = [
    { x: m.x - b.w - GAP, y: b.y, d: Math.abs(m.x - b.w - GAP - b.x), ok: m.x - b.w - GAP >= 0 },
    { x: m.x + m.w + GAP, y: b.y, d: Math.abs(m.x + m.w + GAP - b.x), ok: true },
    { x: b.x, y: m.y - b.h - GAP, d: Math.abs(m.y - b.h - GAP - b.y), ok: m.y - b.h - GAP >= 0 },
    { x: b.x, y: m.y + m.h + GAP, d: Math.abs(m.y + m.h + GAP - b.y), ok: true },
  ].filter((c) => c.ok).sort((p, q) => p.d - q.d);
  const best = cands[0];
  return { x: Math.max(0, best.x), y: Math.max(0, best.y) };
}

export function CanvasProvider({
  children,
  resolveBlock,
  initialKeys = [],
  initialLayout,
  addKey = null,
  persist = false,
  savedSession,
}: {
  children: ReactNode;
  // Host-injected registry lookup: validates a key (non-null) + supplies its default
  // width. Both Shift apps pass their `getBlockDef`.
  resolveBlock: ResolveBlock;
  initialKeys?: string[];
  initialLayout?: SavedBlock[];
  addKey?: string | null;
  persist?: boolean;
  // The full auto-saved layout from a prior visit + the local day it was saved.
  // Used to auto-restore on the SAME day and to power the "Restore last session"
  // button on a new day. Kept in memory so restore works even after auto-save
  // overwrites the stored copy this session.
  savedSession?: { blocks?: SavedBlock[]; savedDay?: string | null };
}) {
  // Keep the host's block resolver in a ref so internal callbacks read the latest
  // without dep churn (it's a stable fn in practice). Initialised for first render;
  // synced in an effect so we never write a ref during render (React Compiler lint).
  const resolveRef = useRef(resolveBlock);
  useEffect(() => { resolveRef.current = resolveBlock; }, [resolveBlock]);
  const resolve: ResolveBlock = (key) => resolveRef.current(key);

  // Seed the initial blocks and the z-counter together with a pure local counter,
  // so we never read/write a ref during render (React Compiler lint).
  const initial = useMemo(() => {
    let z = 1;
    const base: CanvasBlock[] = initialLayout
      ? initialLayout.filter((b) => b && typeof b.key === "string" && resolveRef.current(b.key)).map((b) => blockFromSaved(b, z++))
      : initialKeys.filter((k) => resolveRef.current(k)).map((k) => blockFromSaved(k, z++));
    if (addKey && resolveRef.current(addKey) && !base.some((b) => b.key === addKey)) {
      base.unshift(blockFromSaved(addKey, z++));
    }
    return { base, nextZ: z };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const zRef = useRef(initial.nextZ);

  const [blocks, setBlocks] = useState<CanvasBlock[]>(initial.base);

  const [interacting, setInteracting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Live snap ghost (the translucent guide drawn while a snap option is hovered).
  const [snapGhost, setSnapGhost] = useState<SnapGhost>(null);

  // Board width = viewport minus the px-5 gutters; kept in a ref so geometry
  // helpers read a fresh value synchronously inside setstate updaters.
  const [boardWidth, setBoardWidth] = useState(1280);
  const boardRef = useRef(1280);
  const boardHRef = useRef(820);
  const persistRef = useRef(persist);
  useEffect(() => { persistRef.current = persist; }, [persist]);

  useEffect(() => {
    const measure = () => {
      const w = Math.max(360, window.innerWidth - 40);
      boardRef.current = w;
      boardHRef.current = Math.max(480, window.innerHeight);
      setBoardWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Apply the default count-based layout to a window set.
  const layoutDefault = useCallback(
    (list: CanvasBlock[]) => tileItems(list, boardRef.current, boardHRef.current),
    [],
  );

  // Tile the initial windows into the default layout once the board is measured —
  // unless a saved custom arrangement (placed coordinates) was restored.
  const tiledOnce = useRef(false);
  useEffect(() => {
    if (tiledOnce.current) return;
    tiledOnce.current = true;
    setBlocks((prev) => (prev.length === 0 || prev.some((b) => b.placed) ? prev : layoutDefault(prev)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardWidth]);

  // ── Add ──────────────────────────────────────────────────────────────────────
  // Default layout re-tiles every window by count (1 = full screen, 2 = side by
  // side, …). Once the user has manually moved/resized a window ("customized"), a
  // newly GENERATED window lands at the top-left (adaptive size) and the rest reflow
  // around it. (Shared by every Shift app so the canvases feel identical.)
  const addBlock = useCallback((key: string, context?: unknown, width?: BlockWidth, append = false) => {
    if (!resolve(key)) return;
    const w = width ?? resolve(key)?.defaultWidth;
    setBlocks((prev) => {
      const existing = prev.find((b) => b.key === key);
      const customized = prev.some((b) => b.placed);
      const without = prev.filter((b) => b.key !== key);

      if (customized) {
        // Demo composition still stacks below so it can tile a scene.
        if (append) {
          const startY = without.length ? Math.max(...without.map((b) => b.y + b.h)) + GAP : 0;
          const nb: CanvasBlock = { id: nextId(), key, context, width: w, locked: existing?.locked, z: zRef.current++, placed: true, x: 0, y: startY, w: boardRef.current, h: tallH(boardHRef.current) };
          return [...without, nb];
        }
        // A window you GENERATE comes in at the top-left, and every other unlocked window
        // reflows/resizes into the space that's left — you shouldn't have to scroll past
        // everything to see what you just asked for. How big the new window is adapts to
        // how busy the board is: with just ONE other window open it takes the full LEFT
        // HALF (an even 50/50 split); with TWO OR MORE already open it shrinks to the
        // top-left QUADRANT so more of the existing layout stays visible. Locked windows
        // are anchored: the new window carves around them and they're never resized/pushed.
        if (existing?.locked) {
          return prev.map((b) => (b.id === existing.id ? { ...b, z: zRef.current++ } : b)); // pinned → just surface it
        }
        const boardW = boardRef.current;
        const H = tallH(boardHRef.current);
        // Already open → reuse that window (keep its id so it doesn't remount/reload).
        const nb: CanvasBlock = existing
          ? { ...existing, z: zRef.current++, placed: true }
          : { id: nextId(), key, context, width: w, z: zRef.current++, placed: true, x: 0, y: 0, w: 0, h: 0 };

        // Nothing else open → the new window gets the whole board.
        if (without.length === 0) return [{ ...nb, x: 0, y: 0, w: boardW, h: H }];

        // Reuse the snap-assist engine: 1 other open → left half; 2+ → top-left quadrant.
        // The others tile into the complementary free space, carved around anything locked.
        const zone: SnapLayout = without.length === 1 ? "left" : "tl";
        const list = [nb, ...without];
        const placements = computeSnap(list, nb.id, zone, boardW, H);
        if (placements) {
          return list.map((b) => {
            const p = placements.get(b.id);
            return p ? { ...b, ...p, placed: true } : b;
          });
        }
        // Chosen zone fully blocked by a locked window → fall back to landing on top.
        const lockedTop = without.filter((b) => b.locked && b.y < H + GAP);
        const newY = lockedTop.length ? Math.max(...lockedTop.map((b) => b.y + b.h)) + GAP : 0;
        const shift = newY + H + GAP;
        const moved = without.map((b) => (b.locked ? b : { ...b, y: b.y + shift }));
        return [{ ...nb, x: 0, y: newY, w: boardW, h: H }, ...moved];
      }

      // Default tiled layout: position comes from array order, so first = top-left.
      const nb: CanvasBlock = existing
        ? { ...existing, z: zRef.current++ }
        : { id: nextId(), key, context, width: w, z: zRef.current++, placed: false, x: 0, y: 0, w: 0, h: 0 };
      const list = append ? [...without, nb] : [nb, ...without];
      return layoutDefault(list);
    });

    // Bring the viewport back to the top so the freshly generated window is what
    // you're looking at (the board grows downward and the page scrolls).
    if (!append && typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutDefault]);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      // Re-flow the default layout when a window closes (3 → 2 side by side, …),
      // unless the user has a custom arrangement.
      return remaining.length > 0 && !remaining.some((b) => b.placed) ? layoutDefault(remaining) : remaining;
    });
  }, [layoutDefault]);

  const resizeBlock = useCallback((id: string, width: BlockWidth) => {
    setBlocks((prev) => prev.map((b) => (b.id === id
      ? { ...b, width, w: pxWidth(WIDTH_SPAN[width], boardRef.current), placed: true, z: zRef.current++ }
      : b)));
  }, []);

  const moveTo = useCallback((id: string, x: number, y: number) => {
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b; // locked windows don't move
      // Keep the whole window on the board: left/top ≥ 0, right edge ≤ board width.
      const nx = Math.max(0, Math.min(Math.round(x), Math.max(0, boardW - b.w)));
      const ny = Math.max(0, Math.round(y));
      return { ...b, x: nx, y: ny, placed: true };
    }));
  }, []);

  const sizeTo = useCallback((id: string, w: number, h: number) => {
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b; // locked windows don't resize
      // Right edge can't pass the board edge (the left edge is fixed in this gesture).
      const nw = Math.max(MIN_W, Math.min(Math.round(w), Math.max(MIN_W, boardW - b.x)));
      const nh = Math.max(MIN_H, Math.round(h));
      return { ...b, w: nw, h: nh, placed: true };
    }));
  }, []);

  // Left/top-edge resize: the caller keeps the opposite edge anchored and may pass
  // a negative x/y when dragged past the board; we clamp to the board here.
  const setRect = useCallback((id: string, r: { x: number; y: number; w: number; h: number }) => {
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b; // locked windows don't resize
      const nx = Math.max(0, Math.round(r.x));
      const ny = Math.max(0, Math.round(r.y));
      let nw = Math.max(MIN_W, Math.round(r.w));
      const nh = Math.max(MIN_H, Math.round(r.h));
      if (nx + nw > boardW) nw = Math.max(MIN_W, boardW - nx);
      return { ...b, x: nx, y: ny, w: nw, h: nh, placed: true };
    }));
  }, []);

  // Snap a window to a board zone — full screen, left/right/top/bottom half, or a
  // quadrant — like dragging a window to a screen edge (or the Windows snap menu).
  // Carves around any LOCKED window, and REFLOWS the other unlocked windows into the
  // complementary free space (Windows 11 "snap assist") so nothing gets overlapped.
  const snapTo = useCallback((id: string, layout: SnapLayout) => {
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    setSnapGhost(null);
    setBlocks((prev) => {
      const placements = computeSnap(prev, id, layout, boardW, H);
      if (!placements) return prev; // zone fully blocked by a locked window → no-op
      return prev.map((b) => {
        const p = placements.get(b.id);
        if (!p) return b;
        return { ...b, ...p, placed: true, z: b.id === id ? zRef.current++ : b.z };
      });
    });
  }, []);

  // Adapted preview for a zone: where the window would land (carved around locked
  // windows), the locked regions to shade, and where the other windows reflow — all
  // as board-relative percents so the snap menu can draw an accurate diagram.
  const snapPreview = useCallback((id: string, layout: SnapLayout): SnapPreview => {
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    const zone = snapZones(boardW, H)[layout];
    const locked = blocks.filter((b) => b.id !== id && b.locked);
    const c = carveAround(zone, locked);
    const box = (r: PxRect): SnapBox => ({
      left: (r.x / boardW) * 100, top: (r.y / H) * 100, width: (r.w / boardW) * 100, height: (r.h / H) * 100,
    });
    const placements = computeSnap(blocks, id, layout, boardW, H);
    const others = placements
      ? [...placements.entries()].filter(([bid]) => bid !== id).map(([, r]) => box(r))
      : [];
    return { rect: box(c), locked: locked.map((L) => box(L)), others, blocked: zoneBlocked(c, locked) };
  }, [blocks]);

  // Live on-board ghost while a snap option is hovered — the actual px rects for the
  // snapped window + where every other window reflows, drawn as translucent guides.
  const previewSnap = useCallback((id: string, layout: SnapLayout) => {
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    const placements = computeSnap(blocks, id, layout, boardW, H);
    if (!placements) { setSnapGhost(null); return; }
    const target = placements.get(id);
    if (!target) { setSnapGhost(null); return; }
    const others = [...placements.entries()].filter(([bid]) => bid !== id).map(([, r]) => r);
    setSnapGhost({ target, others });
  }, [blocks]);

  const clearSnapPreview = useCallback(() => setSnapGhost(null), []);

  // Tiling resize: when a window grows, push the windows sharing its row out of
  // the way; once the row fills the board they SHRINK (down to MIN_W) instead of
  // sliding off-screen, and the growing window is capped so neighbors stay >= MIN_W.
  // `origin` is the layout snapshot taken at gesture start so the push is recomputed
  // from scratch each frame (reversible — shrink the window back and neighbors restore).
  type Rect = { id: string; x: number; y: number; w: number; h: number; locked?: boolean };
  const resizeRow = useCallback((id: string, x: number, w: number, h: number, origin: Rect[]) => {
    const boardW = boardRef.current;
    const M0 = origin.find((b) => b.id === id);
    if (!M0 || M0.locked) return; // a locked window doesn't resize
    const vov = (a: Rect, b: Rect) => a.y < b.y + b.h && a.y + a.h > b.y; // share a row
    const nh = Math.max(MIN_H, Math.round(h));
    const packed = new Map<string, { x: number; w: number }>();
    let mx = M0.x;
    let mw: number;

    if (Math.round(x) === Math.round(M0.x)) {
      // Right edge / corner moved (left edge fixed) → push right-neighbors. A locked
      // neighbor is a WALL: growth stops at it and nothing past it moves.
      const rights = origin.filter((b) => b.id !== id && b.x >= M0.x && vov(b, M0)).sort((a, b) => a.x - b.x);
      const wallIdx = rights.findIndex((b) => b.locked);
      const wallX = wallIdx >= 0 ? rights[wallIdx].x : boardW + GAP; // wallX-GAP = board edge when no wall
      const pushable = wallIdx >= 0 ? rights.slice(0, wallIdx) : rights;
      const reserved = pushable.length * (MIN_W + GAP);
      const mRight = Math.max(M0.x + MIN_W, Math.min(M0.x + Math.round(w), wallX - GAP - reserved));
      mw = mRight - M0.x;
      let cursor = mRight + GAP;
      pushable.forEach((N, i) => {
        const after = (pushable.length - 1 - i) * (MIN_W + GAP);
        const nw = Math.max(MIN_W, Math.min(N.w, Math.round(wallX - GAP - cursor - after)));
        packed.set(N.id, { x: Math.round(cursor), w: nw });
        cursor += nw + GAP;
      });
    } else {
      // Left edge grew (right edge fixed) → push left-neighbors. A locked neighbor is
      // a WALL on the left: growth stops at its right edge.
      const fixedRight = M0.x + M0.w;
      const lefts = origin.filter((b) => b.id !== id && b.x < M0.x && vov(b, M0)).sort((a, b) => b.x - a.x);
      const wallIdx = lefts.findIndex((b) => b.locked);
      const wallRight = wallIdx >= 0 ? lefts[wallIdx].x + lefts[wallIdx].w : -GAP; // wallRight+GAP = 0 when no wall
      const pushable = wallIdx >= 0 ? lefts.slice(0, wallIdx) : lefts;
      const reserved = pushable.length * (MIN_W + GAP);
      const mLeft = Math.min(fixedRight - MIN_W, Math.max(Math.round(x), wallRight + GAP + reserved));
      mx = mLeft;
      mw = fixedRight - mLeft;
      let cursor = mLeft - GAP; // right edge available for the next left neighbor
      pushable.forEach((N, i) => {
        const after = (pushable.length - 1 - i) * (MIN_W + GAP);
        const nw = Math.max(MIN_W, Math.min(N.w, Math.round(cursor - (wallRight + GAP) - after)));
        const nx = Math.max(wallRight + GAP, Math.round(cursor - nw));
        packed.set(N.id, { x: nx, w: nw });
        cursor = nx - GAP;
      });
    }

    setBlocks((prev) => prev.map((b) => {
      if (b.id === id) return { ...b, x: mx, w: Math.max(MIN_W, mw), h: nh, placed: true };
      const p = packed.get(b.id);
      return p ? { ...b, x: p.x, w: p.w, placed: true } : b;
    }));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, z: zRef.current++ } : b)));
  }, []);

  // Drop resolution. Two behaviors:
  //  1. Dropped INTO a gap between a left and a right neighbor → shrink the dropped
  //     window to fit that gap (tiling-style), instead of shoving neighbors around.
  //  2. Otherwise → nudge every window the dropped one overlaps out of the way.
  const resolveCollisions = useCallback((id: string) => {
    setBlocks((prev) => {
      const moved = prev.find((b) => b.id === id);
      if (!moved) return prev;
      // Locked windows are anchored — they're never pushed by a drop.
      const hits = prev.filter((b) => b.id !== id && !b.locked && overlaps(b, moved));
      if (hits.length === 0) return prev;

      // Fit-to-gap: only when the drop straddles neighbors on BOTH sides.
      const cx = moved.x + moved.w / 2;
      const leftN = hits.filter((b) => b.x + b.w / 2 < cx);
      const rightN = hits.filter((b) => b.x + b.w / 2 >= cx);
      if (leftN.length && rightN.length) {
        const leftEdge = Math.max(...leftN.map((b) => b.x + b.w)) + GAP;
        const rightEdge = Math.min(...rightN.map((b) => b.x)) - GAP;
        const gapW = rightEdge - leftEdge;
        if (gapW >= MIN_W) {
          // Shrink the dropped window into the gap; keep its y/height.
          return prev.map((b) => (b.id === id ? { ...b, x: Math.round(leftEdge), w: Math.round(gapW) } : b));
        }
      }

      // Push the overlapped windows out of the way — but never off the board: if a
      // pushed window would cross the right edge, shrink it to fit (down to MIN_W).
      const boardW = boardRef.current;
      let changed = false;
      const next = prev.map((b) => {
        if (b.id === id || b.locked || !overlaps(b, moved)) return b;
        const p = pushOut(b, moved);
        let nx = p.x;
        let nw = b.w;
        if (nx + nw > boardW) nw = Math.max(MIN_W, boardW - nx);
        if (nx + nw > boardW) nx = Math.max(0, boardW - nw);
        if (nx === b.x && p.y === b.y && nw === b.w) return b;
        changed = true;
        return { ...b, x: nx, y: p.y, w: nw };
      });
      return changed ? next : prev;
    });
  }, []);

  const toggleLock = useCallback((id: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, locked: !b.locked } : b)));
  }, []);

  // Regenerate the auto-saved layout from a prior visit (the "Restore last session"
  // button, and the same-day auto-restore on mount). Restored windows start unlocked.
  const restoredRef = useRef(false);
  const [canRestore, setCanRestore] = useState(false);
  const restoreSession = useCallback(() => {
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    restoredRef.current = true;
    setCanRestore(false);
    const built = saved
      .filter((b) => b && typeof b.key === "string" && resolve(b.key))
      .map((b) => blockFromSaved(b, zRef.current++));
    setBlocks(built.some((b) => b.placed) ? built : layoutDefault(built));
  }, [savedSession, layoutDefault]);

  const clear = useCallback((keepKey?: string) => {
    setBlocks((prev) => (keepKey ? prev.filter((b) => b.key === keepKey) : []));
  }, []);

  // ── Launcher / external composition events ────────────────────────────────────
  useEffect(() => {
    function onAdd(e: Event) {
      const d = (e as CustomEvent).detail as { key?: string; context?: unknown; width?: BlockWidth; append?: boolean } | undefined;
      if (d?.key) addBlock(d.key, d.context, d.width, d.append);
    }
    function onClear(e: Event) {
      const d = (e as CustomEvent).detail as { keepKey?: string } | undefined;
      clear(d?.keepKey);
    }
    function onResize(e: Event) {
      // Width is informational now — the count-based default layout decides sizes.
      const d = (e as CustomEvent).detail as { key?: string; width?: BlockWidth } | undefined;
      if (!d?.key || !d?.width) return;
      const width = d.width;
      setBlocks((prev) => {
        const list = prev.map((b) => (b.key === d.key ? { ...b, width } : b));
        return prev.some((b) => b.placed) ? list : layoutDefault(list);
      });
    }
    function onPlace(e: Event) {
      const d = (e as CustomEvent).detail as { key?: string; afterKey?: string } | undefined;
      if (!d?.key || !d?.afterKey) return;
      setBlocks((prev) => {
        const srcIdx = prev.findIndex((b) => b.key === d.key);
        const tgtIdx = prev.findIndex((b) => b.key === d.afterKey);
        if (srcIdx === -1 || tgtIdx === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(srcIdx, 1);
        const insertAt = next.findIndex((b) => b.key === d.afterKey) + 1;
        next.splice(insertAt, 0, moved);
        return prev.some((b) => b.placed) ? next : layoutDefault(next);
      });
    }
    function onSwap(e: Event) {
      const d = (e as CustomEvent).detail as { keys?: string[]; contexts?: unknown[]; widths?: BlockWidth[] } | undefined;
      const keys = d?.keys ?? [];
      const contexts = d?.contexts ?? [];
      const widths = d?.widths ?? [];
      const built: CanvasBlock[] = keys.filter((k) => resolve(k)).map((key, i) => ({
        id: nextId(), key, context: contexts[i], width: widths[i] ?? resolve(key)?.defaultWidth,
        z: zRef.current++, placed: false, x: 0, y: 0, w: 0, h: DEFAULT_H,
      }));
      setBlocks(layoutDefault(built));
    }
    // Nav "Restore last session" button → regenerate the saved layout.
    function onRestore() { restoreSession(); }
    window.addEventListener("shift:canvas:add", onAdd);
    window.addEventListener("shift:canvas:clear", onClear);
    window.addEventListener("shift:canvas:resize", onResize);
    window.addEventListener("shift:canvas:place", onPlace);
    window.addEventListener("shift:canvas:swap", onSwap);
    window.addEventListener("shift:canvas:restore-session", onRestore);
    return () => {
      window.removeEventListener("shift:canvas:add", onAdd);
      window.removeEventListener("shift:canvas:clear", onClear);
      window.removeEventListener("shift:canvas:resize", onResize);
      window.removeEventListener("shift:canvas:place", onPlace);
      window.removeEventListener("shift:canvas:swap", onSwap);
      window.removeEventListener("shift:canvas:restore-session", onRestore);
    };
  }, [addBlock, clear, layoutDefault, restoreSession]);

  // ── Restore the prior session ─────────────────────────────────────────────────
  // On mount: a layout saved EARLIER TODAY (same local day) auto-restores so you
  // pick up where you left off; a layout from a PRIOR day stays parked behind the
  // "Restore last session" button (broadcast canRestore=true) and the canvas opens
  // on its default tiled set.
  const localDay = () => { try { return new Date().toLocaleDateString("en-CA"); } catch { return ""; } };
  useEffect(() => {
    if (!persist || restoredRef.current) return;
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    if (savedSession?.savedDay && savedSession.savedDay === localDay()) {
      restoreSession(); // same day → seamless resume
    } else {
      setCanRestore(true); // new day → offer to restore yesterday's session
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast canvas state (open count + whether a prior session can be restored)
  // so the nav's "Restore last session" button — rendered outside this provider —
  // can show/hide itself. Emit a cleared state on unmount (e.g. leaving /dashboard).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: blocks.length, canRestore } }));
    return () => { window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: 0, canRestore: false } })); };
  }, [blocks.length, canRestore]);

  // ── Auto-save the FULL layout (key + geometry, all windows) ───────────────────
  // Debounced on every change, plus a keepalive flush on tab-close/logout. Locks
  // are session-only, so they're not saved. An empty canvas is never saved (so a
  // momentary "closed everything" never clobbers the last real session). The save
  // endpoint is host-provided via `persist` (PUT /api/canvas-layout).
  const firstRun = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutSignature = blocks
    .map((b) => `${b.key}:${b.width ?? ""}:${Math.round(b.x)}:${Math.round(b.y)}:${Math.round(b.w)}:${Math.round(b.h)}`)
    .join("|");

  // Latest persistable payload, kept in a ref for the unload flush. Computed via
  // useMemo (pure) and synced into the ref in an effect — never written during
  // render (React Compiler lint).
  const payload = useMemo<{ blocks: SavedBlock[]; savedDay: string } | null>(() => (
    layoutSignature
      ? {
          savedDay: localDay(),
          blocks: layoutSignature.split("|").map((seg) => {
            const [key, width, x, y, w, h] = seg.split(":");
            return { key, ...(width ? { width: width as BlockWidth } : {}), x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
          }),
        }
      : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [layoutSignature]);
  const payloadRef = useRef(payload);
  useEffect(() => { payloadRef.current = payload; }, [payload]);

  useEffect(() => {
    if (!persist) return;
    if (firstRun.current) { firstRun.current = false; return; }
    if (!payloadRef.current) return; // never save an empty canvas
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const body = JSON.stringify(payloadRef.current);
    saveTimer.current = setTimeout(() => {
      void fetch("/api/canvas-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => { /* best-effort */ });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [persist, layoutSignature]);

  // Flush the latest layout when the tab is hidden / closed / on logout navigation,
  // using a keepalive fetch so it survives the page going away.
  useEffect(() => {
    if (!persist) return;
    const flush = () => {
      if (!payloadRef.current) return;
      try {
        void fetch("/api/canvas-layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadRef.current),
          keepalive: true,
        }).catch(() => { /* best-effort */ });
      } catch { /* ignore */ }
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [persist]);

  const api = useMemo<CanvasApi>(() => ({
    blocks, addBlock, removeBlock, resizeBlock, snapTo, snapPreview, previewSnap, clearSnapPreview, snapGhost, moveTo, sizeTo, setRect, resizeRow, bringToFront, resolveCollisions,
    toggleLock, clear, interacting, setInteracting, activeId, setActiveId, boardWidth,
  }), [blocks, addBlock, removeBlock, resizeBlock, snapTo, snapPreview, previewSnap, clearSnapPreview, snapGhost, moveTo, sizeTo, setRect, resizeRow, bringToFront, resolveCollisions, toggleLock, clear, interacting, activeId, boardWidth]);

  return <CanvasContext.Provider value={api}>{children}</CanvasContext.Provider>;
}
