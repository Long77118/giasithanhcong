import type { MetadataRoute } from 'next';
import { getSitemapDataCached } from '@/lib/queries';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const { categories, products, posts } = await getSitemapDataCached();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/san-pham`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gioi-thieu`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/lien-he`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.status === 'published' && c.slug)
    .map((cat) => ({
      url: `${siteUrl}/danh-muc/${cat.slug}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.status === 'published' && p.slug)
    .map((prod) => ({
      url: `${siteUrl}/san-pham/${prod.slug}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const postEntries: MetadataRoute.Sitemap = posts
    .filter((p) => p.status === 'published' && p.slug)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...postEntries,
  ];
}
