import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCategoryBySlug,
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
import { MediaImage } from '@/components/MediaImage';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[]; sort?: string | string[] }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePositivePage(sp.page);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Không tìm thấy danh mục',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { contact } = await getSiteSettingsCached();

  const seo = buildCatalogSeoDecision({
    basePath: `/danh-muc/${category.slug}`,
    page,
    siteUrl,
    indexingAllowed,
  });

  const meta = category.meta as
    | { title?: string | null; description?: string | null; canonicalUrl?: string | null }
    | undefined;

  const title = meta?.title || `${category.name} | ${contact.brandName}`;
  const description =
    meta?.description ||
    category.description ||
    `Danh mục sản phẩm ${category.name} bán sỉ.`;

  return {
    title,
    description,
    alternates: {
      canonical: meta?.canonicalUrl || seo.canonical,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    openGraph: {
      title,
      description,
      url: meta?.canonicalUrl || seo.canonical,
      type: 'website',
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePositivePage(sp.page);
  const sort =
    (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort)?.trim() || 'newest';
  const siteUrl = getSiteUrl();

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const [allCategories, catalog] = await Promise.all([
    getPublishedCategoriesCached(),
    getProductsCatalog({
      categorySlug: category.slug,
      sort,
      page,
      limit: 9,
    }),
  ]);

  const childCategories = allCategories.filter((c) => {
    const parentId =
      c.parent && typeof c.parent === 'object' ? c.parent.id : c.parent;
    return parentId === category.id;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm', href: '/san-pham' },
          { label: category.name },
        ]}
      />

      <section className="grid items-center gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="text-xs font-semibold tracking-wide text-[#B45309]">
            Danh mục sản phẩm bán sỉ
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#0C2340]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              {category.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="tabular-nums">
              {catalog.totalDocs} sản phẩm đang cung cấp
            </span>
            <Link
              href="/lien-he#bao-gia"
              className="font-semibold text-[#B45309] hover:underline"
            >
              Nhận báo giá trọn nhóm {category.name} →
            </Link>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <MediaImage
              media={category.image}
              prefer="card"
              fallbackTitle={category.name}
            />
          </div>
        </div>
      </section>

      {childCategories.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Nhóm con:</span>
          {childCategories.map((child) => (
            <Link
              key={child.id}
              href={`/danh-muc/${child.slug}`}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0C2340] hover:text-[#0C2340]"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {catalog.docs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Danh mục hiện chưa có sản phẩm xuất bản
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Vui lòng quay lại danh sách tổng hợp hoặc gửi yêu cầu để được tư vấn quy cách tương đương.
          </p>
          <Link
            href="/san-pham"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163861]"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={catalog.page}
        totalPages={catalog.totalPages}
        basePath={`/danh-muc/${category.slug}`}
      />
    </div>
  );
}
