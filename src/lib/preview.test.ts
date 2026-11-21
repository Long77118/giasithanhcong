import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { canPreview, parsePreviewID, previewUrl } from './preview';

test('preview IDs accept only positive PostgreSQL integer IDs without coercion', () => {
  for (const value of ['1', '15', '2147483647', 42]) assert.ok(parsePreviewID(value));
  for (const value of [undefined, null, {}, [], '', '0', '-1', '1.5', '1e2', '+1', '01', ' 1', '1 ', '15abc', 'Infinity', '2147483648', '999999999999999999999', NaN, Infinity]) {
    assert.equal(parsePreviewID(value), null, String(value));
  }
});

test('only authenticated users collection admins may preview', () => {
  assert.equal(canPreview({ id: 1, collection: 'users', role: 'admin' }), true);
  for (const user of [null, undefined, {}, { role: 'admin' }, { collection: 'users', role: 'editor' }, { collection: 'users', role: 'customer' }, { collection: 'other', role: 'admin' }]) {
    assert.equal(canPreview(user), false);
  }
});

test('admin preview URLs require saved IDs and use an absolute HTTP site origin', () => {
  assert.equal(previewUrl('products', 15, 'https://demo.example/'), 'https://demo.example/xem-truoc/san-pham/15');
  assert.equal(previewUrl('posts', '3', 'https://demo.example'), 'https://demo.example/xem-truoc/blog/3');
  assert.equal(previewUrl('products', undefined), null);
  assert.equal(previewUrl('products', 'draft-slug'), null);
  for (const base of ['', 'invalid', 'javascript:alert(1)', 'file:///example']) {
    assert.equal(previewUrl('products', 15, base), 'http://localhost:3000/xem-truoc/san-pham/15');
  }
});

test('preview breadcrumbs keep their visible trail without structured data', () => {
  const props = { siteUrl: 'https://demo.example', items: [{ label: 'Bài viết nháp', href: '/blog/nhap' }] };
  const publicHtml = renderToStaticMarkup(createElement(Breadcrumbs, props));
  const previewHtml = renderToStaticMarkup(createElement(Breadcrumbs, { ...props, structuredData: false }));
  assert.match(publicHtml, /application\/ld\+json/);
  assert.doesNotMatch(previewHtml, /application\/ld\+json/);
  assert.match(previewHtml, /Bài viết nháp/);
});
