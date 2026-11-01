"use client";

// ── Speech-to-text adapters ──────────────────────────────────────────────────
// The hook takes a `Listener` factory so products can swap in their own engine
// (RealShift's MediaRecorder → server-STT shim for WKWebView, for instance).
// This default wraps the browser's Web Speech API: one answer per start(), with
// interim text streamed to the box and a silence timer that submits the final.

export interface ListenerHandlers {
  onText: (text: string, final: boolean) => void;
  onEnd: () => void;
  onError: (code: string) => void;
}

export interface Listener {
  start: (h: ListenerHandlers) => void;
  stop: () => void;
}

interface Rec extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export function webSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export const SILENCE_MS = 1800;
export const WINDOW_MS = 15_000;

export function webSpeechListener(lang = "en-US"): Listener | null {
  if (!webSpeechSupported()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as new () => Rec;
  let rec: Rec | null = null;
  let silence: ReturnType<typeof setTimeout> | null = null;
  let window_: ReturnType<typeof setTimeout> | null = null;
  let finalText = "";
  let ended = false;

  const clear = () => {
    if (silence) clearTimeout(silence);
    if (window_) clearTimeout(window_);
    silence = null;
    window_ = null;
  };

  return {
    start(h) {
      if (rec) return;
      finalText = "";
      ended = false;
      const r = new Ctor();
      rec = r;
      r.continuous = true;
      r.interimResults = true;
      r.lang = lang;
      r.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText = `${finalText} ${res[0].transcript}`.trim();
          else interim = `${interim} ${res[0].transcript}`.trim();
        }
        h.onText(`${finalText} ${interim}`.trim(), false);
        if (window_) { clearTimeout(window_); window_ = null; }
        if (finalText) {
          if (silence) clearTimeout(silence);
          silence = setTimeout(() => { silence = null; try { r.stop(); } catch { /* already stopped */ } }, SILENCE_MS);
        }
      };
      r.onend = () => {
        clear();
        rec = null;
        if (ended) return;
        ended = true;
        if (finalText) h.onText(finalText, true);
        h.onEnd();
      };
      r.onerror = (e) => {
        const code = e?.error ?? "error";
        // "no-speech" and "aborted" are normal ends; the others matter.
        if (code !== "no-speech" && code !== "aborted") h.onError(code);
      };
      try {
        r.start();
      } catch {
        rec = null;
        h.onError("start-failed");
        return;
      }
      // A question window: if nobody says anything, close quietly.
      window_ = setTimeout(() => { try { r.stop(); } catch { /* noop */ } }, WINDOW_MS);
    },
    stop() {
      clear();
      const r = rec;
      if (!r) return;
      try { r.stop(); } catch { /* noop */ }
    },
  };
}

/** Ask for the microphone once, in response to the user's tap. Resolves granted/denied. */
export async function requestMicrophone(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
