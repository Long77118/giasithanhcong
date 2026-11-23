import React from 'react';
import Link from 'next/link';
import { publicContentPath } from '@/lib/slug';
import { fourColumnCardSizes } from '@/lib/storefront-image-sizes';
import type { Post, PostCategory } from '@/payload-types';
import { MediaImage } from './MediaImage';

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
}: { post: Post; sizes?: string; variant?: 'default' | 'feature' | 'brief' | 'related' }) {
  const postPath = publicContentPath('posts', post.slug);

  if (variant === 'feature' || variant === 'brief') {
    const feature = variant === 'feature';
    return (
      <article className={feature ? 'home-story home-story-feature' : 'home-story home-story-brief'}>
        <Link href={postPath}>
          <div className="home-story-image">
            <MediaImage
              media={post.coverImage}
              prefer={feature ? 'card' : 'thumbnail'}
              sizes={feature ? '(min-width: 80rem) 38vw, 100vw' : '(min-width: 80rem) 26vw, 8rem'}
              fallbackTitle={post.title}
            />
          </div>
          <h3>{post.title}</h3>
        </Link>
      </article>
    );
  }

  const categoryObj =
    post.category && typeof post.category === 'object'
      ? (post.category as PostCategory)
      : null;

  const dateText = formatVietnameseDate(post.publishedAt);

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
