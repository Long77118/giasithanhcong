import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveContactConfig } from './contact';
import { buildContactPageJsonLd, contactProductSlug, getContactPageDetails } from './contact-page';
import { serializeJsonLd } from './json-ld';

test('contact product prefill ignores repeated, malformed and overlong slug parameters', () => {
  assert.equal(contactProductSlug('ly-pet-500ml'), 'ly-pet-500ml');
  for (const value of [undefined, ['ly-pet-500ml'], '../admin', 'Bad Slug', 'ly--pet', 'a'.repeat(161)]) {
    assert.equal(contactProductSlug(value), null);
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
