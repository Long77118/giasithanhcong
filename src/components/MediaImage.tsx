import React from 'react';
import Image from 'next/image';
import type { Media } from '@/payload-types';

type SizePreference = 'thumbnail' | 'card' | 'hero' | 'original';

export function resolveMediaUrl(
  media: Media | number | null | undefined,
  prefer: SizePreference = 'card',
): { url: string | null; width: number; height: number; alt: string } {
  if (!media || typeof media !== 'object') {
    return { url: null, width: 800, height: 600, alt: 'Hình ảnh sản phẩm bao bì' };
  }

  const alt = media.alt || 'Hình ảnh sản phẩm bao bì';

  if (prefer !== 'original' && media.sizes && media.sizes[prefer]?.url) {
    const sized = media.sizes[prefer]!;
    return {
      url: sized.url ?? media.url ?? null,
      width: sized.width ?? media.width ?? 800,
      height: sized.height ?? media.height ?? 600,
      alt,
    };
  }

  return {
    url: media.url ?? null,
    width: media.width ?? 800,
    height: media.height ?? 600,
    alt,
  };
}

interface MediaImageProps {
  media: Media | number | null | undefined;
  prefer?: SizePreference;
  fallbackTitle?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function MediaImage({
  media,
  prefer = 'card',
  fallbackTitle = 'Bao Bì An Phát',
  className = 'h-full w-full object-cover',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: MediaImageProps) {
  const resolved = resolveMediaUrl(media, prefer);

  if (!resolved.url) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 text-center text-slate-500"
        role="img"
        aria-label={fallbackTitle}
      >
        <svg
          className="mb-2 h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
        <span className="text-xs font-medium text-slate-600">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <Image
      src={resolved.url}
      alt={resolved.alt}
      width={resolved.width}
      height={resolved.height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
