"use client";

import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShiftBar } from "../voice/ShiftBar";
import type { ShiftBarState } from "../voice/useHeyShift";
import { detectMode } from "../canvas/duo";
import type { Line, MicChoice } from "./concierge";

// ── <ShiftConcierge> — the host ──────────────────────────────────────────────
// Will's transcript (his latest line live-types) + the Shift box: ONE text input
// with ONE mic button, plus the two-choice microphone card. On phones it docks
// to the bottom and rides above the keyboard; on wide screens it is a column.
// Brand-neutral: colors come from the --shift-* tokens. Styles: canvas.css.

export interface ShiftConciergeProps {
  lines: Line[];
  barState: ShiftBarState;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  micChoice: MicChoice;
  onChooseMic: (c: MicChoice) => void;
  showPermission: boolean;
  muted: boolean;
  onToggleMute: () => void;
  busy?: boolean;
  /** auto: phone→dock, wide→column. auto-float: phone→dock, wide→floating card (landing pages). */
  layout?: "auto" | "auto-float" | "dock" | "column" | "float";
  speakerName?: string;
  placeholder?: string;
  /** The permission card copy (product supplies; keep it one short sentence). */
  permissionText?: string;
  /** Lines shown in the dock (phones). Column shows the whole transcript. */
  dockLines?: number;
  /** Live-type Will's latest line (off for reduced motion). */
  typewriter?: boolean;
  className?: string;
}

const CPS = 48; // live-type speed, chars per second

type Layout = NonNullable<ShiftConciergeProps["layout"]>;
type Mode = "dock" | "column" | "float";

function useLayout(layout: Layout): Mode {
  const wide: Mode = layout === "auto-float" ? "float" : "column";
  const [mode, setMode] = useState<Mode>(layout === "auto" || layout === "auto-float" ? wide : layout);
  useEffect(() => {
    if (layout !== "auto" && layout !== "auto-float") { setMode(layout); return; }
    const compute = () => {
      const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      const w = Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth);
      setMode(detectMode(w, window.innerHeight, coarse) === "phone" ? "dock" : wide);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [layout, wide]);
  return mode;
}

// Keyboard offset for the dock: the visual viewport shrinks when the keyboard is
// up; pin the dock to its bottom edge so the Shift box stays visible.
function useKeyboardOffset(active: boolean): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setOffset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, [active]);
  return offset;
}

function useTyped(text: string, enabled: boolean): string {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) { setN(text.length); return; }
    setN(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const next = Math.min(text.length, Math.floor(((now - start) / 1000) * CPS));
      setN(next);
      if (next < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);
  return text.slice(0, n);
}

export function ShiftConcierge(props: ShiftConciergeProps) {
  const {
    lines, barState, input, onInputChange, onSend, onMic, micChoice, onChooseMic, showPermission, muted, onToggleMute,
    busy = false, layout = "auto", speakerName = "Will", placeholder = "Type here, or tap the mic", permissionText,
    dockLines = 3, typewriter = true, className = "",
  } = props;
  const mode = useLayout(layout);
  const kb = useKeyboardOffset(mode === "dock");
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const last = lines[lines.length - 1];
  const lastWill = last?.who === "will" ? last : null;
  const typed = useTyped(lastWill?.text ?? "", typewriter && !reduced && !!lastWill);
  const shown = mode === "dock" ? lines.slice(-dockLines) : lines;
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length, typed]);

  // Choosing "I'll type" puts the cursor in the box.
  useEffect(() => { if (micChoice === "text") inputRef.current?.focus(); }, [micChoice]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  // Fixed layouts portal to <body>: any ancestor with a transform/filter (page
  // transitions keep `filter: blur(0px)`) would otherwise become the containing
  // block and park the dock at the bottom of the DOCUMENT, not the viewport.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(mode === "column" ? null : document.body); }, [mode]);

  const listening = barState === "listening";
  const node = (
    <aside
      className={`ash-cg ash-cg--${mode} ash-surface${className ? ` ${className}` : ""}`}
      style={mode === "dock" ? { bottom: kb } : undefined}
      aria-label={`${speakerName}, your assistant`}
    >
      <div className="ash-cg-head">
        <ShiftBar state={barState} size={6} />
        <span className="ash-cg-name">{speakerName}</span>
        <button type="button" className="ash-cg-mute" onClick={onToggleMute} aria-pressed={muted} aria-label={muted ? `Unmute ${speakerName}` : `Mute ${speakerName}`}>
          {muted ? "Voice off" : "Voice on"}
        </button>
      </div>

      <div ref={scroller} className="ash-cg-lines" aria-live="polite" aria-relevant="additions text">
        {shown.map((l) => (
          <p key={l.id} className={`ash-cg-line ash-cg-line--${l.who}`}>
            {l === lastWill ? typed : l.text}
            {l === lastWill && typed.length < l.text.length && <span className="ash-cg-caret" aria-hidden />}
          </p>
        ))}
      </div>

      {showPermission && (
        <div className="ash-cg-perm" role="group" aria-label="How do you want to answer?">
          <p className="ash-cg-perm-text">{permissionText ?? `Answer out loud, or type below. Your choice.`}</p>
          <div className="ash-cg-perm-row">
            <button type="button" className="ash-cg-perm-btn ash-cg-perm-btn--voice" onClick={() => onChooseMic("voice")}>Use my voice</button>
            <button type="button" className="ash-cg-perm-btn" onClick={() => onChooseMic("text")}>I&apos;ll type</button>
          </div>
        </div>
      )}

      <div className="ash-cg-row">
        <button
          type="button"
          className={`ash-cg-mic${listening ? " ash-cg-mic--on" : ""}${micChoice === "denied" ? " ash-cg-mic--off" : ""}`}
          onClick={onMic}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : micChoice === "denied" ? "Microphone blocked" : "Talk to " + speakerName}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
            {micChoice === "denied" && <path d="M4 4l16 16" />}
          </svg>
        </button>
        <textarea
          ref={inputRef}
          className="ash-cg-input"
          rows={1}
          value={input}
          placeholder={listening ? "Listening…" : placeholder}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKey}
          disabled={busy}
          aria-label="Shift box"
        />
        <button type="button" className="ash-cg-send" onClick={onSend} disabled={busy || !input.trim()} aria-label="Send">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
  if (mode === "column") return node;
  // Until the portal target exists (first client render) keep the node in place so
  // SSR markup and the first paint still show Will's line.
  return portalTarget ? createPortal(node, portalTarget) : node;
}

export default ShiftConcierge;
