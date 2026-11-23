import { getYouTubeID, youTubeEmbedUrl, youTubeThumbnailUrl } from './youtube';
import { resolvePublicImageUrl } from './seo-images';
import type { ResolvedContactConfig } from './contact';
import { getHeaderContact } from './header';

export interface SeoEnv {
  APP_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ALLOW_INDEXING?: string;
  NODE_ENV?: string;
  DEPLOYMENT_STAGE?: string;
}

export function getSiteUrl(env: SeoEnv = process.env): string {
  const raw = env.APP_URL || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function organizationJsonLdId(siteUrl: string) {
  return `${siteUrl}/#organization`;
}

export function buildOrganizationJsonLd(siteUrl: string, contact: ResolvedContactConfig) {
  const { phones, email } = getHeaderContact(contact);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationJsonLdId(siteUrl),
    name: contact.brandName,
    url: siteUrl,
    description: contact.tagline,
    ...(phones.length ? { telephone: phones.map(phone => phone.label) } : {}),
    ...(email ? { email } : {}),
    ...(contact.address ? { address: contact.address } : {}),
  };
}

/**
 * Staging / preview / local environments are blocked from search indexing by default.
 * Only allows indexing when ALLOW_INDEXING === 'true' and host is not a preview/local domain.
 */
export function isIndexingAllowed(env: SeoEnv = process.env): boolean {
  if (env.DEPLOYMENT_STAGE === 'staging') return false;
  if (env.ALLOW_INDEXING !== 'true') {
    return false;
  }
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') return false;
  let hostname: string;
  try {
    const url = new URL(getSiteUrl(env));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return false;
  }
  if (
    hostname === 'localhost' || hostname.endsWith('.localhost') ||
    /^127\./.test(hostname) || hostname === '0.0.0.0' || hostname === '[::1]' ||
    hostname.includes('ais-dev-') ||
    hostname.includes('ais-pre-')
    || hostname.endsWith('.workers.dev')
  ) {
    return false;
  }
  return true;
}

export interface CatalogSeoInput {
  basePath: string;
  page?: number;
  query?: string;
  categorySlug?: string;
  sort?: string;
  siteUrl: string;
  indexingAllowed: boolean;
}

export interface CatalogSeoDecision {
  canonical: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  isFilteredOrSearch: boolean;
  isPaginatedSubpage: boolean;
}

/**
 * Deterministic SEO policy for search, filter, and pagination URLs:
 * 1. Search (?q=), filter (?category=) or sort URLs: noindex, follow; canonical points to clean basePath.
 * 2. Page >= 2 without search/filter: noindex, follow; canonical points to self (?page=N) to preserve pagination crawl path without index bloat.
 * 3. Clean page 1: follows site-wide indexingAllowed; canonical points to basePath without ?page=1.
 */
export function buildCatalogSeoDecision(
  input: CatalogSeoInput,
): CatalogSeoDecision {
  const cleanBase = input.basePath.startsWith('/')
    ? input.basePath
    : `/${input.basePath}`;
  const page = input.page && input.page > 1 ? Math.floor(input.page) : 1;
  const hasQuery = Boolean(input.query && input.query.trim().length > 0);
  const hasCategory = Boolean(
    input.categorySlug && input.categorySlug.trim().length > 0,
  );
  const hasSort = Boolean(input.sort && input.sort.trim().length > 0);
  const isFilteredOrSearch = hasQuery || hasCategory || hasSort;
  const isPaginatedSubpage = page > 1 && !isFilteredOrSearch;

  if (isFilteredOrSearch) {
    return {
      canonical: `${input.siteUrl}${cleanBase}`,
      robotsIndex: false,
      robotsFollow: input.indexingAllowed,
      isFilteredOrSearch: true,
      isPaginatedSubpage: false,
    };
  }

  if (isPaginatedSubpage) {
    return {
      canonical: `${input.siteUrl}${cleanBase}?page=${page}`,
      robotsIndex: false,
      robotsFollow: input.indexingAllowed,
      isFilteredOrSearch: false,
      isPaginatedSubpage: true,
    };
  }

  return {
    canonical: `${input.siteUrl}${cleanBase}`,
    robotsIndex: input.indexingAllowed,
    robotsFollow: input.indexingAllowed,
    isFilteredOrSearch: false,
    isPaginatedSubpage: false,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ProductJsonLdInput {
  name: string;
  sku: string;
  description: string;
  url: string;
  brandName?: string | null;
  categoryName?: string;
  images: string[];
}

export function buildProductJsonLd(input: ProductJsonLdInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    sku: input.sku,
    description: input.description,
    url: input.url,
  };

  const brandName = input.brandName?.trim();
  if (brandName) {
    schema.brand = {
      '@type': 'Brand',
      name: brandName,
    };
  }

  if (input.images.length > 0) {
    schema.image = input.images;
  }
  if (input.categoryName) {
    schema.category = input.categoryName;
  }

  // This catalog accepts quote requests; it does not publish prices or offers.
  return schema;
}

export interface VideoJsonLdInput {
  youtubeUrl: string;
  title: string;
  description: string;
  pageUrl: string;
  thumbnailUrl?: string | null;
}

export function buildVideoJsonLd(input: VideoJsonLdInput) {
  const id = getYouTubeID(input.youtubeUrl);
  const name = input.title.trim();
  const description = input.description.trim();
  if (!id || !name || !description) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${input.pageUrl}#video-${id}`,
    name,
    description,
    thumbnailUrl: resolvePublicImageUrl(input.pageUrl, input.thumbnailUrl) || youTubeThumbnailUrl(id),
    embedUrl: youTubeEmbedUrl(id),
    url: `https://www.youtube.com/watch?v=${id}`,
    // An upload date is not collected: do not invent one from the product's publication date.
  };
}

export interface ArticleJsonLdInput {
  headline: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName: string;
  publisherName: string;
}

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    author: {
      '@type': 'Person',
      name: input.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: input.publisherName,
    },
  };

  if (input.image) {
    schema.image = [input.image];
  }
  if (input.datePublished) {
    schema.datePublished = input.datePublished;
  }
  if (input.dateModified) {
    schema.dateModified = input.dateModified;
  }

  return schema;
}
