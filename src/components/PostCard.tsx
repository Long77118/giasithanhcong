import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Newspaper } from 'lucide-react';
import { publicContentPath } from '@/lib/slug';
import { fourColumnCardSizes } from '@/lib/storefront-image-sizes';
import type { HomeNewsCategoryTone } from '@/lib/home-news';
import type { Post, PostCategory } from '@/payload-types';
import { MediaImage, resolveMediaUrl } from './MediaImage';

function formatVietnameseDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function PostCard({
  post,
  sizes = fourColumnCardSizes,
  variant = 'default',
  categoryTone,
}: { post: Post; sizes?: string; variant?: 'default' | 'feature' | 'brief' | 'related'; categoryTone?: HomeNewsCategoryTone }) {
  const postPath = publicContentPath('posts', post.slug);

  const categoryObj =
    post.category && typeof post.category === 'object'
      ? (post.category as PostCategory)
      : null;

  const dateText = formatVietnameseDate(post.publishedAt);

  if (variant === 'feature' || variant === 'brief') {
    const feature = variant === 'feature';
    const titleId = `home-story-title-${post.id}`;
    return (
      <article className={feature ? 'home-story home-story-feature' : 'home-story home-story-brief'} data-tone={categoryTone}>
        <Link href={postPath} className="home-story-link" aria-labelledby={titleId}>
          <div className="home-story-image">
            {resolveMediaUrl(post.coverImage).url ? (
              <MediaImage media={post.coverImage} prefer="card" sizes={sizes} />
            ) : (
              <div className="home-story-placeholder" aria-hidden="true">
                <Newspaper />
              </div>
            )}
            <span className="home-story-corner" aria-hidden="true"><ArrowUpRight size={17} /></span>
          </div>
          <div className="home-story-content">
            {(categoryObj?.name || dateText) && (
              <div className="home-story-meta">
                {categoryObj?.name && <span className="home-story-category">{categoryObj.name}</span>}
                {dateText && <time dateTime={post.publishedAt}>{dateText}</time>}
              </div>
            )}
            <h3 id={titleId}>{post.title}</h3>
            {feature && (
              <>
                {post.excerpt && <p className="home-story-excerpt">{post.excerpt}</p>}
                <span className="home-story-read">Đọc tiếp <ArrowRight size={17} aria-hidden="true" /></span>
              </>
            )}
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'related') {
    return (
      <article className="article-post-card">
        <Link href={postPath}>
          {post.coverImage && typeof post.coverImage === 'object' && post.coverImage.url && (
            <div className="article-post-card-image" aria-hidden="true">
              <MediaImage media={post.coverImage} prefer="card" sizes={sizes} />
            </div>
          )}
          <div className="article-post-card-copy">
            {categoryObj && <span className="article-post-card-category">{categoryObj.name}</span>}
            <h3>{post.title}</h3>
            {dateText && <time dateTime={post.publishedAt}>{dateText}</time>}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link
        href={postPath}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100"
      >
        <MediaImage
          media={post.coverImage}
          prefer="card"
          sizes={sizes}
          fallbackTitle={post.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {categoryObj && <span>{categoryObj.name}</span>}
          {categoryObj && dateText && <span aria-hidden="true">·</span>}
          {dateText && <time dateTime={post.publishedAt}>{dateText}</time>}
        </div>

        <h3 className="mb-2 font-display text-lg font-semibold leading-snug [overflow-wrap:anywhere] text-slate-900">
          <Link
            href={postPath}
            className="hover:text-[#0C2340] hover:underline"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="truncate">{post.authorName}</span>
          <Link
            href={postPath}
            className="shrink-0 font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
          >
            Đọc tiếp
          </Link>
        </div>
      </div>
    </article>
  );
}
