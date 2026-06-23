'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ShiftBarState = 'idle' | 'wake' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface HeyShiftConfig {
  wakeWord?: string;           // default: 'hey shift'
  language?: string;           // default: 'en-US'
  silenceMs?: number;          // ms of silence before auto-submit, default: 1500
  onCommand?: (text: string) => Promise<string | void>;
  onStateChange?: (state: ShiftBarState) => void;
}

export interface HeyShiftReturn {
  state: ShiftBarState;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
  isSupported: boolean;
}

// Minimal inline types for Web Speech API (not guaranteed in all lib.dom.d.ts versions)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;
}

export function useHeyShift(config: HeyShiftConfig = {}): HeyShiftReturn {
  const {
    wakeWord = 'hey shift',
    language = 'en-US',
    silenceMs = 1500,
    onCommand,
    onStateChange,
  } = config;

  const [state, setState] = useState<ShiftBarState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  const recRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const accumulatedRef = useRef('');
  const stateRef = useRef<ShiftBarState>('idle'); // track state without stale closure

  const updateState = useCallback((s: ShiftBarState) => {
    stateRef.current = s;
    setState(s);
    onStateChange?.(s);
  }, [onStateChange]);

  useEffect(() => {
    const SR = getSpeechRecognitionCtor();
    setIsSupported(!!(SR && window.speechSynthesis));
  }, []);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return (
      voices.find(v => v.name.toLowerCase().includes('will')) ??
      voices.find(v => v.name.toLowerCase().includes('daniel')) ??
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) ??
      voices.find(v => v.lang.startsWith('en')) ??
      voices[0] ??
      null
    );
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      // voices may not be loaded yet; retry once
      const setVoiceAndSpeak = () => {
        const voice = getVoice();
        if (voice) utter.voice = voice;
        utter.rate = 1.05;
        utter.pitch = 0.95;
        updateState('speaking');
        utter.onend = () => { updateState('idle'); resolve(); };
        utter.onerror = () => { updateState('idle'); resolve(); };
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => { setVoiceAndSpeak(); };
      }
    });
  }, [getVoice, updateState]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (stateRef.current === 'speaking') updateState('idle');
  }, [updateState]);

  const resetSilenceTimer = useCallback((text: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(async () => {
      if (!activeRef.current || !text.trim()) return;
      activeRef.current = false;
      accumulatedRef.current = '';
      setTranscript('');
      updateState('thinking');
      try {
        const response = await onCommand?.(text.trim());
        if (response) {
          await speak(response);
        } else {
          updateState('idle');
        }
      } catch {
        updateState('error');
        setTimeout(() => updateState('idle'), 2000);
      }
    }, silenceMs);
  }, [silenceMs, onCommand, speak, updateState]);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognitionCtor();
    if (!SR || recRef.current) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim().toLowerCase();
        const isFinal = event.results[i].isFinal;

        if (!activeRef.current) {
          if (t.includes(wakeWord.toLowerCase())) {
            activeRef.current = true;
            accumulatedRef.current = '';
            setTranscript('');
            updateState('wake');
            setTimeout(() => {
              if (activeRef.current) updateState('listening');
            }, 300);
          }
        } else {
          const raw = event.results[i][0].transcript;
          if (isFinal) {
            accumulatedRef.current += ' ' + raw;
          }
          const display = (accumulatedRef.current + ' ' + (isFinal ? '' : raw)).trim();
          setTranscript(display);
          resetSilenceTimer(display);
        }
      }
    };

    rec.onend = () => {
      // Auto-restart unless stopListening() was called (which nulls recRef)
      if (recRef.current) {
        setTimeout(() => { recRef.current?.start(); }, 150);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') updateState('error');
    };

    rec.start();
    recRef.current = rec;
  }, [language, wakeWord, resetSilenceTimer, updateState]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = recRef.current;
    recRef.current = null; // null BEFORE stop so onend doesn't restart
    rec?.stop();
    activeRef.current = false;
    accumulatedRef.current = '';
    setTranscript('');
    updateState('idle');
  }, [updateState]);

  useEffect(() => {
    return () => {
      const rec = recRef.current;
      recRef.current = null;
      rec?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { state, transcript, startListening, stopListening, speak, cancelSpeech, isSupported };
}
