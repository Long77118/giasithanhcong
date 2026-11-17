import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import {
  getProductsCatalog,
  getPublishedCategoriesCached,
  getSiteSettingsCached,
} from '@/lib/queries';
import {
  buildCatalogSeoDecision,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { parsePositivePage } from '@/lib/slug';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

interface SearchParamsProp {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
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
  const page = parsePositivePage(sp.page);
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { contact } = await getSiteSettingsCached();

  const seo = buildCatalogSeoDecision({
    basePath: '/san-pham',
    page,
    query: q,
    categorySlug: category,
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

  const topCategories = categories.filter((c) => !c.parent);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm' },
        ]}
      />

      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-bold text-[#0C2340]">
          Danh mục sản phẩm bán sỉ
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Tìm kiếm theo tên sản phẩm, mã SKU hoặc lọc theo nhóm ngành hàng. Chọn sản phẩm để xem thông số chi tiết và gửi yêu cầu báo giá.
        </p>
      </div>

      {/* Working Search, Category Filter & Sort Controls */}
      <form
        action="/san-pham"
        method="GET"
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-12"
      >
        <div className="relative md:col-span-5">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Từ khóa hoặc mã SKU"
            placeholder="Tìm tên sản phẩm, mã SKU..."
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
          />
        </div>

        <div className="md:col-span-3">
          <select
            name="category"
            defaultValue={category}
            aria-label="Lọc theo danh mục"
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
          >
            <option value="">Tất cả danh mục</option>
            {topCategories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            name="sort"
            defaultValue={sort}
            aria-label="Sắp xếp kết quả"
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
          >
            <option value="newest">Mới cập nhật</option>
            <option value="name-asc">Tên A – Z</option>
            <option value="moq-asc">MOQ thấp đến cao</option>
          </select>
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <button
            type="submit"
            className="min-h-[44px] flex-1 rounded-lg bg-[#0C2340] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163861]"
          >
            Lọc
          </button>
          {(q || category || sort !== 'newest') && (
            <Link
              href="/san-pham"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xóa
            </Link>
          )}
        </div>
      </form>

      {/* Quick Category Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href="/san-pham"
          className={`inline-flex min-h-[38px] items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !category
              ? 'bg-[#0C2340] text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          Tất cả
        </Link>
        {topCategories.map((cat) => {
          const active = category === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/san-pham?category=${encodeURIComponent(cat.slug)}`}
              className={`inline-flex min-h-[38px] items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#0C2340] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
        <p className="tabular-nums">
          Hiển thị <strong className="text-slate-800">{catalog.docs.length}</strong> /{' '}
          <strong className="text-slate-800">{catalog.totalDocs}</strong> sản phẩm đã xuất bản
          {q ? ` cho từ khóa "${q}"` : ''}
          {catalog.activeCategory ? ` trong "${catalog.activeCategory.name}"` : ''}
        </p>
      </div>

      {/* Product Grid or Empty State */}
      {catalog.docs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Không tìm thấy sản phẩm phù hợp
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hãy thử tìm bằng từ khóa ngắn hơn (ví dụ: PET, PP, kraft, 500ml) hoặc đặt lại bộ lọc.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/san-pham"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163861]"
            >
              Xem tất cả sản phẩm
            </Link>
            <Link
              href="/lien-he#bao-gia"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Yêu cầu tìm nguồn hàng
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={catalog.page}
        totalPages={catalog.totalPages}
        basePath="/san-pham"
        queryParams={{
          q: q || undefined,
          category: category || undefined,
          sort: sort !== 'newest' ? sort : undefined,
        }}
      />
    </div>
  );
}
