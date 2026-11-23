import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeContactMapEmbedUrl } from './contact-map';

test('contact map accepts official URL or copied embed HTML, and drops all HTML/extra parameters', () => {
  const url = 'https://www.google.com/maps/embed?pb=!1m18!2m3!1d123';
  const result = normalizeContactMapEmbedUrl(`<iframe src="${url}&amp;extra=ignored" width="600" onload="bad()"></iframe>`);
  assert.ok(result);
  assert.equal(new URL(result).origin, 'https://www.google.com');
  assert.equal(new URL(result).pathname, '/maps/embed');
  assert.equal(new URL(result).searchParams.get('pb'), '!1m18!2m3!1d123');
  assert.deepEqual([...new URL(result).searchParams.keys()], ['pb']);
  assert.doesNotMatch(result, /iframe|onload|extra/);
  assert.equal(normalizeContactMapEmbedUrl(url), result);
});

test('contact map rejects external hosts, keys/API URLs, share links, credentials and non-HTTPS', () => {
  for (const value of [null, '', 'javascript:alert(1)', 'https://evil.test/maps/embed?pb=x',
    'https://www.google.com.evil.test/maps/embed?pb=x', 'https://evil@www.google.com/maps/embed?pb=x',
    'http://www.google.com/maps/embed?pb=x', 'https://www.google.com:444/maps/embed?pb=x',
    'https://www.google.com/maps/embed/v1/place?key=secret&q=x', 'https://maps.app.goo.gl/location',
    '<iframe src="https://evil.test"></iframe>', 'x'.repeat(8001)]) assert.equal(normalizeContactMapEmbedUrl(value), null);
});
