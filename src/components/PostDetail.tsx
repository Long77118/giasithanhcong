import Link from 'next/link';
import type { Post, Product } from '@/payload-types';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getRelatedPublishedPosts } from '@/lib/queries';
import { buildArticleJsonLd } from '@/lib/seo';
import { resolvePublicImageUrl } from '@/lib/seo-images';
import { publicContentPath } from '@/lib/slug';
import { catalogCardSizes, threeColumnCardSizes } from '@/lib/storefront-image-sizes';
import { Breadcrumbs } from './Breadcrumbs';
import { ContactActions } from './ContactActions';
import { LexicalContent } from './LexicalContent';
import { MediaImage, resolveMediaUrl } from './MediaImage';
import { PostCard } from './PostCard';
import { ProductCard } from './ProductCard';
import { JsonLd } from './JsonLd';

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

export async function PostDetail({ post, contact, siteUrl, preview = false }: {
  post: Post;
  contact: ResolvedContactConfig;
  siteUrl: string;
  preview?: boolean;
}) {
  const categoryObj =
    post.category && typeof post.category === 'object'
      ? post.category
      : null;
  const relatedPosts = categoryObj?.status === 'published'
    ? await getRelatedPublishedPosts(categoryObj.id, post.id)
    : [];

  const coverResolved = resolveMediaUrl(post.coverImage, 'hero');

  const articleJsonLd = buildArticleJsonLd({
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}${publicContentPath('posts', post.slug)}`,
    image: resolvePublicImageUrl(siteUrl, coverResolved.url),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.authorName,
    publisherName: contact.brandName,
  });

  const relatedProducts = (post.relatedProducts ?? [])
    .filter((p): p is Product => Boolean(p && typeof p === 'object'))
    .filter((p) => p.status === 'published');

  return (
    <>
      {!preview && <JsonLd data={articleJsonLd} />}

      <article className="site-shell py-8 lg:py-12">
        <Breadcrumbs
          siteUrl={siteUrl}
          structuredData={!preview}
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title, href: publicContentPath('posts', post.slug) },
          ]}
        />

        <header className="mx-auto max-w-[52rem] border-b border-slate-200 pb-6 [overflow-wrap:anywhere]">
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

        <div className="mx-auto mt-8 aspect-[16/9] max-w-[72rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <MediaImage
            media={post.coverImage}
            prefer="hero"
            priority
            sizes="(min-width: 75rem) 1152px, (min-width: 40rem) calc(100vw - 50px), calc(100vw - 34px)"
            fallbackTitle={post.title}
          />
        </div>

        <div className="mx-auto mt-8 max-w-[52rem] rounded-xl border border-slate-200 bg-white p-4 sm:p-10">
          <LexicalContent data={post.content} />
        </div>

        {/* Contact CTA box */}
        <div className="mx-auto mt-8 max-w-[52rem] rounded-xl border border-slate-200 bg-white p-4 sm:p-8">
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
          <div className="site-shell py-12">
            <h2 className="font-display text-2xl font-bold text-[#0C2340]">
              Sản phẩm đề cập trong bài viết
            </h2>
            <div className="catalog-grid mt-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} sizes={catalogCardSizes} />
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="site-shell py-12">
          <h2 className="font-display text-2xl font-bold text-[#0C2340]">
            Bài viết cùng chuyên mục
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((other) => (
              <PostCard key={other.id} post={other} sizes={threeColumnCardSizes} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
