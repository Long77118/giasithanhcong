import { createHmac } from 'node:crypto';
import { sql } from '@payloadcms/db-postgres';
import type { QuoteClient } from './quote-client';
import type { getSqlExecutor } from './db-transaction';
import { isCloudflareTarget } from './deployment';

type SqlExecutor = ReturnType<typeof getSqlExecutor>;
const windowSeconds = 10 * 60;
const cleanupIntervalMs = 60_000;

declare global {
  var _quoteRateLimitCleanupTimer: ReturnType<typeof setInterval> | undefined;
}

async function cleanupExpired(db: SqlExecutor) {
  await db.execute(sql`
      WITH expired AS (
        SELECT bucket FROM public.quote_rate_limits
        WHERE expires_at <= statement_timestamp()
        ORDER BY expires_at
        LIMIT 5000
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM public.quote_rate_limits AS quota
      USING expired
      WHERE quota.bucket = expired.bucket
  `).catch(() => console.error('Unable to clean expired quote rate limits.'));
}

function ensureCleanupTimer(db: SqlExecutor) {
  if (globalThis._quoteRateLimitCleanupTimer) return;
  const cleanup = () => { void cleanupExpired(db); };
  cleanup();
  globalThis._quoteRateLimitCleanupTimer = setInterval(cleanup, cleanupIntervalMs);
  globalThis._quoteRateLimitCleanupTimer.unref();
}

export async function consumeQuoteSubmission(
  db: SqlExecutor,
  client: Exclude<QuoteClient, { kind: 'unverified' }>,
  secret: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  // Workers cannot keep a Node interval alive between requests.
  if (isCloudflareTarget()) await cleanupExpired(db);
  else ensureCleanupTimer(db);
  const key = client.kind === 'verified'
    ? 'ip:' + createHmac('sha256', secret).update(client.ip).digest('hex')
    : 'shared';
  const limit = client.kind === 'verified' ? 5 : 60;
  const interval = sql`make_interval(secs => ${windowSeconds})`;

  // PostgreSQL locks the conflicting row, so quotas are shared across instances.
  const accepted = await db.execute(sql`
    INSERT INTO public.quote_rate_limits AS quota (bucket, hits, expires_at)
    VALUES (${key}, ARRAY[statement_timestamp()], statement_timestamp() + ${interval})
    ON CONFLICT (bucket) DO UPDATE
    SET hits = ARRAY(
          SELECT hit FROM unnest(quota.hits || EXCLUDED.hits) AS hit
          WHERE hit > statement_timestamp() - ${interval}
          ORDER BY hit
        ),
        expires_at = GREATEST(quota.expires_at, EXCLUDED.expires_at)
    WHERE (
      SELECT count(*) FROM unnest(quota.hits) AS hit
      WHERE hit > statement_timestamp() - ${interval}
    ) < ${limit}
    RETURNING bucket
  `);
  if (accepted.rows.length) return { allowed: true };

  const { rows: [current] } = await db.execute<{ retry_after: number }>(sql`
    SELECT GREATEST(1, ceil(EXTRACT(EPOCH FROM
      (hits[1] + ${interval} - statement_timestamp())
    )))::integer AS retry_after
    FROM public.quote_rate_limits WHERE bucket = ${key}
  `);
  return { allowed: false, retryAfterSeconds: current?.retry_after ?? 1 };
}
