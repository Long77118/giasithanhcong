import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareWorkerRequest, applyWorkerHeaders } from '../../cloudflare/request-policy';
import { getQuoteClient } from './quote-client';
import { getPostgresPoolConfig } from './db-config';
import { isIndexingAllowed } from './seo';

test('Worker overwrites spoofed proxy credentials using Cloudflare client IP', () => {
  const secret = 'test-only-token-'.repeat(4);
  const request = new Request('https://trial.workers.dev/api/bao-gia', { headers: {
    'CF-Connecting-IP': '203.0.113.5', 'x-quote-client-ip': '192.0.2.99', 'x-quote-proxy-token': 'forged',
  } });
  const prepared = prepareWorkerRequest(request, { QUOTE_TRUSTED_PROXY_TOKEN: secret });
  assert.deepEqual(getQuoteClient(prepared.headers, secret), { kind: 'verified', ip: '203.0.113.5' });
  const missingIp = prepareWorkerRequest(new Request('https://trial.workers.dev', { headers: {
    'x-quote-client-ip': '192.0.2.99', 'x-quote-proxy-token': secret,
  } }), { QUOTE_TRUSTED_PROXY_TOKEN: secret });
  assert.deepEqual(getQuoteClient(missingIp.headers, secret), { kind: 'unverified' });
});

test('Trial response remains noindex and preserves authentication cookies and redirects', async () => {
  const original = new Response('redirect', { status: 302, headers: { Location: '/admin', 'Set-Cookie': 'session=example; Secure; HttpOnly' } });
  const response = applyWorkerHeaders(original, {});
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), '/admin');
  assert.equal(response.headers.get('Set-Cookie'), 'session=example; Secure; HttpOnly');
  assert.equal(await response.text(), 'redirect');
  assert.equal(isIndexingAllowed({ APP_URL: 'https://shop.workers.dev', ALLOW_INDEXING: 'true' }), false);
  assert.equal(isIndexingAllowed({ APP_URL: 'https://trial.example.com', ALLOW_INDEXING: 'true', DEPLOYMENT_STAGE: 'staging' }), false);
});

test('Hyperdrive does not retain TCP clients across requests', () => {
  const connection = { host: 'hyperdrive.local', port: 5432, user: 'app', password: 'test-only', database: 'trial' };
  const config = getPostgresPoolConfig({ hyperdrive: connection });
  assert.equal(config.host, connection.host);
  assert.equal(config.maxUses, 1);
  assert.equal(config.ssl, undefined);
});
