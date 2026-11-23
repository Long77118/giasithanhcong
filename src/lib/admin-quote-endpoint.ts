import { sql } from '@payloadcms/db-postgres';
import { commitTransaction, initTransaction, killTransaction, type Endpoint } from 'payload';
import { isAdminUser } from '@/collections/access';
import { getWriteTransaction } from './db-transaction';
import { nextQuoteStage } from './admin-quotes';

export const advanceQuoteStatus: Endpoint = {
  path: '/:id/advance-status',
  method: 'post',
  handler: async (req) => {
    if (!isAdminUser(req.user)) return Response.json({}, { status: 403 });

    const rawId = req.routeParams?.id;
    const id = typeof rawId === 'string' && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : 0;
    if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) return Response.json({}, { status: 400 });

    const body: unknown = await req.json?.().catch(() => null);
    const expected = body && typeof body === 'object' && 'status' in body ? body.status : undefined;
    const next = nextQuoteStage(expected);
    if (!next) return Response.json({}, { status: 400 });

    try {
      if (!await initTransaction(req)) throw new Error('Quote updates require a transaction.');
      const db = await getWriteTransaction(req);
      // Serialize quick actions and compare after locking so stale tabs cannot undo a later step.
      await db.execute(sql`SELECT id FROM quote_requests WHERE id = ${id} FOR UPDATE`);
      const options = { collection: 'quote-requests', id, req, depth: 0, overrideAccess: false } as const;
      const quote = await req.payload.findByID({ ...options, disableErrors: true, select: { status: true } });
      if (!quote || quote.status !== expected) {
        await killTransaction(req);
        return Response.json({}, { status: quote ? 409 : 404 });
      }
      await req.payload.update({ ...options, overrideLock: false, data: { status: next.value } });
      await commitTransaction(req);
      return Response.json({ status: next.value });
    } catch (error) {
      await killTransaction(req);
      if (error && typeof error === 'object' && 'status' in error && error.status === 423) {
        return Response.json({}, { status: 423 });
      }
      req.payload.logger.error({ err: error }, 'Could not advance quote status');
      return Response.json({}, { status: 500 });
    }
  },
};
