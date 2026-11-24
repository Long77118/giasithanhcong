import assert from 'node:assert/strict';
import { test } from 'node:test';
import { facebookPageFrameDimensions, facebookPageFrameWidth, facebookPagePluginUrl, normalizeFacebookPageUrl } from './facebook-page';

test('Facebook page URLs accept usernames and IDs and strip Facebook tracking parameters', () => {
  assert.equal(
    normalizeFacebookPageUrl(' https://m.facebook.com/Bao.Bi/?mibextid=test#about '),
    'https://www.facebook.com/Bao.Bi',
  );
  assert.equal(
    normalizeFacebookPageUrl('https://www.facebook.com/profile.php?id=123456&ref=embed_page'),
    'https://www.facebook.com/profile.php?id=123456',
  );
  assert.equal(
    normalizeFacebookPageUrl('https://www.facebook.com/people/Bao-Bi/123456'),
    'https://www.facebook.com/123456',
  );
});

test('Facebook page URLs reject other origins, insecure links, and posts and share URLs', () => {
  for (const value of [
    '',
    123,
    'http://facebook.com/BaoBi',
    'https://facebook.com.example.org/BaoBi',
    'https://facebook.com@elsewhere.example/BaoBi',
    'https://other.example@facebook.com/BaoBi',
    'https://facebook.com:8443/BaoBi',
    'https://facebook.com/',
    'https://facebook.com/profile.php?id=not-an-id',
    'https://facebook.com/share/abc123',
    'https://facebook.com/BaoBi/posts/123456',
    'javascript:alert(1)',
  ]) {
    assert.equal(normalizeFacebookPageUrl(value), null, String(value));
  }
});

test('Facebook page previews only use widths supported by the Page Plugin', () => {
  for (const width of [NaN, Infinity, -1, 0, 179.9]) {
    assert.equal(facebookPageFrameWidth(width), null);
  }
  assert.equal(facebookPageFrameWidth(180), 180);
  assert.equal(facebookPageFrameWidth(319.9), 319);
  assert.equal(facebookPageFrameWidth(700), 500);
});

test('Facebook embeds request the Vietnamese timeline and preserve the normalized profile ID', () => {
  const normalized = normalizeFacebookPageUrl('https://m.facebook.com/profile.php?id=123456&ref=embed_page');
  assert.ok(normalized);
  const frame = new URL(facebookPagePluginUrl(normalized, 320));
  assert.equal(frame.origin, 'https://www.facebook.com');
  assert.equal(frame.pathname, '/plugins/page.php');
  assert.equal(frame.searchParams.get('href'), 'https://www.facebook.com/profile.php?id=123456');
  assert.equal(frame.searchParams.get('tabs'), 'timeline');
  assert.equal(frame.searchParams.get('locale'), 'vi_VN');
  assert.equal(frame.searchParams.get('width'), '320');
  assert.equal(frame.searchParams.get('height'), String(facebookPageFrameDimensions.height));
});
