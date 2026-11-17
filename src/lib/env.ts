import crypto from 'node:crypto';

declare global {
  var _ephemeralPayloadSecret: string | undefined;
}

/**
 * Resolves PAYLOAD_SECRET from environment without embedding secrets in code.
 * In production runtime, PAYLOAD_SECRET must be provided. During build/dev when
 * unset, generates a process-local random secret so builds/audit scripts do not
 * depend on hardcoded literals.
 */
export function getPayloadSecret(): string {
  const configured = process.env.PAYLOAD_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    process.env.ALLOW_EPHEMERAL_SECRET !== 'true'
  ) {
    throw new Error(
      'Missing PAYLOAD_SECRET environment variable. Configure PAYLOAD_SECRET (>= 32 chars) before starting in production.',
    );
  }

  if (!global._ephemeralPayloadSecret) {
    global._ephemeralPayloadSecret = crypto.randomBytes(32).toString('hex');
  }

  return global._ephemeralPayloadSecret;
}
