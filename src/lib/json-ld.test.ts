import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonLd } from '../components/JsonLd';
import { resolveContactConfig } from './contact';
import { serializeJsonLd } from './json-ld';
import { buildOrganizationJsonLd } from './seo';

const adversarialText = '</script><script id="injected">alert(1)</script><!-- <img src=x onerror=alert(1)> Bao bì "Việt" & giấy';

for (const type of ['Organization', 'Product', 'BlogPosting', 'BreadcrumbList']) {
  test(`${type} JSON-LD keeps untrusted text inside one inert script`, () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': type,
      name: adversarialText,
      nested: { text: adversarialText, unicode: 'Tiếng Việt: đ, ă, ơ, ư' },
    };
    const html = renderToStaticMarkup(React.createElement(JsonLd, { data }));
    assert.equal((html.match(/<script\b/g) ?? []).length, 1);
    assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<img|<!--|<script id="injected"/);
    const body = html.match(/^<script type="application\/ld\+json">([\s\S]*)<\/script>$/)?.[1];
    assert.ok(body);
    assert.doesNotMatch(body, /</);
    assert.deepEqual(JSON.parse(body), data);
  });
}

test('JSON-LD serialization preserves valid URLs, numbers and Vietnamese content', () => {
  const data = { name: 'Hộp & khay nhựa', url: 'https://example.com/san-pham?x=1&y=2', count: 12, optional: null };
  assert.deepEqual(JSON.parse(serializeJsonLd(data)), data);
});

test('Organization JSON-LD provides a stable identity and includes only configured contact details', () => {
  const siteUrl = 'https://example.com';
  const empty = buildOrganizationJsonLd(siteUrl, resolveContactConfig({ brandName: 'Công Ty A' }));
  assert.equal(empty['@type'], 'Organization');
  assert.equal(empty['@id'], `${siteUrl}/#organization`);
  assert.equal(empty.url, siteUrl);
  for (const property of ['telephone', 'email', 'address']) assert.equal(property in empty, false);

  const contact = resolveContactConfig({
    brandName: 'Công Ty B', tagline: 'Bao bì dùng một lần', hotline: '0900 000 001', secondaryHotline: '0900000002',
    email: 'hello@example.com', address: 'Kho A, Khu công nghiệp Tân Bình, TP. Hồ Chí Minh',
  });
  const schema = buildOrganizationJsonLd(siteUrl, contact);
  assert.equal(schema['@id'], empty['@id']);
  assert.equal(schema.description, contact.tagline);
  assert.deepEqual(schema.telephone, [contact.hotline, contact.secondaryHotline]);
  assert.equal(schema.email, contact.email);
  assert.equal(schema.address, contact.address);
  assert.deepEqual(JSON.parse(serializeJsonLd(schema)), schema);
});
