import React from 'react';
import Link from 'next/link';
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

export function PostCard({ post }: { post: Post }) {
  const categoryObj =
    post.category && typeof post.category === 'object'
      ? (post.category as PostCategory)
      : null;

  const dateText = formatVietnameseDate(post.publishedAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link
        href={`/blog/${post.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100"
      >
        <MediaImage
          media={post.coverImage}
          prefer="card"
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

        <h3 className="mb-2 font-display text-lg font-semibold leading-snug text-slate-900">
          <Link
            href={`/blog/${post.slug}`}
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
            href={`/blog/${post.slug}`}
            className="shrink-0 font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
          >
            Đọc tiếp
          </Link>
        </div>
      </div>
    </article>
  );
}
