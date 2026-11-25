import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Newspaper } from 'lucide-react';
import type { Post } from '@/payload-types';
import type { HomeNewsCategoryTone } from '@/lib/home-news';
import { blogListingCover, formatBlogListingDate } from '@/lib/blog-listing';
import { publicContentPath } from '@/lib/slug';
import { resolveMediaUrl } from './MediaImage';

export function PostListingCard({ post, index, count, tone }: {
  post: Post;
  index: number;
  count: number;
  tone?: HomeNewsCategoryTone;
}) {
  const lead = index === 0;
  const { spans: [tabletSpan, desktopSpan, wideSpan], sizes } = blogListingCover(count, index);
  const style = {
    '--listing-post-tablet-span': tabletSpan,
    '--listing-post-desktop-span': desktopSpan,
    '--listing-post-wide-span': wideSpan,
  } as CSSProperties;
  const cover = resolveMediaUrl(post.coverImage, lead ? 'hero' : 'card');
  const category = post.category && typeof post.category === 'object' ? post.category.name : undefined;
  const date = formatBlogListingDate(post.publishedAt);
  const titleId = `post-listing-title-${post.id}`;

  return (
    <article
      className={`listing-card listing-post-card ${lead ? 'listing-post-lead' : 'listing-post-regular'}`}
      style={style}
      data-tablet-span={tabletSpan}
      data-desktop-span={desktopSpan}
      data-wide-span={wideSpan}
    >
      <Link href={publicContentPath('posts', post.slug)} className="listing-card-link" aria-labelledby={titleId}>
        <div className="listing-card-media listing-post-media">
          {cover.url ? (
            <Image
              src={cover.url}
              width={cover.width}
              height={cover.height}
              alt={cover.alt}
              sizes={sizes}
              loading={lead ? 'eager' : 'lazy'}
              fetchPriority={lead ? 'high' : undefined}
            />
          ) : (
            <div className="listing-post-placeholder" aria-hidden="true"><Newspaper size={32} /></div>
          )}
          <span className="listing-post-corner" aria-hidden="true"><ArrowUpRight size={18} /></span>
        </div>
        <div className="listing-card-body listing-post-body">
          {(category || date) && (
            <div className="listing-post-meta">
              {category && <span className="listing-post-category" data-tone={tone}>{category}</span>}
              {date && <time dateTime={post.publishedAt}>{date}</time>}
            </div>
          )}
          <h2 id={titleId} className="listing-card-title">{post.title}</h2>
          {post.excerpt && <p className="listing-post-excerpt">{post.excerpt}</p>}
          <div className="listing-post-footer">
            {post.authorName && <span>{post.authorName}</span>}
            <span className="listing-post-read">Đọc tiếp <ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
