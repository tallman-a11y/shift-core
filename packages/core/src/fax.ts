// Shift family fax — Telnyx Programmable Fax behind one thin client.
//
// Banks, housing authorities, title companies and public-assistance offices
// still fax. LendShift built this first (a fax number per lender, inbound PDFs
// filed into the document vault); RealShift and AgentShift need the same thing
// with different filing rules. The Telnyx half — number search and order, the
// fax application every number routes to, outbound sends, and the Ed25519
// webhook check — is identical for every product, so it lives here once. Each
// product supplies only its name, its webhook URL and where a PDF gets filed.
//
// Why Telnyx: Twilio retired Programmable Fax in 2021; Telnyx sells fax-capable
// local numbers (~$1/mo) with an API for search, order, inbound webhooks and
// outbound sends, and signs every webhook with Ed25519 so a product can trust
// what lands at its endpoint.
//
// Env each product sets (Vercel, or a family-wide shared variable):
//   TELNYX_API_KEY     — API v2 key (Mission Control → Keys & Credentials)
//   TELNYX_PUBLIC_KEY  — account public key (same page) for webhook signatures
//   TELNYX_FAX_APP_ID  — optional; otherwise the app named in the config is
//                        found or created on first use

import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { realSecret } from './voice.js';

const API = 'https://api.telnyx.com/v2';

export interface FaxClientConfig {
  /** Telnyx API v2 key. Defaults to process.env.TELNYX_API_KEY. */
  apiKey?: string | null;
  /** Account public key for webhook signatures. Defaults to process.env.TELNYX_PUBLIC_KEY. */
  publicKey?: string | null;
  /** The Telnyx fax application this product's numbers route to, e.g. "RealShift Fax". */
  appName: string;
  /** Where Telnyx posts events for this product, e.g. https://www.realshiftapp.com/api/webhooks/fax */
  webhookUrl: string;
  /** Pin the fax application instead of finding it by name. Defaults to process.env.TELNYX_FAX_APP_ID. */
  faxAppId?: string | null;
}

export interface FaxNumberOrder {
  phoneNumber: string;
  orderId: string;
  connectionId: string;
}

export interface TelnyxFaxEvent {
  event_type: string;
  id: string;
  occurred_at?: string;
  payload: {
    fax_id: string;
    direction?: string;
    from?: string;
    to?: string;
    page_count?: number;
    media_url?: string;
    status?: string;
    failure_reason?: string;
    connection_id?: string;
    partial_content?: boolean;
  };
}

export interface FaxClient {
  /** True when an API key is present (a Vercel "[SENSITIVE]" placeholder does not count). */
  configured(): boolean;
  /** The fax application inbound numbers point at — found by name or created, once. */
  ensureFaxApplication(): Promise<string>;
  /** Search + order one fax-capable US number, local to the area code when possible. */
  orderFaxNumber(areaCode: string | null): Promise<FaxNumberOrder>;
  /** Outbound fax of a fetchable (signed) PDF URL. Resolves to the Telnyx fax id. */
  sendFax(params: { from: string; to: string; mediaUrl: string; connectionId?: string | null }): Promise<string>;
  /** Verify a webhook's Ed25519 signature against this product's public key. */
  verifyWebhook(rawBody: string, signatureB64: string | null, timestamp: string | null): boolean;
}

export function createFaxClient(config: FaxClientConfig): FaxClient {
  // `?? undefined` folds an explicit null into "not provided" for realSecret.
  const apiKey = () => realSecret(config.apiKey ?? process.env.TELNYX_API_KEY ?? undefined);
  const publicKey = () => realSecret(config.publicKey ?? process.env.TELNYX_PUBLIC_KEY ?? undefined);
  const pinnedAppId = () => realSecret(config.faxAppId ?? process.env.TELNYX_FAX_APP_ID ?? undefined);
  let cachedAppId: string | null = null;

  async function telnyx<T>(path: string, init: RequestInit = {}): Promise<T> {
    const key = apiKey();
    if (!key) throw new Error('TELNYX_API_KEY not configured');
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error body */ }
    if (!res.ok) {
      const errors = (json as { errors?: { detail?: string; title?: string }[] } | null)?.errors;
      const detail = errors?.map((e) => e.detail ?? e.title).join('; ') || text.slice(0, 200);
      throw new Error(`Telnyx ${res.status} ${path}: ${detail}`);
    }
    return json as T;
  }

  async function ensureFaxApplication(): Promise<string> {
    const pinned = pinnedAppId();
    if (pinned) return pinned;
    if (cachedAppId) return cachedAppId;
    const list = await telnyx<{ data: { id: string; application_name: string; webhook_event_url?: string }[] }>(
      `/fax_applications?filter[application_name][contains]=${encodeURIComponent(config.appName)}&page[size]=20`,
    );
    const existing = list.data?.find((a) => a.application_name === config.appName);
    if (existing) {
      // Keep the webhook pointed at this product if its domain ever changes.
      if (existing.webhook_event_url !== config.webhookUrl) {
        await telnyx(`/fax_applications/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ webhook_event_url: config.webhookUrl }),
        }).catch(() => {});
      }
      cachedAppId = existing.id;
      return existing.id;
    }
    const created = await telnyx<{ data: { id: string } }>('/fax_applications', {
      method: 'POST',
      body: JSON.stringify({ application_name: config.appName, webhook_event_url: config.webhookUrl, active: true }),
    });
    cachedAppId = created.data.id;
    return created.data.id;
  }

  async function orderFaxNumber(areaCode: string | null): Promise<FaxNumberOrder> {
    const connectionId = await ensureFaxApplication();
    const search = async (npa: string | null) => {
      const q = new URLSearchParams({
        'filter[country_code]': 'US',
        'filter[features][]': 'fax',
        'filter[limit]': '5',
        'filter[phone_number_type]': 'local',
      });
      if (npa) q.set('filter[national_destination_code]', npa);
      const r = await telnyx<{ data: { phone_number: string }[] }>(`/available_phone_numbers?${q.toString()}`);
      return r.data ?? [];
    };
    let candidates = areaCode ? await search(areaCode) : [];
    if (candidates.length === 0) candidates = await search(null);
    if (candidates.length === 0) throw new Error('No fax-capable numbers available right now — try again in a minute.');
    const phoneNumber = candidates[0].phone_number;
    const order = await telnyx<{ data: { id: string; status: string } }>('/number_orders', {
      method: 'POST',
      body: JSON.stringify({ phone_numbers: [{ phone_number: phoneNumber }], connection_id: connectionId }),
    });
    // Belt and braces: make sure the number routes to the fax application.
    await telnyx(`/phone_numbers/${encodeURIComponent(phoneNumber)}`, {
      method: 'PATCH',
      body: JSON.stringify({ connection_id: connectionId }),
    }).catch(() => {});
    return { phoneNumber, orderId: order.data.id, connectionId };
  }

  async function sendFax(params: { from: string; to: string; mediaUrl: string; connectionId?: string | null }): Promise<string> {
    const connectionId = params.connectionId ?? (await ensureFaxApplication());
    const r = await telnyx<{ data: { id: string } }>('/faxes', {
      method: 'POST',
      body: JSON.stringify({ connection_id: connectionId, media_url: params.mediaUrl, to: params.to, from: params.from }),
    });
    return r.data.id;
  }

  return {
    configured: () => Boolean(apiKey()),
    ensureFaxApplication,
    orderFaxNumber,
    sendFax,
    verifyWebhook: (rawBody, signatureB64, timestamp) =>
      verifyTelnyxSignature(rawBody, signatureB64, timestamp, publicKey()),
  };
}

// ── Phone helpers ───────────────────────────────────────────────────────────

/** Digits only; US 10-digit → +1XXXXXXXXXX. */
export function toE164(phone: string | null | undefined): string | null {
  const d = (phone ?? '').replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  if (d.length > 11 && (phone ?? '').trim().startsWith('+')) return `+${d}`;
  return null;
}

/** Last ten digits — how a fax sender is matched to a contact's phone. */
export function last10(phone: string | null | undefined): string {
  const d = (phone ?? '').replace(/\D/g, '');
  return d.slice(-10);
}

/** Area code from a US number, for "give me a local fax number". */
export function areaCodeOf(phone: string | null | undefined): string | null {
  const e = toE164(phone);
  return e && e.length === 12 ? e.slice(2, 5) : null;
}

export function formatUS(e164: string): string {
  const d = e164.replace(/\D/g, '');
  return d.length === 11 ? `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}` : e164;
}

// ── Webhook signature (Ed25519 over `${timestamp}|${rawBody}`) ──────────────

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/** Fails closed: no key, no signature, a stale timestamp or a bad signature all return false. */
export function verifyTelnyxSignature(
  rawBody: string,
  signatureB64: string | null,
  timestamp: string | null,
  publicKeyB64: string | null | undefined,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  if (!signatureB64 || !timestamp || !publicKeyB64) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > 5 * 60) return false; // replay window
  try {
    const raw = Buffer.from(publicKeyB64, 'base64');
    if (raw.length !== 32) return false;
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' });
    const sig = Buffer.from(signatureB64, 'base64');
    if (sig.length !== 64) return false;
    return cryptoVerify(null, Buffer.from(`${timestamp}|${rawBody}`), key, sig);
  } catch {
    return false;
  }
}

export function parseFaxEvent(body: unknown): TelnyxFaxEvent | null {
  const data = (body as { data?: TelnyxFaxEvent } | null)?.data;
  if (!data || typeof data.event_type !== 'string' || !data.payload?.fax_id) return null;
  return data;
}

/** "Fax from (816) 555-0100 — 4 pages — Sep 21, 2026.pdf" */
export function faxDocumentName(from: string | null | undefined, pages: number | null | undefined, at: Date = new Date()): string {
  const who = from ? formatUS(from) : 'unknown sender';
  const pg = pages ? ` — ${pages} page${pages === 1 ? '' : 's'}` : '';
  const day = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Fax from ${who}${pg} — ${day}.pdf`;
}
