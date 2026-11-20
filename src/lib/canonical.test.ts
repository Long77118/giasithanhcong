import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanonicalResolver, normalizeCanonicalPath, type CanonicalDocument } from './canonical';

const site = 'https://example.test';

test('canonical paths normalize same-origin public URLs and reject unsupported URLs', () => {
  assert.equal(normalizeCanonicalPath(' /san-pham/ly-nhua/ ', site), '/san-pham/ly-nhua');
  assert.equal(normalizeCanonicalPath(site + ':443/blog/%61/', site), '/blog/a');
  assert.equal(normalizeCanonicalPath('/danh-muc/cu%2fslug', site), '/danh-muc/cu%2Fslug');
  assert.equal(normalizeCanonicalPath('/blog/', site), '/blog');
  for (const input of [
    '/blog/a?sort=newest', '/blog/a#top', '/blog/a/b', '/blog/%00', '/blog/%', '/admin', 'blog/a',
    '//example.test/blog/a', 'https://outside.test/blog/a', 'http://example.test/blog/a',
    'https://name@example.test/blog/a', 'file:///blog/a', '/blog\\a', null,
  ]) {
    assert.equal(normalizeCanonicalPath(input, site), null, String(input));
  }
});

test('canonical resolver follows slug aliases and chains to a current published target', async () => {
  const product = { path: '/san-pham/a', canonicalUrl: '/danh-muc/b-cu' };
  const category = { path: '/danh-muc/b', canonicalUrl: site + '/blog/c/' };
  const post = { path: '/blog/c' };
  const lookup = new Map<string, CanonicalDocument>([
    ['/danh-muc/b-cu', category], [category.path, category], [post.path, post],
  ]);
  const resolve = createCanonicalResolver(site, async (path) => lookup.get(path));
  assert.equal(await resolve(product), post.path);
  assert.equal(await resolve(category), post.path);
  assert.equal(await resolve(post), post.path);
  assert.equal(await resolve({ path: '/blog/static', canonicalUrl: '/blog' }), '/blog');
  assert.equal(await resolve({ path: '/blog/absent', canonicalUrl: '/blog/draft' }), '/blog/absent');
});

test('canonical cycles and unreachable targets fall back to self for each affected document', async () => {
  const a = { path: '/blog/a', canonicalUrl: '/blog/b' };
  const b = { path: '/blog/b', canonicalUrl: '/blog/a-cu' };
  const c = { path: '/blog/c', canonicalUrl: '/blog/a' };
  const lookup = new Map([[a.path, a], [b.path, b], ['/blog/a-cu', a]]);
  const resolve = createCanonicalResolver(site, async (path) => lookup.get(path));
  for (const doc of [c, a, b]) assert.equal(await resolve(doc), doc.path);
  const selfAlias = createCanonicalResolver(site, async () => a);
  assert.equal(await selfAlias({ ...a, canonicalUrl: '/blog/a-cu' }), a.path);
});
