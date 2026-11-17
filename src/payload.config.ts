import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { ProductCategories } from './collections/ProductCategories';
import { Products } from './collections/Products';
import { PostCategories } from './collections/PostCategories';
import { Posts } from './collections/Posts';
import { QuoteRequests } from './collections/QuoteRequests';
import { SiteSettings } from './globals/SiteSettings';
import { getPostgresPoolConfig } from './lib/db-config';
import { getPayloadSecret } from './lib/env';
import { getSiteUrl } from './lib/seo';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' – Quản trị Bao Bì An Phát',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Products,
    ProductCategories,
    Posts,
    PostCategories,
    QuoteRequests,
    Media,
    Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: getPostgresPoolConfig(),
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ['products', 'product-categories', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => {
        const record = doc as Record<string, unknown> | undefined;
        const name =
          (typeof record?.name === 'string' && record.name) ||
          (typeof record?.title === 'string' && record.title) ||
          'Bao Bì An Phát';
        return `${name} | Bao Bì An Phát`;
      },
      generateDescription: ({ doc }) => {
        const record = doc as Record<string, unknown> | undefined;
        if (typeof record?.shortDescription === 'string' && record.shortDescription) {
          return record.shortDescription;
        }
        if (typeof record?.excerpt === 'string' && record.excerpt) {
          return record.excerpt;
        }
        if (typeof record?.description === 'string' && record.description) {
          return record.description;
        }
        return 'Cung cấp sỉ bao bì thực phẩm, ly nhựa, chai PET, hộp mang đi và bao bì giấy.';
      },
      generateURL: ({ doc, collectionSlug }) => {
        const siteUrl = getSiteUrl();
        const record = doc as Record<string, unknown> | undefined;
        const slug = typeof record?.slug === 'string' ? record.slug : '';
        if (!slug) return siteUrl;
        if (collectionSlug === 'products') return `${siteUrl}/san-pham/${slug}`;
        if (collectionSlug === 'product-categories') return `${siteUrl}/danh-muc/${slug}`;
        if (collectionSlug === 'posts') return `${siteUrl}/blog/${slug}`;
        return siteUrl;
      },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'canonicalUrl',
          label: 'Canonical URL tùy chỉnh (tùy chọn)',
          type: 'text',
          admin: {
            description:
              'Để trống để tự động sinh canonical chuẩn theo APP_URL và slug.',
          },
        },
      ],
    }),
  ],
});
