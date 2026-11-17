import { unstable_cache } from 'next/cache';
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import type {
  Post,
  PostCategory,
  Product,
  ProductCategory,
  SiteSetting,
} from '@/payload-types';
import { resolveContactConfig, type ResolvedContactConfig } from './contact';

async function getClient() {
  return getPayload({ config });
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
    const res = await payload.find({
      collection: 'product-categories',
      where: {
        status: { equals: 'published' },
      },
      sort: 'displayOrder',
      limit: 50,
      depth: 2,
      overrideAccess: false,
    });
    return res.docs;
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

    const childCats = await payload.find({
      collection: 'product-categories',
      where: {
        and: [
          { parent: { equals: activeCategory.id } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 50,
      overrideAccess: false,
    });
    const catIds = [activeCategory.id, ...childCats.docs.map((c) => c.id)];
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

  let sort = '-createdAt';
  if (filter.sort === 'name-asc') sort = 'name';
  if (filter.sort === 'moq-asc') sort = 'minOrderQty';

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
    overrideAccess: false,
  });
  return res.docs[0] ?? null;
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
    sort: '-publishedAt',
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

export const getSitemapDataCached = unstable_cache(
  async () => {
    const payload = await getClient();
    const [categories, products, posts] = await Promise.all([
      payload.find({
        collection: 'product-categories',
        where: { status: { equals: 'published' } },
        limit: 200,
        depth: 0,
        overrideAccess: false,
      }),
      payload.find({
        collection: 'products',
        where: { status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        overrideAccess: false,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        overrideAccess: false,
      }),
    ]);

    return {
      categories: categories.docs,
      products: products.docs,
      posts: posts.docs,
    };
  },
  ['sitemap-data'],
  { tags: ['sitemap', 'catalog', 'blog'], revalidate: 300 },
);
