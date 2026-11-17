import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCatalogSeoDecision,
  buildProductJsonLd,
  formatPriceVnd,
  getSiteUrl,
  isIndexingAllowed,
} from './seo';
import {
  checkSlidingWindowRateLimit,
  validateQuoteSubmission,
} from './quote-validation';
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

test('formatPriceVnd displays Liên hệ báo giá when price is hidden or empty', () => {
  assert.equal(formatPriceVnd(null, false), 'Liên hệ báo giá');
  assert.equal(formatPriceVnd(150000, false), 'Liên hệ báo giá');
  assert.equal(formatPriceVnd(0, true), 'Liên hệ báo giá');
  assert.match(formatPriceVnd(420000, true), /420\.000 đ/);
});

test('buildProductJsonLd omits offers when price is hidden', () => {
  const hiddenPriceLd = buildProductJsonLd({
    name: 'Ly PET 500ml',
    sku: 'LY-PET-500',
    description: 'Ly nhựa PET trong suốt',
    url: 'https://baobianphat.vn/san-pham/ly-pet-500ml',
    brandName: 'Bao Bì An Phát',
    images: [],
    price: 500000,
    showPrice: false,
  });
  assert.equal('offers' in hiddenPriceLd, false);

  const shownPriceLd = buildProductJsonLd({
    name: 'Ly PET 500ml',
    sku: 'LY-PET-500',
    description: 'Ly nhựa PET trong suốt',
    url: 'https://baobianphat.vn/san-pham/ly-pet-500ml',
    brandName: 'Bao Bì An Phát',
    images: [],
    price: 500000,
    showPrice: true,
  });
  assert.equal((shownPriceLd.offers as { price: number }).price, 500000);
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

test('checkSlidingWindowRateLimit enforces request cap', () => {
  const store = new Map();
  const base = 1_700_000_000_000;
  for (let i = 0; i < 3; i++) {
    const res = checkSlidingWindowRateLimit(store, 'ip-1', {
      maxRequests: 3,
      windowMs: 60_000,
      nowMs: base + i * 1000,
    });
    assert.equal(res.allowed, true);
  }
  const blocked = checkSlidingWindowRateLimit(store, 'ip-1', {
    maxRequests: 3,
    windowMs: 60_000,
    nowMs: base + 5000,
  });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
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

test('Vietnamese slugifier and pagination parser behave deterministically', () => {
  assert.equal(
    toVietnameseSlug('Ly Nhựa PET & Nắp Cầu Đựng Trà Sữa'),
    'ly-nhua-pet-nap-cau-dung-tra-sua',
  );
  assert.equal(parsePositivePage('3'), 3);
  assert.equal(parsePositivePage('-1'), 1);
  assert.equal(parsePositivePage('abc'), 1);
});
