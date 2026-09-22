import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateKeyPairSync, sign } from 'node:crypto';
import {
  areaCodeOf, createFaxClient, faxDocumentName, formatUS, last10, parseFaxEvent, toE164, verifyTelnyxSignature,
} from './fax.js';

describe('phone helpers', () => {
  it('normalises US numbers to E.164', () => {
    expect(toE164('(816) 555-0100')).toBe('+18165550100');
    expect(toE164('1 816 555 0100')).toBe('+18165550100');
    expect(toE164('+44 20 7946 0958')).toBe('+442079460958');
    expect(toE164('555-0100')).toBeNull();
    expect(toE164(null)).toBeNull();
  });

  it('matches senders on the last ten digits', () => {
    expect(last10('+18165550100')).toBe('8165550100');
    expect(last10('816.555.0100')).toBe('8165550100');
    expect(last10(undefined)).toBe('');
  });

  it('finds the area code and formats for display', () => {
    expect(areaCodeOf('816-555-0100')).toBe('816');
    expect(areaCodeOf('nope')).toBeNull();
    expect(formatUS('+18165550100')).toBe('(816) 555-0100');
    expect(formatUS('+442079460958')).toBe('+442079460958');
  });
});

describe('verifyTelnyxSignature', () => {
  // Telnyx signs `${timestamp}|${rawBody}` with the account's Ed25519 key and
  // publishes the raw 32-byte public key base64-encoded.
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const rawPub = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
  const body = JSON.stringify({ data: { event_type: 'fax.received', id: 'e1', payload: { fax_id: 'f1' } } });
  const now = 1_800_000_000;
  const ts = String(now);
  const sig = sign(null, Buffer.from(`${ts}|${body}`), privateKey).toString('base64');

  it('accepts a genuine signature inside the replay window', () => {
    expect(verifyTelnyxSignature(body, sig, ts, rawPub, now + 60)).toBe(true);
  });

  it('rejects a tampered body, a stale timestamp, the wrong key, and missing pieces', () => {
    expect(verifyTelnyxSignature(body + ' ', sig, ts, rawPub, now)).toBe(false);
    expect(verifyTelnyxSignature(body, sig, ts, rawPub, now + 6 * 60)).toBe(false);
    const other = generateKeyPairSync('ed25519').publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
    expect(verifyTelnyxSignature(body, sig, ts, other, now)).toBe(false);
    expect(verifyTelnyxSignature(body, null, ts, rawPub, now)).toBe(false);
    expect(verifyTelnyxSignature(body, sig, null, rawPub, now)).toBe(false);
    expect(verifyTelnyxSignature(body, sig, ts, null, now)).toBe(false);
    expect(verifyTelnyxSignature(body, sig, ts, 'not base64 of 32 bytes', now)).toBe(false);
  });
});

describe('parseFaxEvent / faxDocumentName', () => {
  it('reads the Telnyx envelope and ignores anything else', () => {
    const ev = parseFaxEvent({ data: { event_type: 'fax.received', id: 'e', payload: { fax_id: 'f', from: '+18165550100' } } });
    expect(ev?.payload.from).toBe('+18165550100');
    expect(parseFaxEvent({})).toBeNull();
    expect(parseFaxEvent({ data: { event_type: 'x', payload: {} } })).toBeNull();
    expect(parseFaxEvent(null)).toBeNull();
  });

  it('names the filed PDF by sender, pages and day', () => {
    const name = faxDocumentName('+18165550100', 4, new Date('2026-09-21T12:00:00Z'));
    expect(name).toMatch(/^Fax from \(816\) 555-0100 — 4 pages — Sep 21, 2026\.pdf$/);
    expect(faxDocumentName(null, 1, new Date('2026-09-21T12:00:00Z'))).toContain('unknown sender — 1 page');
  });
});

describe('createFaxClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is unconfigured on a missing key or the Vercel [SENSITIVE] placeholder', () => {
    expect(createFaxClient({ apiKey: null, appName: 'A', webhookUrl: 'https://a/x' }).configured()).toBe(false);
    expect(createFaxClient({ apiKey: '[SENSITIVE]', appName: 'A', webhookUrl: 'https://a/x' }).configured()).toBe(false);
    expect(createFaxClient({ apiKey: 'KEY', appName: 'A', webhookUrl: 'https://a/x' }).configured()).toBe(true);
  });

  it('finds an existing fax application by exact name and re-points its webhook', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/fax_applications?')) {
        return new Response(JSON.stringify({ data: [
          { id: 'app-other', application_name: 'RealShift Fax (old)', webhook_event_url: 'https://old' },
          { id: 'app-1', application_name: 'RealShift Fax', webhook_event_url: 'https://old' },
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'app-1' } }), { status: 200 });
    }));
    const client = createFaxClient({ apiKey: 'KEY', appName: 'RealShift Fax', webhookUrl: 'https://www.realshiftapp.com/api/webhooks/fax' });
    expect(await client.ensureFaxApplication()).toBe('app-1');
    expect(await client.ensureFaxApplication()).toBe('app-1'); // cached: no second lookup
    const patch = calls.find((c) => c.init?.method === 'PATCH');
    expect(patch?.url).toContain('/fax_applications/app-1');
    expect(JSON.parse(String(patch?.init?.body)).webhook_event_url).toBe('https://www.realshiftapp.com/api/webhooks/fax');
    expect(calls.filter((c) => c.url.includes('/fax_applications?'))).toHaveLength(1);
  });

  it('orders a local number when the area code has one, sending the API key as a bearer', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/available_phone_numbers?')) {
        const local = url.includes('national_destination_code%5D=816');
        return new Response(JSON.stringify({ data: local ? [{ phone_number: '+18165550199' }] : [] }), { status: 200 });
      }
      if (url.endsWith('/number_orders')) return new Response(JSON.stringify({ data: { id: 'order-1', status: 'pending' } }), { status: 200 });
      return new Response(JSON.stringify({ data: {} }), { status: 200 });
    }));
    const client = createFaxClient({ apiKey: 'KEY', appName: 'X', webhookUrl: 'https://x/w', faxAppId: 'app-9' });
    const order = await client.orderFaxNumber('816');
    expect(order).toEqual({ phoneNumber: '+18165550199', orderId: 'order-1', connectionId: 'app-9' });
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer KEY');
  });

  it('surfaces Telnyx error details', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ errors: [{ detail: 'Insufficient funds' }] }), { status: 402 })));
    const client = createFaxClient({ apiKey: 'KEY', appName: 'X', webhookUrl: 'https://x/w', faxAppId: 'app-9' });
    await expect(client.sendFax({ from: '+18165550199', to: '+18165550100', mediaUrl: 'https://x/doc.pdf' }))
      .rejects.toThrow(/Telnyx 402 \/faxes: Insufficient funds/);
  });
});
