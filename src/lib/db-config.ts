import type { PoolConfig } from 'pg';

export interface PostgresPoolOptions {
  useAdminCredentials?: boolean;
}

/**
 * Builds node-postgres Pool configuration strictly via the Object Method
 * using platform-provided SQL_* environment variables (Cloud SQL Auth Proxy
 * Unix domain socket or host). Never uses DATABASE_URL strings.
 */
export function getPostgresPoolConfig(options: PostgresPoolOptions = {}): PoolConfig {
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
    database,
    user,
    password,
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}
