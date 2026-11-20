import type { R2StorageOptions } from '@payloadcms/storage-r2';
import type { PayloadLogger } from 'payload';
import { isCloudflareRuntime } from './deployment';

export interface CloudflareBindings {
  HYPERDRIVE: { host: string; port: number; user: string; password: string; database: string };
  MEDIA_BUCKET: R2StorageOptions['bucket'];
  DEPLOYMENT_STAGE?: string;
  PAYLOAD_SECRET?: string;
  QUOTE_TRUSTED_PROXY_TOKEN?: string;
}

export async function getRuntimeBindings(): Promise<CloudflareBindings | null> {
  if (!isCloudflareRuntime()) return null;
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const { env } = await getCloudflareContext({ async: true });
  const bindings = env as unknown as CloudflareBindings;
  if (!bindings.HYPERDRIVE || !bindings.MEDIA_BUCKET) {
    throw new Error('Workers requires the HYPERDRIVE and MEDIA_BUCKET bindings.');
  }
  if (!bindings.PAYLOAD_SECRET || bindings.PAYLOAD_SECRET.length < 32 ||
      !bindings.QUOTE_TRUSTED_PROXY_TOKEN || bindings.QUOTE_TRUSTED_PROXY_TOKEN.length < 32) {
    throw new Error('Set PAYLOAD_SECRET and QUOTE_TRUSTED_PROXY_TOKEN as Worker secrets (at least 32 characters each).');
  }
  return bindings;
}

// Workers has no writable log destination. Match Payload's console logger template.
export function createWorkersLogger(): PayloadLogger {
  const log = (value: unknown, message?: string) => console.log(message ?? '', value);
  return {
    level: 'info', trace: log, debug: log, info: log, warn: log, error: log,
    fatal: log, silent: () => {},
  } as unknown as PayloadLogger;
}
