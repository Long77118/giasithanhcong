import React from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getPublishedPostBySlug,
  getPublishedSlugRedirect,
  getRelatedPublishedPosts,
  getSiteSettingsCached,
  resolvePublishedCanonicalUrl,
} from '@/lib/queries';
import {
  buildArticleJsonLd,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { decodePublicSlugParam, publicContentPath, withPublicSearchParams, type PublicSearchParams } from '@/lib/slug';

import { PostDetail } from '@/components/PostDetail';

export const dynamic = 'force-dynamic';

interface PostDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}

export async function generateMetadata({
  params,
}: PostDetailProps): Promise<Metadata> {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Không tìm thấy bài viết',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const meta = post.meta;
  const canonical = await resolvePublishedCanonicalUrl(siteUrl, publicContentPath('posts', post.slug), meta?.canonicalUrl);
  const title = meta?.title || `${post.title} | ${contact.brandName}`;
  const description = meta?.description || post.excerpt;

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
      images: resolveOpenGraphImages(siteUrl, meta?.image, post.coverImage, settings?.defaultOgImage),
    },
  };
}

export default async function BlogDetailPage({ params, searchParams }: PostDetailProps) {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const siteUrl = getSiteUrl();

  const [post, { contact }] = await Promise.all([
    getPublishedPostBySlug(slug),
    getSiteSettingsCached(),
  ]);

  if (!post) {
    const currentSlug = await getPublishedSlugRedirect('posts', slug);
    if (currentSlug) {
      permanentRedirect(withPublicSearchParams(publicContentPath('posts', currentSlug), await searchParams));
    }
    notFound();
  }

  return <PostDetail post={post} contact={contact} siteUrl={siteUrl} />;
}
