import type { MetadataRoute } from 'next';
import { createCanonicalResolver, staticCanonicalPaths, type CanonicalDocument, type StaticCanonicalPath } from '@/lib/canonical';
import { parsePublicContentPath, publicContentPath } from '@/lib/slug';
import { getPublishedSlugRedirect, getSitemapDataCached } from '@/lib/queries';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];
type SitemapSettings = Pick<SitemapEntry, 'changeFrequency' | 'priority'>;

const staticSettings: Record<StaticCanonicalPath, SitemapSettings> = {
  '/': { changeFrequency: 'weekly', priority: 1.0 },
  '/san-pham': { changeFrequency: 'daily', priority: 0.9 },
  '/blog': { changeFrequency: 'weekly', priority: 0.8 },
  '/gioi-thieu': { changeFrequency: 'monthly', priority: 0.6 },
  '/lien-he': { changeFrequency: 'monthly', priority: 0.7 },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const { categories, products, posts } = await getSitemapDataCached();
  const entries: MetadataRoute.Sitemap = staticCanonicalPaths.map((path) => ({
    url: siteUrl + path,
    ...staticSettings[path],
  }));
  const groups = [
    { collection: 'product-categories', documents: categories, changeFrequency: 'weekly', priority: 0.8 },
    { collection: 'products', documents: products, changeFrequency: 'weekly', priority: 0.8 },
    { collection: 'posts', documents: posts, changeFrequency: 'monthly', priority: 0.7 },
  ] as const;

  const published = new Map<string, CanonicalDocument & { entry: SitemapEntry }>();
  for (const { collection, documents, ...settings } of groups) {
    for (const doc of documents) {
      if (!doc.slug) continue;
      const path = publicContentPath(collection, doc.slug);
      published.set(path, {
        path,
        canonicalUrl: doc.meta?.canonicalUrl,
        entry: { url: siteUrl + path, lastModified: doc.updatedAt || undefined, ...settings },
      });
    }
  }

  const aliases = new Map<string, CanonicalDocument | undefined>();
  const resolve = createCanonicalResolver(siteUrl, async (path) => {
    const doc = published.get(path);
    if (doc) return doc;
    if (aliases.has(path)) return aliases.get(path);
    const route = parsePublicContentPath(path);
    if (!route) return undefined;
    const currentSlug = await getPublishedSlugRedirect(route.collection, route.slug);
    const target = currentSlug ? published.get(publicContentPath(route.collection, currentSlug)) : undefined;
    aliases.set(path, target);
    return target;
  });

  for (const doc of published.values()) {
    // The destination supplies its own entry and lastmod.
    if (await resolve(doc) === doc.path) entries.push(doc.entry);
  }
  return entries;
}
