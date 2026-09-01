import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SENSITIVE_PLACEHOLDER,
  WILL_VOICE_ID,
  realSecret,
  speakConfigFromEnv,
  synthesizeSpeech,
} from "./voice.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("realSecret", () => {
  it("keeps a real credential, trimmed", () => {
    expect(realSecret("sk_live_abc")).toBe("sk_live_abc");
    // A pulled .env can leave a stray newline on the value.
    expect(realSecret("sk_live_abc\n")).toBe("sk_live_abc");
  });

  it("rejects the Sensitive placeholder", () => {
    expect(realSecret(SENSITIVE_PLACEHOLDER)).toBeUndefined();
    expect(realSecret("[SENSITIVE]")).toBeUndefined();
    expect(realSecret('  "[SENSITIVE]"  '.replace(/"/g, ""))).toBeUndefined();
  });

  it("rejects absent and blank values", () => {
    expect(realSecret(undefined)).toBeUndefined();
    expect(realSecret("")).toBeUndefined();
    expect(realSecret("   ")).toBeUndefined();
  });

  it("does not reject a value that merely contains the word", () => {
    expect(realSecret("[SENSITIVE]x")).toBe("[SENSITIVE]x");
    expect(realSecret("SENSITIVE")).toBe("SENSITIVE");
  });
});

describe("speakConfigFromEnv", () => {
  it("reads real values", () => {
    const cfg = speakConfigFromEnv({
      ELEVENLABS_API_KEY: "sk_live_abc",
      ELEVENLABS_VOICE_ID: "voice_123",
      SHIFT_TTS_CACHE_URL: "https://cache.example",
      SHIFT_TTS_CACHE_KEY: "svc_key",
    });
    expect(cfg).toEqual({
      elevenLabsKey: "sk_live_abc",
      voiceId: "voice_123",
      cacheBaseUrl: "https://cache.example",
      cacheServiceKey: "svc_key",
    });
  });

  it("treats every placeholder as absent", () => {
    const cfg = speakConfigFromEnv({
      ELEVENLABS_API_KEY: SENSITIVE_PLACEHOLDER,
      ELEVENLABS_VOICE_ID: SENSITIVE_PLACEHOLDER,
      SHIFT_TTS_CACHE_URL: SENSITIVE_PLACEHOLDER,
      SHIFT_TTS_CACHE_KEY: SENSITIVE_PLACEHOLDER,
    });
    expect(cfg.elevenLabsKey).toBeUndefined();
    expect(cfg.voiceId).toBeUndefined();
    expect(cfg.cacheBaseUrl).toBeUndefined();
    expect(cfg.cacheServiceKey).toBeUndefined();
  });

  it("strips each variable independently", () => {
    // A readable key with an unreadable cache key must still speak — it just
    // synthesises fresh instead of sharing.
    const cfg = speakConfigFromEnv({
      ELEVENLABS_API_KEY: "sk_live_abc",
      SHIFT_TTS_CACHE_KEY: SENSITIVE_PLACEHOLDER,
      SHIFT_TTS_CACHE_URL: "https://cache.example",
    });
    expect(cfg.elevenLabsKey).toBe("sk_live_abc");
    expect(cfg.cacheServiceKey).toBeUndefined();
    expect(cfg.cacheBaseUrl).toBe("https://cache.example");
  });
});

describe("synthesizeSpeech", () => {
  it("refuses empty text without calling out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await synthesizeSpeech("   ", { elevenLabsKey: "sk_live_abc" });
    expect(r).toEqual({ audio: null, cache: "skip", status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports not-configured for a placeholder key instead of calling ElevenLabs", async () => {
    // The heart of it: without this guard the placeholder goes upstream and
    // comes back 401, which reads as a rotated key rather than as "this
    // environment cannot see the secret".
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await synthesizeSpeech("hello", {
      elevenLabsKey: SENSITIVE_PLACEHOLDER,
    });
    expect(r.status).toBe(503);
    expect(r.cache).toBe("skip");
    expect(r.audio).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to Will when the voice id is a placeholder", async () => {
    // A blank or placeholder voice id is its own upstream 400 (invalid_uid).
    const fetchMock = vi.fn(async (_url: unknown) => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const r = await synthesizeSpeech("hello", {
      elevenLabsKey: "sk_live_abc",
      voiceId: SENSITIVE_PLACEHOLDER,
    });

    expect(r.status).toBe(200);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain(WILL_VOICE_ID);
    expect(url).not.toContain("SENSITIVE");
  });

  it("does not try to read a cache whose base url is a placeholder", async () => {
    const fetchMock = vi.fn(async (_url: unknown) => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await synthesizeSpeech("hello", {
      elevenLabsKey: "sk_live_abc",
      cacheBaseUrl: SENSITIVE_PLACEHOLDER,
      cacheServiceKey: "svc",
    });

    // Exactly one call — the synthesis. No cache read, no cache write.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toContain("api.elevenlabs.io");
  });

  it("does not attempt a cache write with a placeholder service key", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: unknown) => {
      calls.push(String(url));
      // Cache read misses; synthesis succeeds.
      if (String(url).includes("/object/public/")) return { ok: false };
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const r = await synthesizeSpeech("hello", {
      elevenLabsKey: "sk_live_abc",
      cacheBaseUrl: "https://cache.example",
      cacheServiceKey: SENSITIVE_PLACEHOLDER,
    });

    expect(r.status).toBe(200);
    expect(r.cache).toBe("miss");
    // A read and a synthesis, but never a write.
    expect(calls.some((c) => c.includes("/object/public/"))).toBe(true);
    expect(calls.some((c) => c.includes("api.elevenlabs.io"))).toBe(true);
    expect(
      calls.some(
        (c) => c.includes("/object/") && !c.includes("/object/public/"),
      ),
    ).toBe(false);
  });

  it("still serves a cache hit when the key is unreadable", async () => {
    // Reads are anonymous, so an environment that cannot see the ElevenLabs
    // key can still replay anything the family has already spoken.
    const fetchMock = vi.fn(async (_url: unknown) => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(16),
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const r = await synthesizeSpeech("hello", {
      elevenLabsKey: SENSITIVE_PLACEHOLDER,
      cacheBaseUrl: "https://cache.example",
    });

    expect(r.status).toBe(200);
    expect(r.cache).toBe("hit");
    expect(r.audio?.byteLength).toBe(16);
  });
});
