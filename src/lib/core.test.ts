import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCatalogSeoDecision,
  buildProductJsonLd,
  getSiteUrl,
  isIndexingAllowed,
} from './seo';
import { validateQuoteSubmission } from './quote-validation';
import { resolveContactConfig } from './contact';
import { parsePositivePage, toVietnameseSlug } from './slug';

test('getSiteUrl strips trailing slash and uses APP_URL', () => {
  assert.equal(
    getSiteUrl({ APP_URL: 'https://baobianphat.vn/' }),
    'https://baobianphat.vn',
  );
  assert.equal(getSiteUrl({}), 'http://localhost:3000');
});

test('isIndexingAllowed blocks staging, preview, and localhost environments', () => {
  assert.equal(isIndexingAllowed({ ALLOW_INDEXING: 'false', APP_URL: 'https://baobianphat.vn' }), false);
  assert.equal(isIndexingAllowed({ ALLOW_INDEXING: 'true', APP_URL: 'http://localhost:3000' }), false);
  assert.equal(
    isIndexingAllowed({
      ALLOW_INDEXING: 'true',
      APP_URL: 'https://ais-dev-abc.asia-southeast1.run.app',
    }),
    false,
  );
  assert.equal(
    isIndexingAllowed({
      ALLOW_INDEXING: 'true',
      APP_URL: 'https://baobianphat.vn',
    }),
    true,
  );
});

test('buildCatalogSeoDecision sets noindex,follow on search/filter and paginated subpages', () => {
  const cleanPage1 = buildCatalogSeoDecision({
    basePath: '/san-pham',
    page: 1,
    siteUrl: 'https://baobianphat.vn',
    indexingAllowed: true,
  });
  assert.equal(cleanPage1.canonical, 'https://baobianphat.vn/san-pham');
  assert.equal(cleanPage1.robotsIndex, true);

  const searchPage = buildCatalogSeoDecision({
    basePath: '/san-pham',
    page: 1,
    query: 'ly nhựa',
    siteUrl: 'https://baobianphat.vn',
    indexingAllowed: true,
  });
  assert.equal(searchPage.canonical, 'https://baobianphat.vn/san-pham');
  assert.equal(searchPage.robotsIndex, false);
  assert.equal(searchPage.robotsFollow, true);

  const page2 = buildCatalogSeoDecision({
    basePath: '/san-pham',
    page: 2,
    siteUrl: 'https://baobianphat.vn',
    indexingAllowed: true,
  });
  assert.equal(page2.canonical, 'https://baobianphat.vn/san-pham?page=2');
  assert.equal(page2.robotsIndex, false);
  assert.equal(page2.robotsFollow, true);
});

test('quote-only product schema never publishes legacy prices or stock claims', () => {
  // Existing cached records or older API clients may still include legacy fields.
  const legacyProduct = {
    name: 'Ly PET 500ml',
    sku: 'LY-PET-500',
    description: 'Ly nhựa PET trong suốt',
    url: 'https://baobianphat.vn/san-pham/ly-pet-500ml',
    brandName: '  Nhãn hiệu Bao Bì Việt  ',
    images: [],
    price: 500000,
    showPrice: true,
    availability: 'https://schema.org/InStock',
  };
  const schema = buildProductJsonLd(legacyProduct);
  assert.equal(schema['@type'], 'Product');
  assert.equal(schema.sku, legacyProduct.sku);
  assert.deepEqual(schema.brand, { '@type': 'Brand', name: 'Nhãn hiệu Bao Bì Việt' });
  assert.equal('offers' in schema, false);
  assert.equal('price' in schema, false);
  assert.equal('availability' in schema, false);
  assert.doesNotMatch(JSON.stringify(schema), /500000|InStock/);
});

test('product schema omits brand when the CMS field has no confirmed name', () => {
  for (const brandName of [undefined, null, '', '   ']) {
    const schema = buildProductJsonLd({
      name: 'Ly PET 500ml',
      sku: 'LY-PET-500',
      description: 'Ly nhựa PET trong suốt',
      url: 'https://baobianphat.vn/san-pham/ly-pet-500ml',
      brandName,
      images: [],
    });
    assert.equal('brand' in schema, false);
  }
});

test('validateQuoteSubmission validates fields, rejects invalid phone, and catches spam', () => {
  const now = 1_700_000_000_000;
  const invalid = validateQuoteSubmission(
    {
      customerName: 'A',
      phone: '123',
      quantity: '',
      message: 'hi',
    },
    now,
  );
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors?.phone);

  const honeypot = validateQuoteSubmission(
    {
      customerName: 'Nguyễn Văn Minh',
      phone: '0901 234 567',
      quantity: '50 thùng',
      message: 'Cần báo giá sỉ ly nhựa PET 500ml giao quận Tân Bình',
      website: 'https://spam-link.example',
      formLoadedAt: now - 5000,
    },
    now,
  );
  assert.equal(honeypot.ok, false);
  assert.equal(honeypot.isSpam, true);

  const valid = validateQuoteSubmission(
    {
      customerName: 'Nguyễn Văn Minh',
      phone: '0901 234 567',
      email: 'minh@example.com',
      quantity: '50 thùng',
      message: 'Cần báo giá sỉ ly nhựa PET 500ml kèm nắp cầu.',
      website: '',
      formLoadedAt: now - 4000,
    },
    now,
  );
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.phone, '0901234567');
});

test('resolveContactConfig handles unconfigured states without falling back to third-party links', () => {
  const empty = resolveContactConfig({});
  assert.equal(empty.isHotlineConfigured, false);
  assert.equal(empty.isZaloConfigured, false);
  assert.equal(empty.telHref, null);
  assert.equal(empty.zaloUrl, null);

  const configured = resolveContactConfig({
    hotline: '0900 111 222',
    zaloUrl: 'https://zalo.me/0900111222',
  });
  assert.equal(configured.isHotlineConfigured, true);
  assert.equal(configured.telHref, 'tel:0900111222');
  assert.equal(configured.isZaloConfigured, true);
  assert.equal(configured.zaloUrl, 'https://zalo.me/0900111222');
});

test('Vietnamese slugifier removes accents and separates words with hyphens', () => {
  assert.equal(
    toVietnameseSlug('Ly Nhựa PET & Nắp Cầu Đựng Trà Sữa'),
    'ly-nhua-pet-nap-cau-dung-tra-sua',
  );
});

test('pagination accepts positive integers without clamping and rejects malformed page parameters', () => {
  assert.equal(parsePositivePage(), 1);
  assert.equal(parsePositivePage('1'), 1);
  assert.equal(parsePositivePage('03'), 3);
  assert.equal(parsePositivePage('501'), 501);
  for (const value of ['0', '-1', 'abc', '2x', '2.5', '1e2', '', ' 2', '2\n', '9007199254740992', ['2', '3']]) {
    assert.equal(parsePositivePage(value), null, JSON.stringify(value));
  }
});
