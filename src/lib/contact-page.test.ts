import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveContactConfig } from './contact';
import { buildContactPageJsonLd, getContactPageDetails, resolveContactProduct } from './contact-page';
import { serializeJsonLd } from './json-ld';

test('contact opens the general form without a lookup for absent or malformed product slugs', async () => {
  const unexpectedLookup = async () => assert.fail('No product lookup was expected');
  for (const value of [undefined, ['ly-pet-500ml'], '../admin', 'Bad Slug', 'ly--pet', 'a'.repeat(161)]) {
    assert.deepEqual(await resolveContactProduct({ sanpham: value }, unexpectedLookup, unexpectedLookup), {
      product: null, redirectTo: null,
    });
  }
});

test('contact fills the form for a current published slug without reading history', async () => {
  const product = { id: 12, name: 'Ly PET 500 ml' };
  const result = await resolveContactProduct({ sanpham: 'ly-pet-500ml' }, async slug => {
    assert.equal(slug, 'ly-pet-500ml');
    return product;
  }, async () => assert.fail('No history lookup was expected'));
  assert.deepEqual(result, { product, redirectTo: null });
});

test('contact redirects a historical slug to the current published slug and preserves other parameters', async () => {
  const result = await resolveContactProduct({ sanpham: 'ly-cu', tag: ['a/b', 'c&d'] }, async slug => {
    assert.equal(slug, 'ly-cu');
    return null;
  }, async slug => {
    assert.equal(slug, 'ly-cu');
    return 'ly-pet-500ml';
  });
  assert.deepEqual(result, { product: null, redirectTo: '/lien-he?sanpham=ly-pet-500ml&tag=a%2Fb&tag=c%26d' });
});

test('contact opens the general form when history has no usable published target', async () => {
  for (const currentSlug of [null, 'ly-cu', '../admin']) {
    const result = await resolveContactProduct({ sanpham: 'ly-cu' }, async () => null, async () => currentSlug);
    assert.deepEqual(result, { product: null, redirectTo: null });
  }
});

test('contact data hides missing groups, deduplicates phones and encodes directions', () => {
  const empty = getContactPageDetails(resolveContactConfig({}));
  assert.equal(empty.hasDetails, false);
  assert.equal(empty.directionsHref, null);
  const details = getContactPageDetails(resolveContactConfig({
    hotline: '0900 000 001', secondaryHotline: '0900000001', address: '12 Đường A & B, TP.HCM',
  }));
  assert.equal(details.phones.length, 1);
  const url = new URL(details.directionsHref!);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/search/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('query'), '12 Đường A & B, TP.HCM');
  assert.equal(getContactPageDetails(resolveContactConfig({ secondaryHotline: '0900000002' })).phones.length, 1);
});

test('contact structured data includes only configured facts and remains safe in a script', () => {
  const empty = buildContactPageJsonLd('https://example.test', resolveContactConfig({ brandName: 'Công Ty A' }));
  assert.equal(empty['@type'], 'ContactPage');
  assert.deepEqual(Object.keys(empty.mainEntity).sort(), ['@type', 'name', 'url']);
  const contact = resolveContactConfig({ brandName: '</script><script>bad</script>', hotline: '0900000001',
    secondaryHotline: '0900000002', email: 'hello@example.test', address: 'Địa chỉ thật', workingHours: 'Thứ 2 – Thứ 6: 08:00 – 17:00' });
  const schema = buildContactPageJsonLd('https://example.test', contact);
  assert.equal(schema.mainEntity.email, contact.email);
  assert.equal(schema.mainEntity.address, contact.address);
  assert.deepEqual(schema.mainEntity.telephone, [contact.hotline, contact.secondaryHotline]);
  assert.equal(schema.mainEntity.description, `Giờ làm việc: ${contact.workingHours}`);
  assert.doesNotMatch(JSON.stringify(schema), /geo|aggregateRating|priceRange|openingHoursSpecification/);
  assert.doesNotMatch(serializeJsonLd(schema), /<script|<\/script/);
});
