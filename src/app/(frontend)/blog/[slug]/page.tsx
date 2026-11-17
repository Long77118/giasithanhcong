import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PostCategory, Product } from '@/payload-types';
import {
  getPublishedPostBySlug,
  getPublishedPosts,
  getSiteSettingsCached,
} from '@/lib/queries';
import {
  buildArticleJsonLd,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactActions } from '@/components/ContactActions';
import { LexicalContent } from '@/components/LexicalContent';
import { MediaImage, resolveMediaUrl } from '@/components/MediaImage';
import { PostCard } from '@/components/PostCard';
import { ProductCard } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

interface PostDetailProps {
  params: Promise<{ slug: string }>;
}

function formatDateVi(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export async function generateMetadata({
  params,
}: PostDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Không tìm thấy bài viết',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { contact } = await getSiteSettingsCached();

  const meta = post.meta as
    | { title?: string | null; description?: string | null; canonicalUrl?: string | null }
    | undefined;

  const canonical = meta?.canonicalUrl || `${siteUrl}/blog/${post.slug}`;
  const title = meta?.title || `${post.title} | ${contact.brandName}`;
  const description = meta?.description || post.excerpt;
  const cover = resolveMediaUrl(post.coverImage, 'card');

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      publishedTime: post.publishedAt,
      images: cover.url ? [{ url: `${siteUrl}${cover.url}` }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: PostDetailProps) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  const [post, { contact }, recentPosts] = await Promise.all([
    getPublishedPostBySlug(slug),
    getSiteSettingsCached(),
    getPublishedPosts({ page: 1, limit: 4 }),
  ]);

  if (!post) {
    notFound();
  }

  const categoryObj =
    post.category && typeof post.category === 'object'
      ? (post.category as PostCategory)
      : null;

  const coverResolved = resolveMediaUrl(post.coverImage, 'hero');

  const articleJsonLd = buildArticleJsonLd({
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/blog/${post.slug}`,
    image: coverResolved.url ? `${siteUrl}${coverResolved.url}` : null,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.authorName,
    publisherName: contact.brandName,
  });

  const relatedProducts = (post.relatedProducts ?? [])
    .filter((p): p is Product => Boolean(p && typeof p === 'object'))
    .filter((p) => p.status === 'published');

  const relatedPosts = recentPosts.docs.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Breadcrumbs
          siteUrl={siteUrl}
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />

        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {categoryObj && (
              <Link
                href={`/blog?category=${encodeURIComponent(categoryObj.slug)}`}
                className="font-semibold text-[#B45309] hover:underline"
              >
                {categoryObj.name}
              </Link>
            )}
            {categoryObj && <span aria-hidden="true">·</span>}
            <time dateTime={post.publishedAt}>{formatDateVi(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>Tác giả: {post.authorName}</span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-[#0C2340] text-balance sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        </header>

        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <MediaImage
            media={post.coverImage}
            prefer="hero"
            priority
            fallbackTitle={post.title}
          />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
          <LexicalContent data={post.content} />
        </div>

        {/* Contact CTA box */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-[#0C2340]">
            Cần tư vấn quy cách bao bì phù hợp mô hình quán?
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Trao đổi trực tiếp với đội ngũ hỗ trợ hoặc gửi yêu cầu nhận mẫu và bảng giá sỉ.
          </p>
          <div className="mt-4">
            <ContactActions contact={contact} quoteHref="/lien-he#bao-gia" />
          </div>
        </div>
      </article>

      {relatedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-[#0C2340]">
              Sản phẩm đề cập trong bài viết
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#0C2340]">
            Bài viết cùng chuyên mục
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((other) => (
              <PostCard key={other.id} post={other} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
