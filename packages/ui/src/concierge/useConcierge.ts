"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ShiftBarState } from "../voice/useHeyShift";
import {
  type ConciergeState,
  type FieldSnapshot,
  type FillRequest,
  type Line,
  type MicChoice,
  type Moment,
  cleanName,
  conciergeReducer,
  endsWithQuestion,
  greetingForHour,
  initialConciergeState,
  nextLineId,
  summarizeFills,
} from "./concierge";
import type { ConciergeFieldsValue } from "./FieldRegistry";
import { type Listener, requestMicrophone, webSpeechListener } from "./listeners";
import { useAudioGate } from "./useAudioGate";

// ── Script ───────────────────────────────────────────────────────────────────
// Products supply Will's scripted lines. Everything else he says comes from the
// product's concierge route (adapters.ask).

export interface StepContext {
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  name: string | null;
}

export interface ConciergeScript {
  product: { name: string; noun: string };
  lines: {
    landing: (ctx: { greeting: string }) => string;
    askName: () => string;
    meet: (name: string) => string;
    /** Return null to say nothing on a step. */
    step: (ctx: StepContext) => string | null;
    done: (name: string | null) => string;
    micDenied: () => string;
    heardNothing: () => string;
  };
}

export interface AskRequest {
  message: string;
  moment: Moment;
  name: string | null;
  history: Line[];
  fields: FieldSnapshot[];
  nav: { stepTitle: string; stepIndex: number; stepCount: number } | null;
}

export interface AskResult {
  text: string;
  fills?: FillRequest[];
  name?: string;
  nav?: "next" | "prev";
  explain?: string;
}

export interface ConciergeAdapters {
  /** Speak a line as Will; resolve when done (or when speech is unavailable). */
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
  ask: (req: AskRequest) => Promise<AskResult>;
  /** Swap the speech-to-text engine (defaults to Web Speech). */
  listen?: () => Listener | null;
  /** Persist the name the moment it is captured (e.g. auth user metadata). */
  onName?: (name: string) => void | Promise<void>;
  requestMic?: () => Promise<boolean>;
}

export interface UseConciergeOptions {
  script: ConciergeScript;
  adapters: ConciergeAdapters;
  /** Off = renders nothing, says nothing (feature flag). */
  enabled?: boolean;
  initialMoment?: Moment;
  /** The registered field that holds the user's name (filled when captured). */
  nameFieldId?: string;
  fields?: ConciergeFieldsValue | null;
  /** Start muted (voice off) — the per-device "quiet" preference. */
  initialMuted?: boolean;
  /** Already known (returning user, auth metadata) — skips the name moment. */
  initialName?: string | null;
  hour?: number;
}

export interface UseConciergeReturn {
  state: ConciergeState;
  barState: ShiftBarState;
  input: string;
  setInput: (v: string) => void;
  /** Send the box (or the given text) to Will. */
  send: (text?: string) => Promise<void>;
  /** Tap the mic: start/stop listening (asks permission on first use). */
  onMic: () => void;
  chooseMic: (choice: MicChoice) => void;
  toggleMute: () => void;
  /** Show the two-choice permission card? */
  showPermission: boolean;
  unlocked: boolean;
  /** Move the conversation: askName (after signup), done (after save). */
  startMoment: (m: Moment) => void;
  /** Have Will say a line (scripted by the product) — text now, voice when allowed. */
  say: (text: string) => void;
  listening: boolean;
  speaking: boolean;
}

export function useConcierge(opts: UseConciergeOptions): UseConciergeReturn {
  const { script, adapters, enabled = true, initialMoment = "landing", nameFieldId, fields = null, initialMuted = false, initialName = null } = opts;
  const [state, dispatch] = useReducer(conciergeReducer, undefined, () => ({ ...initialConciergeState(initialMoment), muted: initialMuted, name: initialName }));
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);

  // Live refs for callbacks that outlive a render.
  const S = useRef(state);
  S.current = state;
  const A = useRef(adapters);
  A.current = adapters;
  const F = useRef(fields);
  F.current = fields;
  const listenerRef = useRef<Listener | null>(null);
  const pendingSpeech = useRef<string | null>(null);
  const announced = useRef(new Set<string>());
  const speakGen = useRef(0);

  // ── Voice out ──────────────────────────────────────────────────────────────
  const speakNow = useCallback(async (text: string) => {
    const gen = ++speakGen.current;
    setSpeaking(true);
    try {
      await A.current.speak(text);
    } finally {
      if (gen === speakGen.current) {
        setSpeaking(false);
        // After a question, with the mic chosen, open the window for the answer.
        if (S.current.micChoice === "voice" && endsWithQuestion(text) && !S.current.muted) startListeningRef.current();
      }
    }
  }, []);

  const { unlocked } = useAudioGate(() => {
    dispatch({ type: "unlockVoice" });
    const p = pendingSpeech.current;
    pendingSpeech.current = null;
    if (p && !S.current.muted) void speakNow(p);
  });

  const say = useCallback((text: string) => {
    if (!text) return;
    dispatch({ type: "will", text, id: nextLineId() });
    if (S.current.muted) return;
    if (unlocked || S.current.voiceUnlocked) {
      pendingSpeech.current = null;
      void speakNow(text);
    } else {
      // Only the most recent line is spoken when the gate opens — never a backlog.
      pendingSpeech.current = text;
    }
  }, [unlocked, speakNow]);

  // ── Voice in ───────────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
  }, []);

  const startListeningRef = useRef<() => void>(() => undefined);
  const startListening = useCallback(() => {
    if (listenerRef.current || S.current.muted || S.current.micChoice !== "voice") return;
    const make = A.current.listen ?? (() => webSpeechListener());
    const l = make();
    if (!l) return;
    listenerRef.current = l;
    setListening(true);
    let heard = false;
    l.start({
      onText: (text, final) => {
        heard = heard || !!text;
        setInput(text);
        if (final && text.trim()) {
          listenerRef.current = null;
          setListening(false);
          void sendRef.current(text);
        }
      },
      onEnd: () => {
        listenerRef.current = null;
        setListening(false);
        if (!heard && S.current.moment === "askName") say(script.lines.heardNothing());
      },
      onError: (code) => {
        listenerRef.current = null;
        setListening(false);
        if (code === "not-allowed" || code === "service-not-allowed") {
          dispatch({ type: "chooseMic", choice: "denied" });
          say(script.lines.micDenied());
        }
      },
    });
  }, [say, script]);
  startListeningRef.current = startListening;

  const chooseMic = useCallback((choice: MicChoice) => {
    if (choice === "voice") {
      const req = A.current.requestMic ?? requestMicrophone;
      void req().then((ok) => {
        if (ok) {
          dispatch({ type: "chooseMic", choice: "voice" });
          dispatch({ type: "unlockVoice" });
          // The tap that granted the mic is a gesture: speak the pending line, then listen.
          const p = pendingSpeech.current;
          pendingSpeech.current = null;
          if (p && !S.current.muted) void speakNow(p);
          else startListeningRef.current();
        } else {
          dispatch({ type: "chooseMic", choice: "denied" });
          say(script.lines.micDenied());
        }
      });
      return;
    }
    dispatch({ type: "chooseMic", choice });
  }, [say, script, speakNow]);

  const onMic = useCallback(() => {
    if (listenerRef.current) { stopListening(); return; }
    if (S.current.micChoice === "voice") { A.current.cancelSpeech(); setSpeaking(false); startListening(); return; }
    if (S.current.micChoice === "denied") { say(script.lines.micDenied()); return; }
    chooseMic("voice");
  }, [chooseMic, say, script, startListening, stopListening]);

  const toggleMute = useCallback(() => {
    const next = !S.current.muted;
    dispatch({ type: "mute", muted: next });
    if (next) { A.current.cancelSpeech(); setSpeaking(false); stopListening(); pendingSpeech.current = null; }
  }, [stopListening]);

  // ── Name ───────────────────────────────────────────────────────────────────
  const handleName = useCallback(async (name: string) => {
    dispatch({ type: "setName", name });
    try { await A.current.onName?.(name); } catch { /* persisting the name never blocks the greeting */ }
    if (nameFieldId) F.current?.apply([{ id: nameFieldId, value: name }]);
    dispatch({ type: "moment", moment: "meet" });
    say(script.lines.meet(name));
  }, [nameFieldId, say, script]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendRef = useRef<(text?: string) => Promise<void>>(async () => undefined);
  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || S.current.busy) return;
    stopListening();
    A.current.cancelSpeech();
    setSpeaking(false);
    setInput("");
    dispatch({ type: "user", text: msg });

    // The name moment: short answers resolve locally, instantly.
    if (S.current.moment === "askName") {
      const n = cleanName(msg);
      if (n && n.split(" ").length <= 3) { await handleName(n); return; }
    }

    dispatch({ type: "busy", busy: true });
    setThinking(true);
    try {
      const f = F.current;
      const snapshot = f?.snapshot() ?? [];
      const nav = f?.nav ? { stepTitle: f.nav.stepTitle, stepIndex: f.nav.stepIndex, stepCount: f.nav.stepCount } : null;
      const res = await A.current.ask({ message: msg, moment: S.current.moment, name: S.current.name, history: S.current.lines.slice(-12), fields: snapshot, nav });
      let reply = res.text?.trim() ?? "";
      if (res.name && !S.current.name) {
        // The model captured the name — keep its greeting as the meet line.
        dispatch({ type: "setName", name: res.name });
        try { await A.current.onName?.(res.name); } catch { /* noop */ }
        if (nameFieldId) f?.apply([{ id: nameFieldId, value: res.name }]);
        if (S.current.moment === "askName") {
          dispatch({ type: "moment", moment: "meet" });
          if (!reply) reply = script.lines.meet(res.name);
        }
      }
      if (res.fills?.length && f) {
        const results = f.apply(res.fills);
        if (!reply) reply = summarizeFills(snapshot, results);
      }
      if (res.nav === "next" && f?.nav?.canAdvance) f.nav.next();
      else if (res.nav === "prev") f?.nav?.prev();
      if (reply) say(reply);
    } catch {
      say("I lost the thread for a second. Say that again, or just keep typing in the form.");
    } finally {
      dispatch({ type: "busy", busy: false });
      setThinking(false);
    }
  }, [handleName, input, nameFieldId, say, script, stopListening]);
  sendRef.current = send;

  // ── Moments ────────────────────────────────────────────────────────────────
  const startMoment = useCallback((m: Moment) => {
    dispatch({ type: "moment", moment: m });
  }, []);

  // Scripted lines fire once per (moment / step) — not on every render.
  const hour = opts.hour ?? new Date().getHours();
  const navKey = fields?.nav ? `${fields.nav.stepIndex}:${fields.nav.stepTitle}` : "";
  useEffect(() => {
    if (!enabled) return;
    const { moment, name } = state;
    if (moment === "landing") {
      const k = "landing";
      if (!announced.current.has(k)) { announced.current.add(k); say(script.lines.landing({ greeting: greetingForHour(hour) })); }
    } else if (moment === "askName") {
      const k = "askName";
      if (!announced.current.has(k)) { announced.current.add(k); say(script.lines.askName()); }
    } else if (moment === "meet") {
      // After the meet line finishes speaking (or straight away when muted), move into the form.
      if (!speaking) {
        const t = setTimeout(() => dispatch({ type: "moment", moment: "fill" }), state.muted || !state.voiceUnlocked ? 900 : 150);
        return () => clearTimeout(t);
      }
    } else if (moment === "fill") {
      if (!fields?.nav) return;
      const k = `step:${navKey}`;
      if (!announced.current.has(k)) {
        announced.current.add(k);
        const line = script.lines.step({ stepTitle: fields.nav.stepTitle, stepIndex: fields.nav.stepIndex, stepCount: fields.nav.stepCount, name });
        if (line) say(line);
      }
    } else if (moment === "done") {
      const k = "done";
      if (!announced.current.has(k)) { announced.current.add(k); stopListening(); say(script.lines.done(name)); }
    }
  }, [enabled, state.moment, state.name, state.muted, state.voiceUnlocked, speaking, navKey, fields?.nav, hour, say, script, stopListening, state]);

  // Cleanup: never leave a mic open or a voice talking after unmount.
  useEffect(() => () => { listenerRef.current?.stop(); A.current.cancelSpeech(); }, []);

  const barState: ShiftBarState = listening ? "listening" : thinking ? "thinking" : speaking ? "speaking" : "idle";
  const showPermission = enabled && state.micChoice === "unset" && (state.moment === "askName" || state.moment === "meet" || state.moment === "fill");

  return useMemo(() => ({
    state, barState, input, setInput, send, onMic, chooseMic, toggleMute, showPermission, unlocked: unlocked || state.voiceUnlocked, startMoment, say, listening, speaking,
  }), [state, barState, input, send, onMic, chooseMic, toggleMute, showPermission, unlocked, startMoment, say, listening, speaking]);
}
