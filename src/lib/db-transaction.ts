import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';

export function getSqlExecutor(db: unknown): Pick<PostgresAdapter['drizzle'], 'execute'> {
  if (!db || typeof db !== 'object' || !('execute' in db) || typeof db.execute !== 'function') {
    throw new Error('An active PostgreSQL connection is required.');
  }
  return db as Pick<PostgresAdapter['drizzle'], 'execute'>;
}

export async function getWriteTransaction(req: PayloadRequest) {
  const id = await req.transactionID;
  return getSqlExecutor(id == null ? undefined : req.payload.db.sessions?.[id]?.db);
}
