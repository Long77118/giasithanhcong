import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeContactMapEmbedUrl } from './contact-map';

const embedUrl = 'https://www.google.com/maps/embed';

const samples = [
  '!1m18!1m12!1m3!1d3773.54!2d106.6297!3d10.8231!2m3!1f0!2f0!3f0!3m3!1m2!1sKho+%C4%90%C3%B4ng%2C+T%C3%A2n+B%C3%ACnh!2sTP.%20H%E1%BB%93%20Ch%C3%AD%20Minh!5e0',
  '!1m18!1m12!1m3!1d15245.13!2d105.8342!3d21.0278!2m3!1f0!2f0!3f0!3m3!1m2!1sC%E1%BB%ADa+h%C3%A0ng+A%2BB,+H%C3%A0+N%E1%BB%99i!2s21.0278,105.8342!5e1',
  '!1m14!1m8!1m3!1d2027.6!2d108.2022!3d16.0544!3m2!1s%C4%90%C3%A0+N%E1%BA%B5ng,+Vi%E1%BB%87t+Nam!2sQu%E1%BA%ADn%2520H%E1%BA%A3i%2520Ch%C3%A2u!3m2!1svi!2svn!5e0',
];

for (const [index, pb] of samples.entries()) {
  test(`contact map preserves Maps sample ${index + 1} as both a URL and pasted iframe`, () => {
    const url = `${embedUrl}/?pb=${pb}&extra=ignored#fragment`;
    const iframe = `<iframe width="600" src="${url.replaceAll('&', '&amp;')}" onload="bad()"></iframe>`;
    for (const input of [url, iframe]) {
      const normalized = normalizeContactMapEmbedUrl(input);
      assert.equal(normalized, `${embedUrl}?pb=${pb}`);
      const verified = new URL(normalized!);
      assert.equal(verified.searchParams.get('pb'), new URL(url).searchParams.get('pb'));
      assert.deepEqual([...verified.searchParams.keys()], ['pb']);
      assert.equal(normalizeContactMapEmbedUrl(normalized), normalized);
    }
  });
}

test('contact map uses the first pb and accepts previously re-encoded CMS URLs', () => {
  const saved = `${embedUrl}?pb=%211m18%21Kho+ABC%2BDEF`;
  assert.equal(normalizeContactMapEmbedUrl(saved), saved);
  assert.equal(normalizeContactMapEmbedUrl(`${embedUrl}??pb=ignored&%70b=%211m18&pb=duplicate`), `${embedUrl}?pb=%211m18`);
  assert.equal(normalizeContactMapEmbedUrl(`${embedUrl}?pb=&pb=ignored`), null);
});

test('contact map preserves a URL at the length limit and rejects oversized source or output', () => {
  const prefix = `${embedUrl}?pb=`;
  const size = 8000 - prefix.length;
  const atLimit = `${prefix}${'!1m'.repeat(Math.ceil(size / 3)).slice(0, size)}`;
  assert.equal(atLimit.length, 8000);
  const normalized = normalizeContactMapEmbedUrl(atLimit);
  assert.equal(normalized, atLimit);
  assert.equal(normalizeContactMapEmbedUrl(normalized), atLimit);
  assert.equal(normalizeContactMapEmbedUrl(`${atLimit}x`), null);
  assert.equal(normalizeContactMapEmbedUrl(`${prefix}${'ộ'.repeat(size)}`), null);
});

test('contact map rejects untrusted hosts, explicit ports, credentials, other paths and missing pb', () => {
  for (const value of [null, '', 'javascript:alert(1)', 'https://evil.test/maps/embed?pb=x',
    'https://www.google.com.evil.test/maps/embed?pb=x', 'https://evil@www.google.com/maps/embed?pb=x',
    'https://www.google.com@evil.test/maps/embed?pb=x', 'https://@www.google.com/maps/embed?pb=x',
    'http://www.google.com/maps/embed?pb=x', 'https://www.google.com:444/maps/embed?pb=x', 'https://www.google.com:443/maps/embed?pb=x',
    'https://www.google.com/maps/embed/v1/place?key=secret&q=x', 'https://maps.app.goo.gl/location',
    'https://www.google.com/maps/place?pb=x', embedUrl, `${embedUrl}?other=x`, `${embedUrl}?pb`, `${embedUrl}?pb=`,
    '<iframe src="https://evil.test"></iframe>']) assert.equal(normalizeContactMapEmbedUrl(value), null, String(value));
});
