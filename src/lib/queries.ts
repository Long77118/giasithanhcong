import { unstable_cache as nextCache } from 'next/cache';
import { sql } from '@payloadcms/db-postgres';
import { getPayload, type Payload, type Where, type TypedUser, type PopulateType } from 'payload';
import config from '@payload-config';
import type {
  Post,
  PostCategory,
  Product,
  ProductCategory,
  SiteSetting,
} from '@/payload-types';
import { resolveContactConfig, type ResolvedContactConfig } from './contact';
import { categorySubtreeIDs } from './category-tree';
import { getSqlExecutor } from './db-transaction';
import { createCanonicalResolver, type CanonicalDocument } from './canonical';
import { parsePublicContentPath, publicContentPath, type PublicContentCollection } from './slug';
import { isCloudflareTarget } from './deployment';
import { canPreview } from './preview';

// Trial Workers always read current CMS data. Node retains its tag-invalidated cache.
// A production shared cache can be added after choosing cache storage and revalidation bindings.
const unstable_cache: typeof nextCache = (fn, keys, options) =>
  isCloudflareTarget() ? fn : nextCache(fn, keys, options);

const publicContentTables = {
  products: 'products',
  'product-categories': 'product_categories',
  posts: 'posts',
} as const;

async function getClient() {
  return getPayload({ config });
}

export async function getPublishedSlugRedirect(
  collection: PublicContentCollection,
  slug: string,
): Promise<string | null> {
  const payload = await getClient();
  const db = getSqlExecutor('drizzle' in payload.db ? payload.db.drizzle : undefined);
  const { rows: [target] } = await db.execute<{ slug: string }>(sql`
    SELECT target.slug
    FROM public.content_slug_history AS history
    JOIN public.${sql.identifier(publicContentTables[collection])} AS target ON target.id = history.document_id
    WHERE history.namespace = ${collection}
      AND history.slug = ${slug}
      AND target.slug <> history.slug
      AND target.status = 'published'
  `);
  return target?.slug ?? null;
}

async function findPublishedCanonicalDocument(path: string): Promise<CanonicalDocument | undefined> {
  const route = parsePublicContentPath(path);
  if (!route) return undefined;
  const { collection, slug } = route;
  const payload = await getClient();
  const find = async (targetSlug: string) => {
    const { docs: [doc] } = await payload.find({
      collection,
      where: { slug: { equals: targetSlug }, status: { equals: 'published' } },
      limit: 1,
      pagination: false,
      depth: 0,
      select: { slug: true, meta: { canonicalUrl: true } },
      overrideAccess: false,
    });
    return doc;
  };
  let doc = await find(slug);
  if (!doc) {
    const redirectedSlug = await getPublishedSlugRedirect(collection, slug);
    if (redirectedSlug) doc = await find(redirectedSlug);
  }
  return doc && {
    path: publicContentPath(collection, doc.slug),
    canonicalUrl: doc.meta?.canonicalUrl,
  };
}

export async function resolvePublishedCanonicalUrl(
  siteUrl: string,
  path: string,
  canonicalUrl: string | null | undefined,
): Promise<string> {
  const resolve = createCanonicalResolver(siteUrl, findPublishedCanonicalDocument);
  return siteUrl + await resolve({ path, canonicalUrl });
}

export const getSiteSettingsCached = unstable_cache(
  async (): Promise<{ settings: SiteSetting | null; contact: ResolvedContactConfig }> => {
    const payload = await getClient();
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 2,
      overrideAccess: false,
    });
    return {
      settings,
      contact: resolveContactConfig({
        brandName: settings?.brandName,
        tagline: settings?.tagline,
        hotline: settings?.hotline,
        zaloUrl: settings?.zaloUrl,
        email: settings?.email,
        address: settings?.address,
        workingHours: settings?.workingHours,
        sampleNotice: settings?.sampleNotice,
      }),
    };
  },
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 300 },
);

export const getPublishedCategoriesCached = unstable_cache(
  async (): Promise<ProductCategory[]> => {
    const payload = await getClient();
    const categories: ProductCategory[] = [];
    let page = 1;
    while (true) {
      const res = await payload.find({
        collection: 'product-categories',
        where: { status: { equals: 'published' } },
        sort: ['displayOrder', 'name', 'id'],
        limit: 200,
        page,
        depth: 1,
        overrideAccess: false,
      });
      categories.push(...res.docs);
      if (!res.hasNextPage) break;
      page++;
    }
    return categories;
  },
  ['published-categories'],
  { tags: ['catalog', 'categories'], revalidate: 300 },
);

export async function getCategoryBySlug(
  slug: string,
): Promise<ProductCategory | null> {
  const payload = await getClient();
  const res = await payload.find({
    collection: 'product-categories',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  });
  return res.docs[0] ?? null;
}

export const getFeaturedProductsCached = unstable_cache(
  async (limit = 6): Promise<Product[]> => {
    const payload = await getClient();
    const res = await payload.find({
      collection: 'products',
      where: {
        and: [
          { status: { equals: 'published' } },
          { featured: { equals: true } },
        ],
      },
      sort: '-updatedAt',
      limit,
      depth: 2,
      overrideAccess: false,
    });
    if (res.docs.length >= limit) {
      return res.docs;
    }
    const fallback = await payload.find({
      collection: 'products',
      where: {
        status: { equals: 'published' },
      },
      sort: '-updatedAt',
      limit,
      depth: 2,
      overrideAccess: false,
    });
    return fallback.docs;
  },
  ['featured-products'],
  { tags: ['catalog', 'products'], revalidate: 300 },
);

export interface ProductCatalogFilter {
  q?: string;
  categorySlug?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function getProductsCatalog(filter: ProductCatalogFilter) {
  const payload = await getClient();
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 9;

  const conditions: Where[] = [{ status: { equals: 'published' } }];

  let activeCategory: ProductCategory | null = null;
  if (filter.categorySlug && filter.categorySlug.trim().length > 0) {
    activeCategory = await getCategoryBySlug(filter.categorySlug.trim());
    if (!activeCategory) {
      return {
        docs: [] as Product[],
        totalDocs: 0,
        totalPages: 0,
        page,
        hasNextPage: false,
        hasPrevPage: false,
        activeCategory: null,
      };
    }

    const categories = await getPublishedCategoriesCached();
    const catIds = categorySubtreeIDs(activeCategory.id, categories);
    // The active category may have just been published before a cache refresh.
    if (!catIds.includes(activeCategory.id)) catIds.push(activeCategory.id);
    conditions.push({ category: { in: catIds } });
  }

  if (filter.q && filter.q.trim().length > 0) {
    const keyword = filter.q.trim();
    conditions.push({
      or: [
        { name: { like: keyword } },
        { sku: { like: keyword } },
        { shortDescription: { like: keyword } },
        { packagingSpec: { like: keyword } },
      ],
    });
  }

  let sort = ['-createdAt', '-id'];
  if (filter.sort === 'name-asc') sort = ['name', 'id'];
  if (filter.sort === 'moq-asc') sort = ['minOrderQty', 'id'];

  const result = await payload.find({
    collection: 'products',
    where: { and: conditions },
    sort,
    page,
    limit,
    depth: 2,
    overrideAccess: false,
  });

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? page,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    activeCategory,
  };
}

export const getHomeShortcutProductCountCached = unstable_cache(
  async (filter: Pick<ProductCatalogFilter, 'q' | 'categorySlug'>) => {
    const result = await getProductsCatalog({ ...filter, limit: 1 });
    return result.totalDocs;
  },
  ['home-shortcut-product-count'],
  { tags: ['catalog', 'products', 'categories'], revalidate: 300 },
);

// The public page and authenticated preview hydrate exactly the same related card fields.
const productDetailPopulate = {
  products: { name: true, slug: true, sku: true, status: true, images: true, category: true, shortDescription: true, minOrderQty: true, minOrderUnit: true },
  posts: { title: true, slug: true, status: true, coverImage: true, excerpt: true, publishedAt: true, authorName: true, category: true },
} satisfies PopulateType;

export async function getProductForPreview(id: number, user: TypedUser): Promise<Product | null> {
  if (!canPreview(user)) return null;
  const payload = await getClient();
  return payload.findByID({
    collection: 'products', id, user, overrideAccess: false, disableErrors: true,
    depth: 2, populate: productDetailPopulate,
  });
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getClient();
  const res = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
    // Only the fields needed for related cards; do not recursively hydrate their detail content.
    populate: productDetailPopulate,
    overrideAccess: false,
  });
  return res.docs[0] ?? null;
}

export async function getRelatedPublishedProducts(categoryId: number, currentProductId: number): Promise<Product[]> {
  const payload = await getClient();
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' }, category: { equals: categoryId }, id: { not_equals: currentProductId } },
    sort: ['-updatedAt', '-id'],
    limit: 4,
    pagination: false,
    depth: 1,
    select: { name: true, slug: true, sku: true, status: true, images: true, category: true, shortDescription: true, minOrderQty: true, minOrderUnit: true, packagingSpec: true, updatedAt: true, createdAt: true },
    overrideAccess: false,
  });
  return docs;
}

export const getPublishedPostCategoriesCached = unstable_cache(
  async (): Promise<PostCategory[]> => {
    const payload = await getClient();
    const res = await payload.find({
      collection: 'post-categories',
      where: { status: { equals: 'published' } },
      sort: 'name',
      limit: 30,
      overrideAccess: false,
    });
    return res.docs;
  },
  ['published-post-categories'],
  { tags: ['blog'], revalidate: 300 },
);

export interface BlogFilter {
  categorySlug?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getPublishedPosts(filter: BlogFilter = {}) {
  const payload = await getClient();
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 6;

  const conditions: Where[] = [{ status: { equals: 'published' } }];
  let activeCategory: PostCategory | null = null;

  if (filter.categorySlug && filter.categorySlug.trim().length > 0) {
    const catRes = await payload.find({
      collection: 'post-categories',
      where: {
        and: [
          { slug: { equals: filter.categorySlug.trim() } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
      overrideAccess: false,
    });
    activeCategory = catRes.docs[0] ?? null;
    if (!activeCategory) {
      return {
        docs: [] as Post[],
        totalDocs: 0,
        totalPages: 0,
        page,
        hasNextPage: false,
        hasPrevPage: false,
        activeCategory: null,
      };
    }
    conditions.push({ category: { equals: activeCategory.id } });
  }

  if (filter.q && filter.q.trim().length > 0) {
    const keyword = filter.q.trim();
    conditions.push({
      or: [{ title: { like: keyword } }, { excerpt: { like: keyword } }],
    });
  }

  const res = await payload.find({
    collection: 'posts',
    where: { and: conditions },
    sort: ['-publishedAt', '-id'],
    page,
    limit,
    depth: 2,
    overrideAccess: false,
  });

  return {
    docs: res.docs,
    totalDocs: res.totalDocs,
    totalPages: res.totalPages,
    page: res.page ?? page,
    hasNextPage: res.hasNextPage,
    hasPrevPage: res.hasPrevPage,
    activeCategory,
  };
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getClient();
  const res = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  });
  return res.docs[0] ?? null;
}

export async function getPostForPreview(id: number, user: TypedUser): Promise<Post | null> {
  if (!canPreview(user)) return null;
  const payload = await getClient();
  return payload.findByID({
    collection: 'posts', id, user, overrideAccess: false, disableErrors: true, depth: 2,
  });
}

export async function getRelatedPublishedPosts(categoryId: number, currentPostId: number): Promise<Post[]> {
  const payload = await getClient();
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
      category: { equals: categoryId },
      id: { not_equals: currentPostId },
    },
    sort: ['-publishedAt', '-id'],
    limit: 3,
    pagination: false,
    depth: 1,
    overrideAccess: false,
  });
  return docs;
}

const sitemapBatchSize = 200;
type SitemapDocument = Pick<Product, 'slug' | 'updatedAt'> & {
  meta?: Pick<NonNullable<Product['meta']>, 'canonicalUrl'>;
};

async function getPublishedSitemapDocuments(payload: Payload, collection: PublicContentCollection) {
  const documents: SitemapDocument[] = [];
  let lastID: number | undefined;

  while (true) {
    const { docs } = await payload.find({
      collection,
      where: {
        status: { equals: 'published' },
        ...(lastID === undefined ? {} : { id: { greater_than: lastID } }),
      },
      // Scan by immutable IDs so earlier deletions do not shift subsequent batches.
      sort: 'id',
      limit: sitemapBatchSize,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true, meta: { canonicalUrl: true } },
      overrideAccess: false,
    });
    documents.push(...docs);
    lastID = docs.at(-1)?.id;
    if (docs.length < sitemapBatchSize || lastID === undefined) return documents;
  }
}

export const getSitemapDataCached = unstable_cache(
  async () => {
    const payload = await getClient();
    const [categories, products, posts] = await Promise.all([
      getPublishedSitemapDocuments(payload, 'product-categories'),
      getPublishedSitemapDocuments(payload, 'products'),
      getPublishedSitemapDocuments(payload, 'posts'),
    ]);

    return { categories, products, posts };
  },
  ['sitemap-documents-with-canonical'],
  { tags: ['sitemap', 'catalog', 'blog'], revalidate: 300 },
);
