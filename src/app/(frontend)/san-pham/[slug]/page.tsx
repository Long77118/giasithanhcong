import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getPublishedProductBySlug,
  getPublishedSlugRedirect,
  getSiteSettingsCached,
  resolvePublishedCanonicalUrl,
} from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { decodePublicSlugParam, publicContentPath, withPublicSearchParams, type PublicSearchParams } from '@/lib/slug';

import { ProductDetail } from '@/components/ProductDetail';

export const dynamic = 'force-dynamic';

// Deduplicate only within this render (metadata + page). Persistent cache policy is unchanged.
const getProduct = cache(getPublishedProductBySlug);
const getCanonical = cache((slug: string, custom: string | null | undefined) =>
  resolvePublishedCanonicalUrl(getSiteUrl(), publicContentPath('products', slug), custom));
interface ProductDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const product = await getProduct(slug);
  if (!product) return { title: 'Không tìm thấy sản phẩm', robots: { index: false, follow: false } };
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();
  const meta = product.meta;
  const canonical = await getCanonical(product.slug, meta?.canonicalUrl);
  const title = meta?.title || `${product.name} | ${contact.brandName}`;
  const description = meta?.description || product.shortDescription;
  return {
    title, description,
    alternates: { canonical },
    robots: { index: indexingAllowed, follow: indexingAllowed },
    openGraph: {
      type: 'website', url: canonical, title, description,
      images: resolveOpenGraphImages(siteUrl, meta?.image, ...(product.images ?? []).map(({ image }) => image), settings?.defaultOgImage),
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailProps) {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const siteUrl = getSiteUrl();
  const [product, { contact }] = await Promise.all([getProduct(slug), getSiteSettingsCached()]);
  if (!product) {
    const currentSlug = await getPublishedSlugRedirect('products', slug);
    if (currentSlug) permanentRedirect(withPublicSearchParams(publicContentPath('products', currentSlug), await searchParams));
    notFound();
  }
  const canonical = await getCanonical(product.slug, product.meta?.canonicalUrl);
  return <ProductDetail product={product} contact={contact} siteUrl={siteUrl} canonical={canonical} />;
}
