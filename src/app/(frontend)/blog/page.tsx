import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  getPublishedPostCategoriesCached,
  getPublishedPosts,
  getSiteSettingsCached,
} from '@/lib/queries';
import {
  buildCatalogSeoDecision,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { parsePositivePage, withPublicSearchParams } from '@/lib/slug';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

interface BlogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    page?: string | string[];
  }>;
}

function readSingle(val?: string | string[]): string {
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '');
}

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = readSingle(sp.q).trim();
  const category = readSingle(sp.category).trim();
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const seo = buildCatalogSeoDecision({
    basePath: '/blog',
    page,
    query: q,
    categorySlug: category,
    siteUrl,
    indexingAllowed,
  });

  const title = q
    ? `Tìm bài viết "${q}" | Blog ${contact.brandName}`
    : `Blog Kiến Thức Bao Bì & Vận Hành F&B | ${contact.brandName}`;

  const description =
    'Chia sẻ kinh nghiệm lựa chọn ly nhựa, hộp thực phẩm, chai PET, bao bì giấy và tối ưu nhập hàng sỉ.';

  return {
    title,
    description,
    alternates: { canonical: seo.canonical },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      type: 'website',
      url: seo.canonical,
      title,
      description,
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const q = readSingle(sp.q).trim();
  const category = readSingle(sp.category).trim();
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const siteUrl = getSiteUrl();

  const [postCategories, postsResult] = await Promise.all([
    getPublishedPostCategoriesCached(),
    getPublishedPosts({
      q,
      categorySlug: category,
      page,
      limit: 6,
    }),
  ]);

  if (page > 1 && page > postsResult.totalPages) notFound();

  const filters = { q: q || undefined, category: category || undefined };
  return (
    <div className="site-shell py-8 lg:py-12">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Blog', href: withPublicSearchParams('/blog', { ...filters, page: page > 1 ? String(page) : undefined }) },
        ]}
      />

      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-bold text-[#0C2340]">
          Blog kiến thức bao bì & đóng gói sỉ
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Tổng hợp bài viết hướng dẫn chọn chất liệu nhựa thực phẩm, bao bì giấy và tính định mức tồn kho cho mô hình F&B.
        </p>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/blog"
            className={`inline-flex min-h-[38px] items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              !category
                ? 'bg-[#0C2340] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            Tất cả chuyên mục
          </Link>
          {postCategories.map((pc) => (
            <Link
              key={pc.id}
              href={`/blog?category=${encodeURIComponent(pc.slug)}`}
              className={`inline-flex min-h-[38px] items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === pc.slug
                  ? 'bg-[#0C2340] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {pc.name}
            </Link>
          ))}
        </div>

        <form action="/blog" method="GET" className="flex items-center gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              aria-label="Tìm bài viết"
              placeholder="Tìm bài viết..."
              className="min-h-[40px] w-56 rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="min-h-[40px] rounded-lg bg-[#0C2340] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163861]"
          >
            Tìm
          </button>
        </form>
      </div>

      {postsResult.docs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Chưa có bài viết phù hợp
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Vui lòng thử từ khóa khác hoặc xem tất cả chuyên mục.
          </p>
          <Link
            href="/blog"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163861]"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {postsResult.docs.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={postsResult.page}
        totalPages={postsResult.totalPages}
        basePath="/blog"
        queryParams={filters}
      />
    </div>
  );
}
