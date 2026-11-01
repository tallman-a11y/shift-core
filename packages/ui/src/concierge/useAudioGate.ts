"use client";

import { useEffect, useRef, useState } from "react";

// ── Audio gate ───────────────────────────────────────────────────────────────
// Browsers refuse to play audio before the first user gesture, so Will's landing
// greeting shows as live-typed text and his VOICE starts on the first tap, click
// or key (focusing the email field counts). The App Store shells grant autoplay,
// so there Will speaks from the first frame. One gate per page.

/** Every Shift native shell stamps "<Product>ShiftApp/<ver>" into the UA. */
export function isShiftShell(ua?: string): boolean {
  const s = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /ShiftApp\//i.test(s);
}

export interface AudioGate {
  /** True once audio may play (a gesture happened, or we're in a shell). */
  unlocked: boolean;
  shell: boolean;
}

export function useAudioGate(onUnlock?: () => void): AudioGate {
  const [shell] = useState(() => isShiftShell());
  const [unlocked, setUnlocked] = useState(() => isShiftShell());
  const cb = useRef(onUnlock);
  cb.current = onUnlock;
  const fired = useRef(false);

  useEffect(() => {
    if (unlocked) {
      if (!fired.current) {
        fired.current = true;
        cb.current?.();
      }
      return;
    }
    const unlock = () => {
      if (fired.current) return;
      fired.current = true;
      setUnlocked(true);
      cb.current?.();
      remove();
    };
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const remove = () => {
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      window.removeEventListener("touchend", unlock, opts);
    };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchend", unlock, opts);
    return remove;
  }, [unlocked]);

  return { unlocked, shell };
}
