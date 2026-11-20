import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export type QuoteClient =
  | { kind: 'shared' }
  | { kind: 'verified'; ip: string }
  | { kind: 'unverified' };

function normalizeClientIp(ip: string): string | null {
  if (ip.includes('%')) return null;
  const family = isIP(ip);
  if (family === 4) return ip;
  if (family !== 6) return null;

  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
  if (!mapped) return canonical;
  const high = Number.parseInt(mapped[1], 16);
  const low = Number.parseInt(mapped[2], 16);
  return [high >>> 8, high & 255, low >>> 8, low & 255].join('.');
}

export function getQuoteClient(headers: Pick<Headers, 'get'>, proxyToken: string | undefined): QuoteClient {
  const secret = proxyToken?.trim();
  if (!secret) return { kind: 'shared' };
  const token = headers.get('x-quote-proxy-token');
  if (secret.length < 32 || !token) return { kind: 'unverified' };
  const expected = Buffer.from(secret);
  const supplied = Buffer.from(token);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return { kind: 'unverified' };

  const header = headers.get('x-quote-client-ip');
  const ip = header ? normalizeClientIp(header.trim()) : null;
  return ip ? { kind: 'verified', ip } : { kind: 'unverified' };
}
