import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Breadcrumbs } from '../components/Breadcrumbs';

test('breadcrumb JSON-LD uses the current URL while the visual current crumb is plain text', () => {
  const html = renderToStaticMarkup(React.createElement(Breadcrumbs, {
    siteUrl: 'https://example.test',
    items: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: '/san-pham' },
      { label: 'Ly nhựa', href: '/danh-muc/ly-nhua?page=2&sort=name-asc' },
    ],
  }));
  const script = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(script);
  const schema = JSON.parse(script);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.deepEqual(schema.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://example.test/' },
    { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: 'https://example.test/san-pham' },
    { '@type': 'ListItem', position: 3, name: 'Ly nhựa', item: 'https://example.test/danh-muc/ly-nhua?page=2&sort=name-asc' },
  ]);
  assert.match(html, /<span[^>]*aria-current="page">Ly nhựa<\/span>/);
  assert.doesNotMatch(html, /href="\/danh-muc\/ly-nhua/);
});
