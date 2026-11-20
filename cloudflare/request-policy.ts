export interface WorkerPolicyEnv {
  DEPLOYMENT_STAGE?: string;
  QUOTE_TRUSTED_PROXY_TOKEN?: string;
}

export function prepareWorkerRequest(request: Request, env: WorkerPolicyEnv): Request {
  const headers = new Headers(request.headers);
  // Always overwrite client-supplied proxy credentials at the trusted Worker boundary.
  headers.delete('x-quote-client-ip');
  headers.delete('x-quote-proxy-token');
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip && env.QUOTE_TRUSTED_PROXY_TOKEN?.length && env.QUOTE_TRUSTED_PROXY_TOKEN.length >= 32) {
    headers.set('x-quote-client-ip', ip);
    headers.set('x-quote-proxy-token', env.QUOTE_TRUSTED_PROXY_TOKEN);
  }
  return new Request(request, { headers });
}

export function applyWorkerHeaders(response: Response, env: WorkerPolicyEnv): Response {
  if (env.DEPLOYMENT_STAGE === 'production') return response;
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers,
  });
}
