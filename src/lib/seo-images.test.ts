import assert from 'node:assert/strict';
import test from 'node:test';
import type { Media } from '@/payload-types';
import { resolveOpenGraphImages, resolvePublicImageUrl } from './seo-images';

const site = 'https://example.test';
const media = (id: number, url?: string | null, fields: Partial<Media> = {}): Media => ({
  id,
  url,
  alt: `Ảnh ${id}`,
  createdAt: '',
  updatedAt: '',
  ...fields,
});

test('public image URLs resolve against the site and preserve absolute CDN URLs', () => {
  assert.equal(resolvePublicImageUrl(site, '/api/media/file/anh bia.jpg'), site + '/api/media/file/anh%20bia.jpg');
  assert.equal(resolvePublicImageUrl(site, 'images/anh.png'), site + '/images/anh.png');
  assert.equal(resolvePublicImageUrl(site, 'https://cdn.example.test/anh.png?signature=abc'), 'https://cdn.example.test/anh.png?signature=abc');
  for (const value of [null, '', '#anh', '?anh.png', 'file:///anh.png', 'data:image/png,abc', 'https://user@host.test/image.png', 'https://', '/\\anh.png']) {
    assert.equal(resolvePublicImageUrl(site, value), null, String(value));
  }
});

test('Open Graph images choose the first usable original and keep real image metadata', () => {
  const seo = media(1, '/seo.jpg', { width: 1200, height: 630, sizes: { card: { url: '/seo-card.jpg' } } });
  const cover = media(2, '/cover.jpg', { width: 800, height: null });
  const fallback = media(3, '/default.jpg', { width: 0 });

  assert.deepEqual(resolveOpenGraphImages(site, seo, cover, fallback), [
    { url: site + '/seo.jpg', alt: 'Ảnh 1', width: 1200, height: 630 },
  ]);
  assert.deepEqual(resolveOpenGraphImages(site, 42, media(4), cover, fallback), [
    { url: site + '/cover.jpg', alt: 'Ảnh 2', width: 800, height: undefined },
  ]);
  assert.deepEqual(resolveOpenGraphImages(site, null, media(4, '/some.pdf', { mimeType: 'application/pdf' }), fallback), [
    { url: site + '/default.jpg', alt: 'Ảnh 3', width: undefined, height: undefined },
  ]);
  assert.equal(resolveOpenGraphImages(site, null, undefined, 1, media(5, null)), undefined);
});
