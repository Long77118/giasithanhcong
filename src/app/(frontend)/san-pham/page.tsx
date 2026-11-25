import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  getProductsCatalog,
  getPublishedCategoriesCached,
  getPublishedSlugRedirect,
  getSiteSettingsCached,
} from '@/lib/queries';
import {
  buildCatalogSeoDecision,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { parsePositivePage, withPublicSearchParams, type PublicSearchParams } from '@/lib/slug';
import { categoryTreeOptions } from '@/lib/category-tree';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductListingCard } from '@/components/ProductListingCard';
import { ListingHeading } from '@/components/ListingHeading';
import { CatalogFilters } from '@/components/CatalogFilters';
import { Pagination } from '@/components/Pagination';
import '@/components/listing.css';

export const dynamic = 'force-dynamic';

const productsPerPage = 12;

const catalogSorts = [
  { value: '', label: 'Mới thêm' },
  { value: 'name-asc', label: 'Tên A – Z' },
  { value: 'moq-asc', label: 'MOQ thấp đến cao' },
];

interface SearchParamsProp {
  searchParams: Promise<PublicSearchParams>;
}

function readSingle(val?: string | string[]): string {
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '');
}

export async function generateMetadata({
  searchParams,
}: SearchParamsProp): Promise<Metadata> {
  const sp = await searchParams;
  const q = readSingle(sp.q).trim();
  const category = readSingle(sp.category).trim();
  const sort = readSingle(sp.sort).trim();
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const seo = buildCatalogSeoDecision({
    basePath: '/san-pham',
    page,
    query: q,
    categorySlug: category,
    sort,
    siteUrl,
    indexingAllowed,
  });

  const title = q
    ? `Tìm kiếm "${q}" – Sản phẩm bán sỉ | ${contact.brandName}`
    : page > 1
      ? `Danh sách sản phẩm (Trang ${page}) | ${contact.brandName}`
      : `Danh sách sản phẩm bao bì bán sỉ | ${contact.brandName}`;

  const description =
    'Tra cứu danh sách ly nhựa PET/PP, hộp cơm thực phẩm, chai hũ PET, túi đóng gói và bao bì giấy giá sỉ.';

  return {
    title,
    description,
    alternates: {
      canonical: seo.canonical,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      title,
      description,
      url: seo.canonical,
      type: 'website',
    },
  };
}

export default async function ProductsPage({ searchParams }: SearchParamsProp) {
  const sp = await searchParams;
  const q = readSingle(sp.q).trim();
  const category = readSingle(sp.category).trim();
  const sort = readSingle(sp.sort).trim() || 'newest';
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const siteUrl = getSiteUrl();

  const [categories, catalog] = await Promise.all([
    getPublishedCategoriesCached(),
    getProductsCatalog({
      q,
      categorySlug: category,
      sort,
      page,
      limit: productsPerPage,
    }),
  ]);

  if (category && !catalog.activeCategory) {
    const currentSlug = await getPublishedSlugRedirect('product-categories', category);
    if (currentSlug) permanentRedirect(withPublicSearchParams('/san-pham', { ...sp, category: currentSlug }));
  }
  if (page > 1 && page > catalog.totalPages) notFound();

  const topCategories = categories.filter((cat) => !cat.parent);
  const categoryOptions = categoryTreeOptions(categories).map(({ category: cat, depth }) => ({
    slug: cat.slug,
    name: cat.name,
    depth,
  }));
  const activeSort = catalogSorts.find(option => option.value === sort) ?? catalogSorts[0];
  const filters = {
    q: q || undefined,
    category: category || undefined,
    sort: activeSort.value || undefined,
  };
  const appliedFilters = [
    { key: 'q', label: q ? `“${q}”` : '' },
    { key: 'category', label: catalog.activeCategory?.name ?? category },
    { key: 'sort', label: activeSort.value ? activeSort.label : '' },
  ].filter(filter => filter.label);

  return (
    <div className="site-shell listing-page listing-products py-4 sm:py-7 lg:py-8">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm', href: withPublicSearchParams('/san-pham', { ...filters, page: page > 1 ? String(page) : undefined }) },
        ]}
      />

      <ListingHeading
        title="Danh mục sản phẩm bán sỉ"
        description="Tra theo mã hàng, quy cách đóng gói và số lượng đặt tối thiểu."
        summary={`${new Intl.NumberFormat('vi-VN').format(catalog.totalDocs)} sản phẩm`}
      />

      <div className="listing-filter-panel">
        <CatalogFilters
          key={JSON.stringify([q, category, activeSort.value, page])}
          query={q}
          category={category}
          sort={activeSort.value}
          categories={categoryOptions}
          sorts={catalogSorts}
        />
        {topCategories.length > 0 && (
          <nav aria-label="Lọc nhanh theo nhóm hàng" className="listing-chip-row listing-quick-filters">
            {[{ slug: '', name: 'Tất cả nhóm' }, ...topCategories].map(({ slug, name }) => (
              <Link
                key={slug}
                href={withPublicSearchParams('/san-pham', { ...filters, category: slug || undefined })}
                aria-current={category === slug ? 'true' : undefined}
                className="listing-chip"
              >
                {name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <section aria-labelledby="product-listing-results" className="listing-results">
        <h2 id="product-listing-results" className="sr-only">Kết quả sản phẩm</h2>
        {catalog.totalPages > 1 && (
          <p className="listing-page-number">Trang {catalog.page} / {catalog.totalPages}</p>
        )}

        {appliedFilters.length > 0 && (
          <ul aria-label="Bộ lọc đang áp dụng" className="listing-chip-row listing-applied-filters" role="list">
            {appliedFilters.map(({ key, label }) => (
              <li key={key} className="min-w-0 max-w-full">
                <Link
                  href={withPublicSearchParams('/san-pham', { ...filters, [key]: undefined })}
                  aria-label={`Bỏ lọc ${label}`}
                  className="listing-chip"
                  data-tone="sand"
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                  <X size={13} className="shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
            {appliedFilters.length > 1 && (
              <li>
                <Link href="/san-pham" className="listing-clear-filters">
                  Xóa tất cả
                </Link>
              </li>
            )}
          </ul>
        )}

        {catalog.docs.length === 0 ? (
          <div className="listing-empty">
            <span className="listing-empty-icon"><Search size={24} aria-hidden="true" /></span>
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p>
              Thử mã hàng, từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.
            </p>
            <div className="listing-empty-actions">
              <Link href="/san-pham" className="listing-button listing-button--primary">
                Xem tất cả sản phẩm
              </Link>
              <Link href="/lien-he#bao-gia" className="listing-button">
                Nhờ tư vấn tìm hàng
              </Link>
            </div>
          </div>
        ) : (
          <div className="listing-grid">
            {catalog.docs.map((product, index) => (
              <ProductListingCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        <div className="listing-pagination">
          <Pagination
            currentPage={catalog.page}
            totalPages={catalog.totalPages}
            basePath="/san-pham"
            queryParams={filters}
          />
        </div>
      </section>
    </div>
  );
}
