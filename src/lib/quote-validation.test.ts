import assert from 'node:assert/strict';
import test from 'node:test';
import { quoteRequestSchema, resolveQuoteSourceUrl } from './quote-validation';

test('quote source uses the server-resolved product slug on the contact page', () => {
  assert.equal(resolveQuoteSourceUrl('/lien-he', 'ly-pet-500ml'), '/lien-he?sanpham=ly-pet-500ml');
  assert.equal(resolveQuoteSourceUrl('/lien-he'), '/lien-he');
  assert.equal(resolveQuoteSourceUrl('/lien-he', 'ly-pet&token=secret'), '/lien-he');
});

test('quote source preserves the about page and only accepts a product page matching the verified product', () => {
  assert.equal(resolveQuoteSourceUrl('/gioi-thieu'), '/gioi-thieu');
  assert.equal(resolveQuoteSourceUrl('/san-pham/ly-pet-500ml', 'ly-pet-500ml'), '/san-pham/ly-pet-500ml');
  assert.equal(resolveQuoteSourceUrl('/san-pham/ly-pet-500ml'), undefined);
  assert.equal(resolveQuoteSourceUrl('/san-pham/ly-pet-500ml', 'ly-giay'), undefined);
});

test('quote source discards arbitrary paths, absolute URLs, queries and fragments', () => {
  for (const source of [undefined, null, '', '/admin', '//example.test/lien-he', 'https://example.test/lien-he',
    '/lien-he?email=example%40example.test', '/lien-he#bao-gia', '/lien-he\n', '/san-pham/ly-pet-500ml?token=secret']) {
    assert.equal(resolveQuoteSourceUrl(source, 'ly-pet-500ml'), undefined);
  }
});

test('quote source input keeps the string validation and 300-character limit', () => {
  const source = quoteRequestSchema.shape.sourceUrl;
  assert.equal(source.parse(' /lien-he '), '/lien-he');
  assert.equal(source.safeParse('a'.repeat(300)).success, true);
  assert.equal(source.safeParse('a'.repeat(301)).success, false);
  assert.equal(source.safeParse(12).success, false);
});
