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
import { ProductCard } from '@/components/ProductCard';
import { compactCatalogCardSizes } from '@/lib/storefront-image-sizes';
import { CatalogFilters } from '@/components/CatalogFilters';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

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
      limit: 9,
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
    <div className="site-shell catalog-page py-4 sm:py-7 lg:py-8">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm', href: withPublicSearchParams('/san-pham', { ...filters, page: page > 1 ? String(page) : undefined }) },
        ]}
      />

      <header className="catalog-masthead rounded-2xl px-4 py-4 text-white sm:px-7 sm:py-6 lg:px-9 lg:py-8">
        <h1 className="font-display text-[1.6rem] font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
          Danh mục sản phẩm bán sỉ
        </h1>
        <p className="mt-2 hidden max-w-xl text-sm text-slate-200 sm:block">
          Tra theo mã hàng, đối chiếu quy cách đóng gói và số lượng đặt tối thiểu.
        </p>
      </header>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 sm:mt-4 sm:p-4">
        <CatalogFilters
          key={JSON.stringify([q, category, activeSort.value, page])}
          query={q}
          category={category}
          sort={activeSort.value}
          categories={categoryOptions}
          sorts={catalogSorts}
        />
        {topCategories.length > 0 && (
          <nav aria-label="Lọc nhanh theo nhóm hàng" className="mt-2.5 flex gap-2 overflow-x-auto py-1 sm:mt-3 lg:flex-wrap">
            {[{ slug: '', name: 'Tất cả nhóm' }, ...topCategories].map(({ slug, name }) => (
              <Link
                key={slug}
                href={withPublicSearchParams('/san-pham', { ...filters, category: slug || undefined })}
                aria-current={category === slug ? 'true' : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0C2340] ${category === slug
                  ? 'bg-[#e6eef6] text-[#0C2340]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <section aria-label="Kết quả sản phẩm" className="mt-4 sm:mt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0C2340] sm:text-lg">
            {new Intl.NumberFormat('vi-VN').format(catalog.totalDocs)} sản phẩm
          </h2>
          {catalog.totalPages > 1 && (
            <span className="text-xs font-medium tabular-nums text-slate-600">
              Trang {catalog.page} / {catalog.totalPages}
            </span>
          )}
        </div>

        {appliedFilters.length > 0 && (
          <ul aria-label="Bộ lọc đang áp dụng" className="mt-2 flex min-w-0 flex-wrap gap-2">
            {appliedFilters.map(({ key, label }) => (
              <li key={key} className="min-w-0 max-w-full">
                <Link
                  href={withPublicSearchParams('/san-pham', { ...filters, [key]: undefined })}
                  aria-label={`Bỏ lọc ${label}`}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#294762] hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340]"
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                  <X size={13} className="shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
            {appliedFilters.length > 1 && (
              <li>
                <Link href="/san-pham" className="inline-flex min-h-11 items-center px-1 text-xs font-semibold text-[#294762] underline underline-offset-4">
                  Xóa tất cả
                </Link>
              </li>
            )}
          </ul>
        )}

        {catalog.docs.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center sm:p-10">
            <Search size={24} className="mx-auto text-[#6b8197]" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-bold text-[#0C2340]">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="mt-2 text-sm text-slate-600">
              Thử mã hàng, từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/san-pham" className="inline-flex min-h-11 items-center rounded-lg bg-[#0C2340] px-4 text-sm font-semibold text-white hover:bg-[#163861]">
                Xem tất cả sản phẩm
              </Link>
              <Link href="/lien-he#bao-gia" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-[#0C2340] hover:bg-slate-50">
                Nhờ tư vấn tìm hàng
              </Link>
            </div>
          </div>
        ) : (
          <div className="catalog-grid mt-3 max-sm:gap-2.5">
            {catalog.docs.map((product) => (
              <ProductCard key={product.id} product={product} sizes={compactCatalogCardSizes} variant="catalog" />
            ))}
          </div>
        )}

        <Pagination
          currentPage={catalog.page}
          totalPages={catalog.totalPages}
          basePath="/san-pham"
          queryParams={filters}
        />
      </section>
    </div>
  );
}
