import pg, { type PoolClient, type PoolConfig } from 'pg';
import { postgresAdapter, type PostgresAdapterArgs } from '@payloadcms/db-postgres';

type ConnectCallback = (error: Error | undefined, client: PoolClient | undefined, release: (error?: Error | boolean) => void) => void;

/**
 * Payload caches its adapter globally. A Workers isolate may be reused by unrelated
 * requests, but its sockets and pending pool promises must not be shared between them.
 * Each operation owns a short-lived pool; transactions retain their client until release.
 * Hyperdrive handles the expensive upstream connection pooling.
 * See https://github.com/payloadcms/payload/issues/17335
 */
export class WorkerPostgresPool extends pg.Pool {
  private readonly operationOptions: PoolConfig;

  constructor(options: PoolConfig) {
    super(options);
    this.operationOptions = { ...options, max: 1, maxUses: 1 };
  }

  override connect(): Promise<PoolClient>;
  override connect(callback: ConnectCallback): void;
  override connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const pool = new pg.Pool(this.operationOptions);
    // Query/connect errors are delivered to the caller. Idle disposal errors must
    // have a listener as well, without logging connection objects or credentials.
    pool.on('error', (error: Error) => console.error('PostgreSQL disposal:', error.message));
    const result = pool.connect().then((client) => {
      const release = client.release.bind(client);
      client.release = (error?: Error | boolean) => {
        try { release(error); }
        finally { void pool.end().catch((endError: Error) => console.error('PostgreSQL cleanup:', endError.message)); }
      };
      return client;
    }, async (error: unknown) => {
      await pool.end();
      throw error;
    });
    if (callback) {
      void result.then(
        (client) => callback(undefined, client, client.release),
        (error: Error) => callback(error, undefined, () => {}),
      );
      return;
    }
    return result;
  }
}

export function createPostgresAdapter(args: PostgresAdapterArgs, workers: boolean) {
  const adapter = postgresAdapter(args);
  if (!workers) return adapter;
  const initialize = adapter.init;
  return {
    ...adapter,
    init: (options: Parameters<typeof initialize>[0]) => {
      const database = initialize(options);
      // Supplying a pool also avoids the adapter's unreleased startup probe client.
      database.pool = new WorkerPostgresPool(args.pool);
      return database;
    },
  };
}
