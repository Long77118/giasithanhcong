import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig, type TextFieldSingleValidation } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor, LinkFeature, RelationshipFeature, UploadFeature } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { vi } from '@payloadcms/translations/languages/vi';
import { r2Storage } from '@payloadcms/storage-r2';

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
import { normalizeCanonicalPath } from './lib/canonical';
import { richTextCollections } from './lib/rich-text';
import { isPublicContentCollection, publicContentPath } from './lib/slug';
import { getRuntimeBindings, createWorkersLogger } from './lib/cloudflare-runtime';

const cloudflare = await getRuntimeBindings();
// The build-time constant removes Sharp's native binaries from the Worker bundle.
const sharp = process.env.CLOUDFLARE_BUILD_TARGET === 'true'
  ? undefined
  : (await import('sharp')).default;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const validateCanonicalUrl: TextFieldSingleValidation = (value, { previousValue }) => {
  if (value == null || value === previousValue || (typeof value === 'string' && !value.trim())) return true;
  return normalizeCanonicalPath(value, getSiteUrl()) !== null
    || 'Nhập đường dẫn bắt đầu bằng / hoặc URL cùng tên miền, không kèm tham số hay #.';
};

export default buildConfig({
  ...(cloudflare ? { serverURL: getSiteUrl(), csrf: [getSiteUrl()], cors: [getSiteUrl()] } : {}),
  logger: cloudflare ? createWorkersLogger() : undefined,
  onInit: async (payload) => {
    if (!cloudflare) return;
    const admins = await payload.count({ collection: 'users', where: { role: { equals: 'admin' } }, overrideAccess: true });
    if (!admins.totalDocs) {
      throw new Error('Initialize or import an Admin through a local Node process before deploying the public Worker.');
    }
  },
  i18n: {
    fallbackLanguage: 'vi',
    supportedLanguages: { vi },
  },
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' – Quản trị website',
      icons: [{ url: '/admin-assets/mark.png', type: 'image/png' }],
    },
    dateFormat: 'dd/MM/yyyy HH:mm',
    components: {
      graphics: {
        Icon: '/admin/Brand#WorkspaceIcon',
        Logo: '/admin/Brand#WorkspaceLogo',
      },
      beforeNavLinks: ['/admin/Brand#WorkspaceNavigation'],
      beforeLogin: ['/admin/Brand#LoginIntroduction'],
      afterLogin: ['/admin/Brand#LoginFooter'],
      views: {
        dashboard: { Component: '/admin/Dashboard' },
      },
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
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((feature) => !['link', 'relationship', 'upload'].includes(feature.key)),
      LinkFeature({ enabledCollections: [...richTextCollections] }),
      RelationshipFeature({ enabledCollections: [...richTextCollections] }),
      UploadFeature({ enabledCollections: ['media'] }),
    ],
  }),
  secret: cloudflare?.PAYLOAD_SECRET || getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Keep the generated schema aligned with the category deletion policy and its migration.
    beforeSchemaInit: [({ adapter, schema }) => {
      for (const [table, field] of [
        ['products', 'category'],
        ['posts', 'category'],
        ['product_categories', 'parent'],
      ]) {
        const reference = adapter.rawTables[table]?.columns[field]?.reference;
        if (!reference) throw new Error(`Missing category foreign key: ${table}.${field}`);
        reference.onDelete = 'restrict';
      }
      return schema;
    }],
    pool: getPostgresPoolConfig({ hyperdrive: cloudflare?.HYPERDRIVE }),
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    ...(cloudflare ? [r2Storage({ bucket: cloudflare.MEDIA_BUCKET, collections: { media: true } })] : []),
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
        return slug && isPublicContentCollection(collectionSlug)
          ? `${siteUrl}${publicContentPath(collectionSlug, slug)}`
          : siteUrl;
      },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'canonicalUrl',
          label: 'Canonical URL tùy chỉnh (tùy chọn)',
          type: 'text',
          validate: validateCanonicalUrl,
          admin: {
            description:
              'Ví dụ /san-pham/ly-nhua-pet. Dùng đường dẫn của một trang công khai trên website. Để trống để dùng URL hiện tại.',
          },
        },
      ],
    }),
  ],
});
