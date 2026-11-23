import assert from 'node:assert/strict';
import test from 'node:test';
import { postChecklist, productChecklist, selectedImage } from './editor-completeness';

const meta = { title: 't'.repeat(50), description: 'd'.repeat(150) };
const lookup = { state: 'ready' as const, alts: new Map([['12', 'Hộp kraft nắp gập']]) };
const product = {
  name: 'Hộp kraft', sku: 'HOP-01', category: { id: 2 }, shortDescription: 'a'.repeat(150),
  imageRows: [12, { id: 13, alt: 'Nắp hộp nhìn từ trên' }],
  specs: [{ label: 'Dung tích', value: '500 ml' }], packagingSpec: '50 bộ/thùng', meta,
};

test('product checklist counts populated and fetched alt text and respects short description limits', () => {
  assert.ok(productChecklist(product, lookup).every(item => item.state === 'done'));
  const checks = productChecklist({
    ...product, shortDescription: 'a'.repeat(201), imageRows: [null, 12], specs: [{ label: 'Dung tích' }],
  }, lookup);
  for (const item of checks.filter(item => ['description', 'image', 'specs'].includes(item.id))) {
    assert.equal(item.state, 'missing', item.id);
  }
});

test('image checks distinguish waiting, lookup failure and empty alt text', () => {
  assert.deepEqual(selectedImage({ relationTo: 'media', value: '12' }), { id: '12', alt: undefined });
  const altCheck = (state: 'checking' | 'error' | 'ready') =>
    productChecklist(product, { state, alts: new Map() }).find(item => item.id === 'alt')?.state;
  assert.equal(altCheck('checking'), 'checking');
  assert.equal(altCheck('error'), 'unverified');
  assert.equal(altCheck('ready'), 'missing');
  assert.equal(selectedImage({ id: '/bad' }), undefined);
});

test('post checklist counts visible Lexical words and follows SEO indicator bounds', () => {
  const input = { title: 'Bảo quản hộp', excerpt: 'Tóm tắt', category: '4', coverImage: { id: 18, alt: 'Ảnh bìa' }, meta };
  const content = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Hộp giấy dùng một lần.' }] }] } };
  const checks = postChecklist({ ...input, content }, lookup);
  assert.ok(checks.every(item => item.state === 'done'));
  assert.equal(checks.find(item => item.id === 'content')?.completedHint, '5 từ');
  const incomplete = postChecklist({ ...input, meta: { title: 'x'.repeat(49), description: 'y'.repeat(151) },
    content: { root: { children: [{ type: 'upload', value: 12 }] } } }, lookup);
  assert.deepEqual(incomplete.filter(item => item.state === 'missing').map(item => item.id), ['content', 'seo-title', 'seo-description']);
});
