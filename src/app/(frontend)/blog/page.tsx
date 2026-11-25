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
import { blogPostsPerPage } from '@/lib/blog-listing';
import { homeNewsCategoryTones } from '@/lib/home-news';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ListingHeading } from '@/components/ListingHeading';
import { PostListingCard } from '@/components/PostListingCard';
import { Pagination } from '@/components/Pagination';
import '@/components/listing.css';

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
      limit: blogPostsPerPage,
    }),
  ]);

  if (page > 1 && page > postsResult.totalPages) notFound();

  const filters = { q: q || undefined, category: category || undefined };
  const tones = homeNewsCategoryTones(postCategories.map(item => item.id));
  const count = postsResult.docs.length;
  return (
    <div className="site-shell listing-page listing-blog py-4 sm:py-7 lg:py-8">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Blog', href: withPublicSearchParams('/blog', { ...filters, page: page > 1 ? String(page) : undefined }) },
        ]}
      />

      <ListingHeading
        title="Kiến thức bao bì và đóng gói sỉ"
        description="Kinh nghiệm chọn chất liệu, quy cách đóng gói và tính lượng hàng cần nhập cho quán."
      />

      <div className="listing-filter-panel listing-blog-filters">
        <nav className="listing-chip-row" aria-label="Chuyên mục bài viết">
          <Link
            href="/blog"
            className="listing-chip"
            aria-current={!category ? 'true' : undefined}
          >
            Tất cả chuyên mục
          </Link>
          {postCategories.map((pc) => (
            <Link
              key={pc.id}
              href={`/blog?category=${encodeURIComponent(pc.slug)}`}
              className="listing-chip"
              data-tone={tones.get(pc.id)}
              aria-current={category === pc.slug ? 'true' : undefined}
            >
              {pc.name}
            </Link>
          ))}
        </nav>

        <form action="/blog" method="GET" role="search" aria-label="Tìm trong blog" className="listing-blog-search">
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative min-w-0 flex-1">
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
              className="w-full py-2 pl-9 pr-3 text-base sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="listing-button listing-button--primary"
          >
            Tìm
          </button>
        </form>
      </div>

      <section className="listing-results" aria-label="Bài viết">
        {count === 0 ? (
          <div className="listing-empty">
            <span className="listing-empty-icon"><Search size={24} aria-hidden="true" /></span>
            <h2>Chưa có bài viết phù hợp</h2>
            <p>Thử từ khóa khác hoặc xem tất cả chuyên mục.</p>
            <div className="listing-empty-actions">
              <Link href="/blog" className="listing-button listing-button--primary">Xem tất cả bài viết</Link>
            </div>
          </div>
        ) : (
          <div className="listing-grid listing-blog-grid" data-count={count}>
            {postsResult.docs.map((post, index) => (
              <PostListingCard
                key={post.id}
                post={post}
                index={index}
                count={count}
                tone={post.category && typeof post.category === 'object' ? tones.get(post.category.id) : undefined}
              />
            ))}
          </div>
        )}
        <div className="listing-pagination">
          <Pagination
            currentPage={postsResult.page}
            totalPages={postsResult.totalPages}
            basePath="/blog"
            queryParams={filters}
          />
        </div>
      </section>
    </div>
  );
}
