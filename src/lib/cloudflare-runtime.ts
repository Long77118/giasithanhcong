import type { R2Bucket } from '@cloudflare/workers-types';
import type { PayloadLogger } from 'payload';
import { isCloudflareRuntime } from './deployment';

export interface CloudflareBindings {
  HYPERDRIVE: { host: string; port: number; user: string; password: string; database: string };
  MEDIA_BUCKET: R2Bucket;
  DEPLOYMENT_STAGE?: string;
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
