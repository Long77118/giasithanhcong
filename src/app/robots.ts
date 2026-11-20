import type { MetadataRoute } from 'next';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();

  if (!indexingAllowed) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        // Media is public even though its original files share the API prefix.
        allow: ['/', '/api/media/file/', '/_next/image'],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/',
          // Public parameter URLs must be crawlable to expose their noindex/canonical.
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
