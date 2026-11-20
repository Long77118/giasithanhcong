import 'dotenv/config';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import config from '../payload.config';
import { buildLexicalDocument } from '../lib/lexical';
import {
  SEED_CATEGORIES,
  SEED_POSTS,
  SEED_POST_CATEGORIES,
  SEED_PRODUCTS,
} from './data';

type ImageKey = 'hero' | 'cups' | 'containers' | 'bottles' | 'bags' | 'blog';

const IMAGE_ASSETS: Record<
  ImageKey,
  { file: string; alt: string; caption: string }
> = {
  hero: {
    file: 'hero_packaging_warehouse_1794920748777.jpg',
    alt: 'Kệ trưng bày tổng hợp ly nhựa PET, hộp thực phẩm và bao bì giấy bán sỉ (ảnh minh họa)',
    caption: 'Ảnh minh họa danh mục bao bì tổng hợp',
  },
  cups: {
    file: 'cat_cups_disposable_1794920748775.jpg',
    alt: 'Ly nhựa PET nắp cầu, nắp bằng và ly giấy kraft 2 lớp dùng một lần (ảnh minh họa)',
    caption: 'Ảnh minh họa dòng ly nhựa & ly giấy',
  },
  containers: {
    file: 'cat_food_containers_1794920749540.jpg',
    alt: 'Hộp nhựa PP chữ nhật, khay cơm bento 4 ngăn và tô giấy kraft nắp trong (ảnh minh họa)',
    caption: 'Ảnh minh họa dòng hộp & khay thực phẩm',
  },
  bottles: {
    file: 'cat_bottles_jars_1794920749791.jpg',
    alt: 'Chai nhựa PET nắp đen niêm phong và hũ nhựa PET nắp nhôm bạc (ảnh minh họa)',
    caption: 'Ảnh minh họa dòng chai & hũ nhựa PET',
  },
  bags: {
    file: 'cat_bags_paper_1794920750222.jpg',
    alt: 'Túi giấy kraft có quai xoắn, giấy gói chống dầu và túi nhựa HDPE (ảnh minh họa)',
    caption: 'Ảnh minh họa dòng túi đóng gói & bao bì giấy',
  },
  blog: {
    file: 'blog_packaging_guide_1794920751073.jpg',
    alt: 'Quầy pha chế sử dụng hộp giấy kraft và ly giấy đóng gói mang đi (ảnh minh họa)',
    caption: 'Ảnh minh họa ứng dụng bao bì tại cửa hàng F&B',
  },
};

async function ensureMedia(payload: Payload): Promise<Record<ImageKey, number>> {
  const result = {} as Record<ImageKey, number>;

  for (const [key, asset] of Object.entries(IMAGE_ASSETS) as Array<
    [ImageKey, (typeof IMAGE_ASSETS)[ImageKey]]
  >) {
    const existing = await payload.find({
      collection: 'media',
      where: { alt: { equals: asset.alt } },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs[0]) {
      result[key] = existing.docs[0].id;
      continue;
    }

    const absPath = path.resolve(process.cwd(), 'src/assets/images', asset.file);
    const created = await payload.create({
      collection: 'media',
      overrideAccess: true,
      filePath: absPath,
      data: {
        alt: asset.alt,
        caption: asset.caption,
      },
    });
    result[key] = created.id;
  }

  return result;
}

export async function runSeed() {
  const payload = await getPayload({ config });

  console.log('1/5 Uploading or reusing illustrative media assets...');
  const mediaIds = await ensureMedia(payload);

  console.log('2/5 Updating SiteSettings global...');
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      brandName: 'Bao Bì An Phát',
      tagline:
        'Nhà phân phối sỉ ly nhựa, chai PET, hũ thực phẩm, hộp mang đi, túi đóng gói và bao bì giấy dùng một lần.',
      hotline: '0900 000 123',
      zaloUrl: 'https://zalo.me/0900000123',
      email: 'baogia@baobianphat-demo.example',
      workingHours: 'Thứ 2 – Thứ 7: 08:00 – 17:30',
      address: 'Kho mẫu minh họa – Khu công nghiệp Tân Bình, TP. Hồ Chí Minh',
      sampleNotice:
        'Lưu ý: Toàn bộ sản phẩm, bài viết, thông tin liên hệ và số liệu trên website này là dữ liệu minh họa phục vụ kiểm thử nền tảng.',
      defaultSeoTitle: 'Bao Bì An Phát – Tổng Kho Sỉ Ly, Hộp Nhựa & Bao Bì Giấy',
      defaultSeoDescription:
        'Cung cấp sỉ ly nhựa PET/PP, chai lọ, hũ thực phẩm, hộp cơm mang đi, túi đóng gói và bao bì giấy dùng một lần (dữ liệu minh họa).',
      defaultOgImage: mediaIds.hero,
    },
  });

  console.log('3/5 Seeding 4 ProductCategories...');
  const categoryIdBySlug = new Map<string, number>();
  for (const cat of SEED_CATEGORIES) {
    const existing = await payload.find({
      collection: 'product-categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
      overrideAccess: true,
    });
    const docData = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: mediaIds[cat.imageKey],
      displayOrder: cat.displayOrder,
      status: 'published' as const,
      meta: {
        title: cat.seoTitle,
        description: cat.seoDescription,
        image: mediaIds[cat.imageKey],
      },
    };
    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'product-categories',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: docData,
      });
      categoryIdBySlug.set(cat.slug, updated.id);
    } else {
      const created = await payload.create({
        collection: 'product-categories',
        overrideAccess: true,
        data: docData,
      });
      categoryIdBySlug.set(cat.slug, created.id);
    }
  }

  console.log('4/5 Seeding 12 published Products (+ 1 draft test record)...');
  const productIdBySlug = new Map<string, number>();
  for (const prod of SEED_PRODUCTS) {
    const categoryId = categoryIdBySlug.get(prod.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing seeded category for ${prod.categorySlug}`);
    }

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: prod.slug } },
      limit: 1,
      overrideAccess: true,
    });

    const docData = {
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku,
      category: categoryId,
      shortDescription: prod.shortDescription,
      description: buildLexicalDocument(prod.blocks),
      images: [
        {
          image: mediaIds[prod.imageKey],
          caption: `${prod.name} – góc chụp tổng thể (minh họa)`,
        },
        {
          image: mediaIds.hero,
          caption: 'Minh họa trưng bày tại kho sỉ',
        },
      ],
      specs: prod.specs,
      packagingSpec: prod.packagingSpec,
      minOrderQty: prod.minOrderQty,
      minOrderUnit: prod.minOrderUnit,
      featured: prod.featured,
      status: prod.status,
      meta: {
        title: prod.seoTitle,
        description: prod.seoDescription,
        image: mediaIds[prod.imageKey],
      },
    };

    if (existing.docs[0]) {
      if (process.env.SEED_FORCE_UPDATE === 'true') {
        const updated = await payload.update({
          collection: 'products',
          id: existing.docs[0].id,
          overrideAccess: true,
          data: docData,
        });
        productIdBySlug.set(prod.slug, updated.id);
      } else {
        productIdBySlug.set(prod.slug, existing.docs[0].id);
      }
    } else {
      const created = await payload.create({
        collection: 'products',
        overrideAccess: true,
        data: docData,
      });
      productIdBySlug.set(prod.slug, created.id);
    }
  }

  // Wire relatedProducts relationships safely in second pass
  for (const prod of SEED_PRODUCTS) {
    if (!prod.relatedSlugs || prod.relatedSlugs.length === 0) continue;
    const id = productIdBySlug.get(prod.slug);
    const relatedIds = prod.relatedSlugs
      .map((s) => productIdBySlug.get(s))
      .filter((val): val is number => typeof val === 'number');
    if (id && relatedIds.length > 0) {
      await payload.update({
        collection: 'products',
        id,
        overrideAccess: true,
        data: { relatedProducts: relatedIds },
      });
    }
  }

  console.log('5/5 Seeding PostCategories and 4 Blog Posts...');
  const postCategoryIdBySlug = new Map<string, number>();
  for (const pc of SEED_POST_CATEGORIES) {
    const existing = await payload.find({
      collection: 'post-categories',
      where: { slug: { equals: pc.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'post-categories',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: {
          name: pc.name,
          slug: pc.slug,
          description: pc.description,
          status: 'published',
        },
      });
      postCategoryIdBySlug.set(pc.slug, updated.id);
    } else {
      const created = await payload.create({
        collection: 'post-categories',
        overrideAccess: true,
        data: {
          name: pc.name,
          slug: pc.slug,
          description: pc.description,
          status: 'published',
        },
      });
      postCategoryIdBySlug.set(pc.slug, created.id);
    }
  }

  for (const post of SEED_POSTS) {
    const postCatId = postCategoryIdBySlug.get(post.categorySlug);
    if (!postCatId) continue;
    const relatedProductIds = post.relatedProductSlugs
      .map((s) => productIdBySlug.get(s))
      .filter((val): val is number => typeof val === 'number');

    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      overrideAccess: true,
    });

    const docData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: mediaIds[post.imageKey],
      content: buildLexicalDocument(post.blocks),
      category: postCatId,
      authorName: post.authorName,
      publishedAt: post.publishedAt,
      relatedProducts: relatedProductIds,
      status: post.status,
      meta: {
        title: post.seoTitle,
        description: post.seoDescription,
        image: mediaIds[post.imageKey],
      },
    };

    if (existing.docs[0]) {
      await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: docData,
      });
    } else {
      await payload.create({
        collection: 'posts',
        overrideAccess: true,
        data: docData,
      });
    }
  }

  console.log('Seed completed successfully (idempotent).');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
