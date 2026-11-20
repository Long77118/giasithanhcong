import assert from 'node:assert/strict';
import test from 'node:test';
import { quoteBodyMaxBytes, readQuoteJson } from './quote-body';
import { getQuoteClient } from './quote-client';

const token = 'fixture-proxy-token-for-unit-tests-only';
const headers = (ip: string) => new Headers({
  'x-quote-proxy-token': token,
  'x-quote-client-ip': ip,
});

test('quote requests without a configured proxy share a quota independent of forwarding headers', () => {
  const forwarded = new Headers({ 'x-forwarded-for': '192.0.2.10', 'x-real-ip': '192.0.2.10' });
  assert.deepEqual(getQuoteClient(forwarded, undefined), { kind: 'shared' });
  assert.deepEqual(getQuoteClient(headers('192.0.2.10'), ''), { kind: 'shared' });
});

test('only authenticated proxy metadata supplies a validated and canonical IP', () => {
  assert.deepEqual(getQuoteClient(headers('192.0.2.10'), token), { kind: 'verified', ip: '192.0.2.10' });
  assert.deepEqual(getQuoteClient(headers('::FFFF:192.0.2.10'), token), { kind: 'verified', ip: '192.0.2.10' });
  assert.deepEqual(getQuoteClient(headers('2001:0DB8:0:0:0:0:0:1'), token), { kind: 'verified', ip: '2001:db8::1' });
  for (const value of ['192.0.2.10, 192.0.2.11', '192.0.2.10:443', '[2001:db8::1]', 'fe80::1%zone', 'not-an-ip', '']) {
    assert.deepEqual(getQuoteClient(headers(value), token), { kind: 'unverified' }, value);
  }
  assert.deepEqual(getQuoteClient(new Headers(), token), { kind: 'unverified' });
  assert.deepEqual(getQuoteClient(headers('192.0.2.10'), token.replace('fixture', 'another')), { kind: 'unverified' });
});

test('quote body accepts UTF-8 JSON at the byte limit, including across split characters', async () => {
  const bytes = new TextEncoder().encode(JSON.stringify({ customerName: 'Đỗ Hồng', message: 'Mẫu bao bì' }));
  const source = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
  assert.deepEqual(await readQuoteJson({ headers: new Headers(), body: source }), {
    status: 200,
    data: { customerName: 'Đỗ Hồng', message: 'Mẫu bao bì' },
  });
  const exact = new Request('http://example.test', {
    method: 'POST', body: '{}' + ' '.repeat(quoteBodyMaxBytes - 2),
  });
  assert.deepEqual(await readQuoteJson(exact), { status: 200, data: {} });
});

test('quote body rejects oversized declarations, oversized streams, and malformed JSON', async () => {
  assert.deepEqual(await readQuoteJson({
    headers: new Headers({ 'content-length': String(quoteBodyMaxBytes + 1) }),
    body: null,
  }), { status: 413 });
  let cancelled = false;
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) { controller.enqueue(new Uint8Array(quoteBodyMaxBytes + 1)); },
    cancel() { cancelled = true; },
  });
  assert.deepEqual(await readQuoteJson({ headers: new Headers(), body }), { status: 413 });
  assert.equal(cancelled, true);
  assert.deepEqual(await readQuoteJson(new Request('http://example.test', { method: 'POST', body: '{' })), { status: 400 });
});
