// @ts-ignore OpenNext generates this module before Wrangler bundles the entry point.
import handler from '../.open-next/worker.js';
import type { CloudflareBindings } from '../src/lib/cloudflare-runtime';
import { applyWorkerHeaders, prepareWorkerRequest } from './request-policy';

export default {
  async fetch(request: Request, env: CloudflareBindings, ctx: unknown) {
    const response = await handler.fetch(prepareWorkerRequest(request, env), env, ctx);
    return applyWorkerHeaders(response, env);
  },
};
