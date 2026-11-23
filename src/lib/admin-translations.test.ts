import assert from 'node:assert/strict';
import test from 'node:test';
import { initI18n } from '@payloadcms/translations';
import { vi } from '@payloadcms/translations/languages/vi';
import { ValidationError } from 'payload';
import { adminVietnamese } from '../admin/translations';
import { guardPublicSlug } from './public-slug-hooks';

const adminI18n = { supportedLanguages: { vi }, translations: { vi: adminVietnamese } };
const tokens = (text: string) => [...new Set(text.match(/\{\{[^}]+\}\}|<\/?\d+>/g))].sort();

test('Vietnamese overrides keep Payload keys, interpolation variables and component slots', () => {
  const defaults: Record<string, Record<string, string>> = vi.translations;
  for (const [section, entries] of Object.entries(adminVietnamese)) {
    if (section === 'plugin-seo') continue;
    for (const [key, translation] of Object.entries(entries)) {
      const original = defaults[section]?.[key];
      assert.ok(original, `${section}:${key}`);
      assert.deepEqual(tokens(translation), tokens(original), `${section}:${key}`);
    }
  }
});

test('Payload merges Vietnamese admin copy and preserves labels and counts', async () => {
  const { t } = await initI18n({ config: adminI18n, context: 'client', language: 'vi' });
  assert.equal(t('general:save'), 'Lưu');
  for (const count of [1, 3, 9]) {
    assert.equal(t('general:aboutToDeleteCount', { count, label: 'sản phẩm' }), `Bạn có muốn xóa ${count} sản phẩm đã chọn không?`);
  }
  assert.equal(t('general:uploadingBulk', { current: 2, total: 4 }), 'Đang tải tệp 2/4');
});

test('the public slug guard uses Vietnamese for the error summary and keeps the slug field path', async () => {
  const translations = { ...vi.translations, error: { ...vi.translations.error, ...adminVietnamese.error } };
  const { t } = await initI18n({ config: { ...adminI18n, translations: { vi: translations } }, context: 'api', language: 'vi' });
  const args = {
    collection: { slug: 'products' }, context: {}, data: { slug: 'Invalid slug' }, operation: 'create', req: { t },
  } as unknown as Parameters<typeof guardPublicSlug>[0];
  await assert.rejects(() => Promise.resolve(guardPublicSlug(args)), (error: unknown) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.message, 'Bạn cần kiểm tra ô Đường dẫn (slug)');
    assert.equal(error.data.errors[0].path, 'slug');
    assert.match(error.data.errors[0].message, /^Hãy dùng tối đa/);
    return true;
  });
});
