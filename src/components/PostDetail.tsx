import Link from 'next/link';
import type { Post, Product } from '@/payload-types';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getRelatedPublishedPosts } from '@/lib/queries';
import { buildArticleJsonLd } from '@/lib/seo';
import { resolvePublicImageUrl } from '@/lib/seo-images';
import { publicContentPath } from '@/lib/slug';
import { articleReadingMinutes, extractArticleHeadings, formatArticleDate } from '@/lib/article-content';
import { catalogCardSizes, threeColumnCardSizes } from '@/lib/storefront-image-sizes';
import { Breadcrumbs } from './Breadcrumbs';
import { ArticleToc } from './ArticleToc';
import { LexicalContent } from './LexicalContent';
import { MediaImage, resolveMediaUrl } from './MediaImage';
import { PostCard } from './PostCard';
import { ProductCard } from './ProductCard';
import { JsonLd } from './JsonLd';
import './article-body.css';
import './post-detail.css';

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
  const headings = extractArticleHeadings(post.content);
  const hasToc = headings.filter(({ level }) => level === 2).length >= 2;
  const sidebarProducts = relatedProducts.slice(0, 2);
  const hasSidebar = hasToc || sidebarProducts.length > 0 || Boolean(contact.zaloUrl);
  const author = post.authorName?.trim();
  const initial = author ? Array.from(author)[0].toLocaleUpperCase('vi') : '';
  const publishedDate = formatArticleDate(post.publishedAt);
  const updatedDate = Date.parse(post.updatedAt) - Date.parse(post.publishedAt ?? '') > 86_400_000
    ? formatArticleDate(post.updatedAt) : '';

  return (
    <div className="article-page">
      {!preview && <JsonLd data={articleJsonLd} />}
      {!preview && <div className="article-progress" aria-hidden="true" />}

      <article className="site-shell article-shell">
        <Breadcrumbs
          siteUrl={siteUrl}
          structuredData={!preview}
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title, href: publicContentPath('posts', post.slug) },
          ]}
        />

        <header className="article-intro">
          {categoryObj && (
            <Link className="article-category" href={`/blog?category=${encodeURIComponent(categoryObj.slug)}`}>
              {categoryObj.name}
            </Link>
          )}
          <h1>{post.title}</h1>
          {post.excerpt?.trim() && <p className="article-excerpt">{post.excerpt}</p>}
          <div className="article-meta">
            {author && <span className="article-byline"><span className="article-avatar" aria-hidden="true">{initial}</span><strong>{author}</strong></span>}
            {publishedDate && <time dateTime={post.publishedAt}>{publishedDate}</time>}
            <span>{articleReadingMinutes(post.content)} phút đọc</span>
            {updatedDate && <time dateTime={post.updatedAt}>Cập nhật {updatedDate}</time>}
          </div>
        </header>

        {hasToc && <ArticleToc headings={headings} mobile />}

        {coverResolved.url && <div className="article-cover">
          <MediaImage
            media={post.coverImage}
            prefer="hero"
            priority
            sizes="(min-width: 75rem) 1152px, (min-width: 40rem) calc(100vw - 50px), calc(100vw - 34px)"
            fallbackTitle={post.title}
          />
        </div>}

        <div className={hasSidebar ? 'article-grid article-grid--with-aside' : 'article-grid'}>
          <div className="article-main">
            <LexicalContent data={post.content} variant="article" headings={headings} />
          </div>
          {hasSidebar && (
            <aside className="article-aside" aria-label="Thông tin trong bài">
              {hasToc && <ArticleToc headings={headings} />}
              {sidebarProducts.length > 0 && (
                <section className="article-tile article-products">
                  <h2>Sản phẩm trong bài</h2>
                  <ul>
                    {sidebarProducts.map((product) => {
                      const media = product.images?.find(({ image }) => resolveMediaUrl(image, 'thumbnail').url)?.image;
                      return <li key={product.id}>
                        <Link className="article-product" href={publicContentPath('products', product.slug)}>
                          {media && <span className="article-product-image" aria-hidden="true">
                            <MediaImage media={media} prefer="thumbnail" sizes="56px" />
                          </span>}
                          <span className="article-product-copy">
                            <strong>{product.name}</strong>
                            <span>Báo giá <span aria-hidden="true">→</span></span>
                          </span>
                        </Link>
                      </li>;
                    })}
                  </ul>
                </section>
              )}
              {contact.zaloUrl && <section className="article-tile article-zalo">
                <h2>Trao đổi qua Zalo</h2>
                <a className="article-button" href={contact.zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn Zalo tư vấn</a>
              </section>}
            </aside>
          )}
          <div className="article-end">
            {author && <div className="article-tile article-author">
              <span className="article-avatar" aria-hidden="true">{initial}</span>
              <div>
                <p>Biên tập bởi <strong>{author}</strong></p>
                {contact.brandName.trim() && <p>{contact.brandName}</p>}
              </div>
            </div>}
            <section className="article-tile article-quote">
              <h2>Cần báo giá theo số lượng?</h2>
              <Link className="article-button" href="/lien-he#bao-gia">Nhận báo giá</Link>
            </section>
          </div>
        </div>

        {relatedProducts.length > 2 && (
          <section className="article-related article-related-products">
            <h2>Sản phẩm đề cập trong bài viết</h2>
            <div className="catalog-grid">
              {relatedProducts.slice(2).map((product) => (
                <ProductCard key={product.id} product={product} sizes={catalogCardSizes} />
              ))}
            </div>
          </section>
        )}

        {relatedPosts.length > 0 && (
          <section className="article-related">
            <h2>Bài viết cùng chuyên mục</h2>
            <div className="article-related-grid">
              {relatedPosts.map((other) => (
                <PostCard key={other.id} post={other} sizes={threeColumnCardSizes} variant="related" />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
