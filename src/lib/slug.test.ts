import assert from 'node:assert/strict';
import test from 'node:test';
import { decodePublicSlugParam, isValidPublicSlug, publicContentPath, publicSlugMaxLength, toVietnameseSlug, withPublicSearchParams } from './slug';

test('public slug validation accepts Vietnamese names after transliteration and rejects invalid segments', () => {
  assert.equal(toVietnameseSlug('Đĩa nhựa 20 cm'), 'dia-nhua-20-cm');
  for (const slug of ['dia-nhua-20-cm', '1', 'x'.repeat(publicSlugMaxLength)]) {
    assert.equal(isValidPublicSlug(slug), true, slug);
  }
  for (const slug of [
    '', 'Đĩa', 'Uppercase', 'a b', 'a/b', 'a\\b', 'a?b', 'a#b', 'a%2fb', '.', '..',
    'a--b', '-a', 'a-', 'a_', 'a\n', 'x'.repeat(publicSlugMaxLength + 1), null, 1,
  ]) {
    assert.equal(isValidPublicSlug(slug), false, String(slug));
  }
});

test('public paths encode legacy slugs as a single segment and retain repeated query values', () => {
  assert.equal(publicContentPath('products', 'ly-nhua'), '/san-pham/ly-nhua');
  assert.equal(publicContentPath('product-categories', 'ly-nhua'), '/danh-muc/ly-nhua');
  assert.equal(publicContentPath('posts', 'cũ/a?b#c%'), '/blog/c%C5%A9%2Fa%3Fb%23c%25');
  assert.equal(decodePublicSlugParam('c%C5%A9%2Fa%3Fb%23c%25'), 'cũ/a?b#c%');
  assert.equal(decodePublicSlugParam('%252F'), '%2F');
  assert.equal(decodePublicSlugParam('%00'), null);
  assert.equal(decodePublicSlugParam('%'), null);
  assert.equal(withPublicSearchParams('/blog/moi', {}), '/blog/moi');
  assert.equal(
    withPublicSearchParams('/danh-muc/moi', { page: '2', tag: ['a/b', 'c&d'], missing: undefined }),
    '/danh-muc/moi?page=2&tag=a%2Fb&tag=c%26d',
  );
});
