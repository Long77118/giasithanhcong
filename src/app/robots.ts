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
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/',
          '/*?*q=',
          '/*?*category=',
          '/*?*sort=',
          '/*?*page=',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
