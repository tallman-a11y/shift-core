// Shift family voice — Will (ElevenLabs) with a shared, central TTS cache.
//
// Every line is synthesized ONCE and stored in the family-shared cache (the
// shift-brain project's public `tts-cache` bucket). Any product — LendShift,
// RealShift, WeldShift, the Shift companion, mobile — that speaks the same line
// gets it back for free, forever, with no ElevenLabs credits spent. Whole-line
// caching: fixed content (demo narration, canned companion phrases, numbers)
// trends to zero credits; genuinely novel lines cost once and then join the
// shared library.
//
// Reads are anonymous (public bucket → served from Supabase's CDN). Writes need
// the central service key. Both are optional: with no cache configured this
// degrades to a plain ElevenLabs call, so it's always safe to call.

export const WILL_VOICE_ID = "bIHbv24MWmeRgasZH58o";
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.1,
  use_speaker_boost: true,
} as const;
const CACHE_BUCKET = "tts-cache";

export interface SpeakConfig {
  /** ELEVENLABS_API_KEY */
  elevenLabsKey?: string;
  /** ELEVENLABS_VOICE_ID — defaults to Will */
  voiceId?: string;
  /** SHIFT_TTS_CACHE_URL — the central shift-brain project URL (https://<ref>.supabase.co) */
  cacheBaseUrl?: string;
  /** SHIFT_TTS_CACHE_KEY — central service-role key (writes only; reads are public) */
  cacheServiceKey?: string;
  modelId?: string;
  voiceSettings?: Record<string, unknown>;
}

export interface SpeakResult {
  /** MP3 audio bytes, or null on error / no-text. */
  audio: ArrayBuffer | null;
  /** hit = served from the shared cache; miss = freshly synthesized (and cached); skip = no audio produced. */
  cache: "hit" | "miss" | "skip";
  /** 200 ok · 400 no text · 502 ElevenLabs error · 503 not configured. */
  status: number;
  error?: { upstreamStatus: number; detail: string };
}

// Portable SHA-256 (Web Crypto — works in node + edge runtimes).
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Synthesize a line as Will, using the shared family TTS cache. Returns the audio
 * bytes plus whether it was a cache hit/miss. The caller (a product's voice route)
 * keeps its own auth / rate-limit and just wraps the returned bytes in a Response.
 */
export async function synthesizeSpeech(text: string, cfg: SpeakConfig): Promise<SpeakResult> {
  const clean = text?.trim();
  if (!clean) return { audio: null, cache: "skip", status: 400 };

  const voiceId = cfg.voiceId || WILL_VOICE_ID;
  const modelId = cfg.modelId || DEFAULT_MODEL_ID;
  const settings = cfg.voiceSettings || DEFAULT_VOICE_SETTINGS;
  const hash = await sha256Hex(`${voiceId}|${modelId}|${JSON.stringify(settings)}|${clean}`);
  const path = `${hash}.mp3`;
  const base = cfg.cacheBaseUrl?.replace(/\/$/, "");

  // 1) Shared cache hit (anonymous public read → CDN).
  if (base) {
    try {
      const r = await fetch(`${base}/storage/v1/object/public/${CACHE_BUCKET}/${path}`);
      if (r.ok) {
        const audio = await r.arrayBuffer();
        if (audio.byteLength > 0) return { audio, cache: "hit", status: 200 };
      }
    } catch { /* treat as miss */ }
  }

  // 2) Fresh synth.
  if (!cfg.elevenLabsKey) return { audio: null, cache: "skip", status: 503 };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": cfg.elevenLabsKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, model_id: modelId, voice_settings: settings }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "unknown")).slice(0, 300);
    return { audio: null, cache: "skip", status: 502, error: { upstreamStatus: res.status, detail } };
  }
  const audio = await res.arrayBuffer();

  // 3) Populate the shared cache (awaited so it survives serverless freeze; failure never blocks playback).
  if (base && cfg.cacheServiceKey) {
    try {
      await fetch(`${base}/storage/v1/object/${CACHE_BUCKET}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.cacheServiceKey}`,
          "Content-Type": "audio/mpeg",
          "x-upsert": "true",
        },
        body: audio,
      });
    } catch { /* cache write is best-effort */ }
  }

  return { audio, cache: "miss", status: 200 };
}

/** Convenience: build a SpeakConfig from standard env vars. */
export function speakConfigFromEnv(env: Record<string, string | undefined> = process.env): SpeakConfig {
  return {
    elevenLabsKey: env.ELEVENLABS_API_KEY,
    voiceId: env.ELEVENLABS_VOICE_ID,
    cacheBaseUrl: env.SHIFT_TTS_CACHE_URL,
    cacheServiceKey: env.SHIFT_TTS_CACHE_KEY,
  };
}
