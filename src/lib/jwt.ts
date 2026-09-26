// JWT decoding and HMAC verification with no runtime dependencies.
// Everything runs in the browser — tokens never leave the page.

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

/** Why a token couldn't be decoded; the UI words it in the current language. */
export type JwtErrorCode = 'empty' | 'parts' | 'base64' | 'notObject' | 'notJson';

export class JwtError extends Error {
  constructor(
    readonly code: JwtErrorCode,
    /** Which segment failed, or how many parts the token had (for `parts`). */
    readonly detail: { part?: 'header' | 'payload'; count?: number } = {},
  ) {
    super(code);
  }
}

/** Decode a base64url string into UTF-8 text. */
export function base64UrlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);

  let binary: string;
  try {
    binary = atob(s);
  } catch {
    throw new JwtError('base64');
  }

  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function parseSegment(segment: string, part: 'header' | 'payload'): Record<string, unknown> {
  let text: string;
  try {
    text = base64UrlDecode(segment);
  } catch (e) {
    if (e instanceof JwtError) throw new JwtError(e.code, { part });
    throw e;
  }
  try {
    const json = JSON.parse(text);
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
      throw new JwtError('notObject', { part });
    }
    return json as Record<string, unknown>;
  } catch (e) {
    if (e instanceof JwtError) throw e;
    throw new JwtError('notJson', { part });
  }
}

/** Decode a compact JWS (`header.payload.signature`). */
export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim();
  if (!trimmed) throw new JwtError('empty');

  const parts = trimmed.split('.');
  if (parts.length !== 3) throw new JwtError('parts', { count: parts.length });

  const [h, p, signature] = parts;
  return {
    header: parseSegment(h, 'header'),
    payload: parseSegment(p, 'payload'),
    signature,
    raw: { header: h, payload: p, signature },
  };
}

/** Registered claims that carry a NumericDate value (seconds since epoch). */
export const TIME_CLAIMS = ['exp', 'iat', 'nbf'] as const;
export type TimeClaim = (typeof TIME_CLAIMS)[number];

/** Registered claims shown in the claims table, in display order. */
export const REGISTERED_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'] as const;
export type RegisteredClaim = (typeof REGISTERED_CLAIMS)[number];

export interface TimeClaimInfo {
  claim: TimeClaim;
  date: Date;
  iso: string;
  relative: string;
}

export function formatTimeClaim(claim: TimeClaim, value: unknown, locale?: string): TimeClaimInfo | null {
  if (typeof value !== 'number') return null;
  const date = new Date(value * 1000);
  return {
    claim,
    date,
    iso: date.toISOString(),
    relative: relativeTime(date, locale),
  };
}

/** Human-friendly "in 5 minutes" / "3 days ago", in the given locale. */
export function relativeTime(date: Date, locale?: string, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, 'second');
}

export type ExpiryState = 'valid' | 'expired' | 'not-yet-valid' | 'unknown';

export function expiryState(payload: Record<string, unknown>, now: Date = new Date()): ExpiryState {
  const nowSec = now.getTime() / 1000;
  const exp = payload.exp;
  const nbf = payload.nbf;
  if (typeof nbf === 'number' && nowSec < nbf) return 'not-yet-valid';
  if (typeof exp === 'number') return nowSec >= exp ? 'expired' : 'valid';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// HMAC signature verification via the Web Crypto API. Stays in the browser.
// ---------------------------------------------------------------------------

const HMAC_HASH: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

export function isHmacAlg(alg: unknown): alg is keyof typeof HMAC_HASH {
  return typeof alg === 'string' && alg in HMAC_HASH;
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** `malformed`: not a 3-part token or not an HMAC alg; `error`: Web Crypto failed (message from the browser). */
export type VerifyResult =
  | { status: 'valid' }
  | { status: 'invalid' }
  | { status: 'malformed' }
  | { status: 'error'; message?: string };

/** Verify an HS256/384/512 signature against a shared secret. */
export async function verifyHmac(
  token: string,
  secret: string,
  alg: string,
): Promise<VerifyResult> {
  const parts = token.trim().split('.');
  if (!isHmacAlg(alg) || parts.length !== 3) return { status: 'malformed' };
  const [header, payload, signature] = parts;
  const signingInput = `${header}.${payload}`;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: HMAC_HASH[alg] },
      false,
      ['sign'],
    );
    const computed = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
    return base64UrlEncode(computed) === signature
      ? { status: 'valid' }
      : { status: 'invalid' };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : undefined };
  }
}
