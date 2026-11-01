"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type FieldSnapshot, type FieldSpec, type FillRequest, type FillResult, coerceFills } from "./concierge";

// ── Field registry ───────────────────────────────────────────────────────────
// The onboarding form registers each input here (via <ConciergeField>). Will
// reads the registry as a snapshot (ids, labels, choices, current values) and
// writes through `apply` — which calls the field's OWN onChange, so the form's
// state and its existing save path stay the single writer. Nothing here talks
// to a database.

export interface ConciergeNav {
  stepIndex: number;
  stepTitle: string;
  stepCount: number;
  canAdvance: boolean;
  next: () => void;
  prev: () => void;
}

interface Entry {
  spec: FieldSpec;
  get: () => unknown;
  set: (value: unknown) => void;
}

export interface ConciergeFieldsValue {
  register: (entry: Entry) => void;
  unregister: (id: string) => void;
  snapshot: () => FieldSnapshot[];
  /** Coerce + write Will's fills into the registered fields. Returns what landed. */
  apply: (fills: FillRequest[]) => FillResult[];
  /** Ids Will filled in the last ~2 s (drives the fill highlight). */
  justFilled: ReadonlySet<string>;
  nav: ConciergeNav | null;
  setNav: (nav: ConciergeNav | null) => void;
  /** Bumps whenever a field registers/unregisters or the step changes. */
  version: number;
}

const Ctx = createContext<ConciergeFieldsValue | null>(null);

export const FILL_HIGHLIGHT_MS = 2000;

export function ConciergeFields({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>());
  const [justFilled, setJustFilled] = useState<Set<string>>(new Set());
  const [nav, setNavState] = useState<ConciergeNav | null>(null);
  const [version, setVersion] = useState(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const register = useCallback((entry: Entry) => {
    const had = entries.current.has(entry.spec.id);
    entries.current.set(entry.spec.id, entry);
    if (!had) setVersion((v) => v + 1);
  }, []);

  const unregister = useCallback((id: string) => {
    if (entries.current.delete(id)) setVersion((v) => v + 1);
  }, []);

  const snapshot = useCallback((): FieldSnapshot[] => {
    return [...entries.current.values()].map((e) => ({ ...e.spec, value: e.get() }));
  }, []);

  const apply = useCallback((fills: FillRequest[]): FillResult[] => {
    const results = coerceFills(snapshot(), fills);
    const landed: string[] = [];
    for (const r of results) {
      if (!r.ok) continue;
      const e = entries.current.get(r.id);
      if (!e) continue;
      e.set(r.value);
      landed.push(r.id);
    }
    if (landed.length) {
      setJustFilled((prev) => new Set([...prev, ...landed]));
      for (const id of landed) {
        const t = timers.current.get(id);
        if (t) clearTimeout(t);
        timers.current.set(
          id,
          setTimeout(() => {
            timers.current.delete(id);
            setJustFilled((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, FILL_HIGHLIGHT_MS),
        );
      }
    }
    return results;
  }, [snapshot]);

  const setNav = useCallback((n: ConciergeNav | null) => {
    setNavState((prev) => {
      if (prev === n) return prev;
      if (prev && n && prev.stepIndex === n.stepIndex && prev.stepTitle === n.stepTitle && prev.stepCount === n.stepCount && prev.canAdvance === n.canAdvance && prev.next === n.next && prev.prev === n.prev) return prev;
      return n;
    });
  }, []);

  useEffect(() => () => { for (const t of timers.current.values()) clearTimeout(t); }, []);

  const value = useMemo<ConciergeFieldsValue>(
    () => ({ register, unregister, snapshot, apply, justFilled, nav, setNav, version }),
    [register, unregister, snapshot, apply, justFilled, nav, setNav, version],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConciergeFields(): ConciergeFieldsValue | null {
  return useContext(Ctx);
}

// ── <ConciergeField> ─────────────────────────────────────────────────────────
// Wrap any input/select/button-group. `value` + `onChange` are the form's own
// state hooks; the wrapper registers them so Will can read and fill the field,
// and paints `ash-cg-filled` on the wrapper for a beat when he does.

export interface ConciergeFieldProps {
  spec: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
  children: ReactNode;
  className?: string;
}

export function ConciergeField({ spec, value, onChange, children, className = "" }: ConciergeFieldProps) {
  const ctx = useContext(Ctx);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const specRef = useRef(spec);
  valueRef.current = value;
  onChangeRef.current = onChange;
  specRef.current = spec;

  const id = spec.id;
  useEffect(() => {
    if (!ctx) return;
    ctx.register({
      spec: specRef.current,
      get: () => valueRef.current,
      set: (v) => onChangeRef.current(v),
    });
    return () => ctx.unregister(id);
    // Register once per id per mount; refs carry the live value/onChange/spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ctx?.register, ctx?.unregister]);

  const filled = ctx?.justFilled.has(id) ?? false;
  return (
    <div data-concierge-field={id} className={`ash-cg-field${filled ? " ash-cg-filled" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

/** The wizard publishes its step state so Will can narrate and move it. */
export function useConciergeNav(nav: ConciergeNav | null) {
  const ctx = useContext(Ctx);
  const setNav = ctx?.setNav;
  useEffect(() => {
    if (!setNav) return;
    setNav(nav);
    return () => setNav(null);
  }, [setNav, nav]);
}
