import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonLd } from '../components/JsonLd';
import { serializeJsonLd } from './json-ld';

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
