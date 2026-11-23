import test from 'node:test';
import assert from 'node:assert/strict';
import { duplicateProductSKU, generateSiteSeoTitle, validateProductShortDescription } from './product-admin';
import { Products } from '../collections/Products';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { postgresAdapter } from '@payloadcms/db-postgres';

test('New short descriptions stop at 200 characters; legacy long descriptions remain saveable', () => {
  const validate = (value: string, previousValue?: string) => validateProductShortDescription(value, { previousValue } as never);
  assert.equal(validate('a'.repeat(200)), true);
  assert.equal(typeof validate('a'.repeat(201)), 'string');
  assert.equal(validate('a'.repeat(250), 'b'.repeat(220)), true);
  assert.equal(validate('a'.repeat(220), 'a'.repeat(220)), true);
  assert.equal(validate('Đã rút gọn', 'a'.repeat(220)), true);
  assert.equal(typeof validate('   '), 'string');
});

test('Duplicated SKUs preserve their base with a bounded, random suffix', () => {
  const first = duplicateProductSKU('PET-500');
  assert.match(first, /^PET-500-ban-sao-[a-f0-9]{12}$/);
  assert.notEqual(first, duplicateProductSKU('PET-500'));
  assert.ok(duplicateProductSKU('A'.repeat(500)).length < 160);
});

test('SEO titles use the global site brand and a neutral fallback, never product brand', async () => {
  const run = (doc: unknown, brandName: string) => generateSiteSeoTitle({ doc, req: { payload: { findGlobal: async (args: {slug: string;depth: number}) => {
    assert.equal(args.slug, 'site-settings'); assert.equal(args.depth, 0); return {brandName};
  } } } } as never);
  assert.equal(await run({name:'Ly PET',brandName:'Thương hiệu sản phẩm'}, 'Tên cửa hàng mới'), 'Ly PET | Tên cửa hàng mới');
  assert.equal(await run({title:'Bài viết'}, '  Cửa hàng  '), 'Bài viết | Cửa hàng');
  assert.equal(await run({name:'Ly PET'}, ''), 'Ly PET | Website');
  assert.equal(await run({}, ''), 'Website');
});

test('Installed SEO plugin appends an unnamed SEO tab and preserves sidebar fields', async () => {
  const config = await seoPlugin({ collections:['products'], tabbedUI:true })({
    collections:[Products], secret:'unit-test-only', db:postgresAdapter({pool:{host:'127.0.0.1',database:'not_connected'}}),
  });
  const fields=config.collections![0].fields;
  assert.equal(fields[0].type,'tabs');
  if(fields[0].type !== 'tabs') throw new Error('Missing tabs');
  assert.deepEqual(fields[0].tabs.map(tab=>tab.label),['Cơ bản','Hình ảnh','Thông số và đóng gói','Nội dung','Liên kết','SEO']);
  assert.ok(fields[0].tabs.every(tab=>!('name' in tab)));
  const checklist = fields[1];
  assert.equal(checklist.type, 'ui');
  assert.equal(checklist.admin?.position, 'sidebar');
  const sidebar=fields.slice(1).filter(field=>field.type !== 'ui' && 'name' in field).map(field=>'name' in field ? field.name : '');
  assert.deepEqual(sidebar,['featured','status']);
});
