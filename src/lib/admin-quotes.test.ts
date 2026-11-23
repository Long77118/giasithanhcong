import assert from 'node:assert/strict';
import test from 'node:test';
import { isWaitingQuote, nextQuoteStage, quotePhoneLinks, quoteReceivedTime } from './admin-quotes';

test('quote quick actions only advance to the next workflow stage', () => {
  assert.equal(nextQuoteStage('new')?.value, 'contacted');
  assert.equal(nextQuoteStage('contacted')?.value, 'quoted');
  assert.equal(nextQuoteStage('quoted')?.value, 'closed');
  assert.equal(nextQuoteStage('closed'), undefined);
  assert.equal(nextQuoteStage('unknown'), undefined);
});

test('only new quotes strictly older than 24 hours count as waiting', () => {
  const now = Date.parse('2026-11-23T09:00:00Z');
  assert.equal(isWaitingQuote('new', '2026-11-22T09:00:00Z', now), false);
  assert.equal(isWaitingQuote('new', '2026-11-22T08:59:59Z', now), true);
  assert.equal(isWaitingQuote('contacted', '2026-11-22T08:59:59Z', now), false);
});

test('quote phone links accept familiar separators and international format, and omit Zalo for landlines', () => {
  const mobile = { tel: 'tel:+84901234567', zalo: 'https://zalo.me/0901234567' };
  assert.deepEqual(quotePhoneLinks('0901 234 567'), mobile);
  assert.deepEqual(quotePhoneLinks('+84 (901) 234-567'), mobile);
  assert.deepEqual(quotePhoneLinks('028 1234 5678'), { tel: 'tel:+842812345678', zalo: null });
  for (const phone of ['0901234567 ext 12', '849012', '0901234567;123', '901234567', '+84 0901234567']) {
    assert.equal(quotePhoneLinks(phone), null);
  }
});

test('quote time contains both Vietnamese relative text and the full local time', () => {
  const time = quoteReceivedTime('2026-11-23T07:00:00Z', Date.parse('2026-11-23T09:00:00Z'));
  assert.equal(time?.value, '2 giờ trước');
  assert.match(time?.exact ?? '', /14:00:00.*giờ Việt Nam/);
  assert.equal(quoteReceivedTime('invalid', 0), null);
});
