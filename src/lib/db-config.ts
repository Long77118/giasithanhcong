import type { PoolConfig } from 'pg';
import { Socket } from 'node:net';

export interface PostgresPoolOptions {
  useAdminCredentials?: boolean;
  hyperdrive?: { host: string; port: number; user: string; password: string; database: string };
}

/**
 * Builds node-postgres Pool configuration strictly via the Object Method
 * using platform-provided SQL_* environment variables (Cloud SQL Auth Proxy
 * Unix domain socket or host). Never uses DATABASE_URL strings.
 */
export function getPostgresPoolConfig(options: PostgresPoolOptions = {}): PoolConfig {
  if (options.hyperdrive) {
    return {
      ...options.hyperdrive,
      // Workers implements node:net. Avoid pg-cloudflare's close/read race on disposal.
      stream: () => new Socket(),
      max: 4,
      // Do not reuse a TCP client across Workers request contexts. Hyperdrive pools upstream.
      maxUses: 1,
      connectionTimeoutMillis: 15000,
    };
  }
  if (process.env.CLOUDFLARE_BUILD === 'true') {
    // All database-backed routes are dynamic; a build must not need live credentials.
    return { host: '127.0.0.1', database: 'build_only', user: 'build_only', password: 'build_only' };
  }
  const useAdmin =
    options.useAdminCredentials ?? process.env.PAYLOAD_MIGRATING === 'true';

  const host = process.env.SQL_HOST;
  const database = process.env.SQL_DB_NAME;
  const user = useAdmin ? process.env.SQL_ADMIN_USER : process.env.SQL_USER;
  const password = useAdmin
    ? process.env.SQL_ADMIN_PASSWORD
    : process.env.SQL_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error(
      'Missing PostgreSQL SQL_* environment variables (SQL_HOST, SQL_DB_NAME, SQL_USER/SQL_ADMIN_USER, SQL_PASSWORD/SQL_ADMIN_PASSWORD).',
    );
  }

  return {
    host,
    port: Number(process.env.SQL_PORT || 5432),
    database,
    user,
    password,
    ...(process.env.SQL_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}
