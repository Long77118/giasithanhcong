import assert from 'node:assert/strict';
import { WorkerPostgresPool } from '../src/lib/worker-postgres';
import { getPostgresPoolConfig } from '../src/lib/db-config';

assert.equal(process.env.CI, 'true');
assert.equal(process.env.SQL_DB_NAME, 'ci_only');
const pool = new WorkerPostgresPool(getPostgresPoolConfig({ hyperdrive: {
  host: '127.0.0.1', port: 5432, user: 'ci_only', password: 'ci_only', database: 'ci_only',
} }));
const clients = await Promise.all(Array.from({ length: 8 }, () => pool.connect()));
const ids = await Promise.all(clients.map(async client => (await client.query('select pg_backend_pid() as id')).rows[0].id));
assert.equal(new Set(ids).size, clients.length);
clients.forEach(client => client.release());
// A failed operation must not poison the next operation in the cached adapter.
await assert.rejects(pool.query('select * from ci_missing_table'));
assert.equal((await pool.query('select 42 as answer')).rows[0].answer, 42);
const transaction = await pool.connect();
await transaction.query('begin');
await transaction.query('create table ci_rollback_check (id integer)');
await transaction.query('rollback');
transaction.release();
assert.equal((await pool.query("select to_regclass('ci_rollback_check') as relation")).rows[0].relation, null);
await new Promise<void>((resolve, reject) => pool.connect((error, client, release) => {
  if (error || !client) return reject(error);
  void client.query('select 1').then(() => { release(); resolve(); }, reject);
}));
await pool.end();
console.log('PASS: isolated PostgreSQL operations, concurrency, callbacks, transaction rollback and recovery after query error.');
