import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getCategoryBySlug,
  getProductsCatalog,
  getPublishedCategoriesCached,
  getPublishedSlugRedirect,
  getSiteSettingsCached,
  resolvePublishedCanonicalUrl,
} from '@/lib/queries';
import {
  buildCatalogSeoDecision,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { categoryAncestors } from '@/lib/category-tree';
import { decodePublicSlugParam, parsePositivePage, publicContentPath, withPublicSearchParams, type PublicSearchParams } from '@/lib/slug';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { MediaImage, resolveMediaUrl } from '@/components/MediaImage';
import { ListingHeading } from '@/components/ListingHeading';
import { ProductListingCard } from '@/components/ProductListingCard';
import { Pagination } from '@/components/Pagination';
import '@/components/listing.css';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const sp = await searchParams;
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort)?.trim();
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Không tìm thấy danh mục',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const basePath = publicContentPath('product-categories', category.slug);
  const seo = buildCatalogSeoDecision({
    basePath,
    page,
    sort,
    siteUrl,
    indexingAllowed,
  });

  const meta = category.meta;
  const baseCanonical = await resolvePublishedCanonicalUrl(siteUrl, basePath, meta?.canonicalUrl);
  const canonical = baseCanonical === siteUrl + basePath ? seo.canonical : baseCanonical;

  const title = meta?.title || `${category.name} | ${contact.brandName}`;
  const description =
    meta?.description ||
    category.description ||
    `Danh mục sản phẩm ${category.name} bán sỉ.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: resolveOpenGraphImages(siteUrl, meta?.image, category.image, settings?.defaultOgImage),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const sp = await searchParams;
  const page = parsePositivePage(sp.page);
  if (page === null) notFound();
  const sort =
    (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort)?.trim() || 'newest';
  const siteUrl = getSiteUrl();

  const category = await getCategoryBySlug(slug);
  if (!category) {
    const currentSlug = await getPublishedSlugRedirect('product-categories', slug);
    if (currentSlug) {
      permanentRedirect(withPublicSearchParams(publicContentPath('product-categories', currentSlug), sp));
    }
    notFound();
  }

  const [allCategories, catalog] = await Promise.all([
    getPublishedCategoriesCached(),
    getProductsCatalog({
      categorySlug: category.slug,
      sort,
      page,
      limit: 9,
    }),
  ]);

  if (page > 1 && page > catalog.totalPages) notFound();

  const categoryPath = publicContentPath('product-categories', category.slug);
  const filters = { sort: sort !== 'newest' ? sort : undefined };
  const ancestors = categoryAncestors(category, allCategories);
  const childCategories = allCategories.filter((c) => {
    const parentId =
      c.parent && typeof c.parent === 'object' ? c.parent.id : c.parent;
    return parentId === category.id;
  });
  const categoryImage = resolveMediaUrl(category.image);

  return (
    <div className="site-shell listing-page listing-products listing-category py-4 sm:py-7 lg:py-8">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm', href: '/san-pham' },
          ...ancestors.map(ancestor => ({
            label: ancestor.name,
            href: publicContentPath('product-categories', ancestor.slug),
          })),
          {
            label: category.name,
            href: withPublicSearchParams(categoryPath, { ...filters, page: page > 1 ? String(page) : undefined }),
          },
        ]}
      />

      <ListingHeading
        title={category.name}
        description={category.description}
        summary={`${new Intl.NumberFormat('vi-VN').format(catalog.totalDocs)} sản phẩm`}
        actions={(
          <div className="listing-category-actions">
            <Link
              href="/lien-he#bao-gia"
              className="listing-button"
              aria-label={`Nhận báo giá trọn nhóm ${category.name}`}
            >
              Nhận báo giá trọn nhóm
            </Link>
          </div>
        )}
        media={categoryImage.url ? (
          <div className="listing-category-image">
            <MediaImage
              media={category.image}
              sizes="(min-width: 40rem) clamp(7rem, 14vw, 10rem), clamp(3.5rem, 19vw, 5rem)"
            />
          </div>
        ) : undefined}
      />

      {childCategories.length > 0 && (
        <div className="listing-filter-panel listing-category-children">
          <h2 id="listing-category-children">Danh mục con</h2>
          <nav className="listing-chip-row listing-quick-filters" aria-labelledby="listing-category-children">
            {childCategories.map((child) => (
              <Link key={child.id} href={publicContentPath('product-categories', child.slug)} className="listing-chip">
                {child.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <section className="listing-results" aria-labelledby="listing-category-results">
        <h2 id="listing-category-results" className="sr-only">Sản phẩm trong danh mục</h2>
        {catalog.totalPages > 1 && (
          <p className="listing-page-number">Trang {catalog.page} / {catalog.totalPages}</p>
        )}
        {catalog.docs.length === 0 ? (
          <div className="listing-empty">
            <h3>Danh mục hiện chưa có sản phẩm xuất bản</h3>
            <p>Vui lòng quay lại danh sách tổng hợp hoặc gửi yêu cầu để được tư vấn quy cách tương đương.</p>
            <div className="listing-empty-actions">
              <Link href="/san-pham" className="listing-button listing-button--primary">Xem tất cả sản phẩm</Link>
            </div>
          </div>
        ) : (
          <div className="listing-grid">
            {catalog.docs.map((product, index) => <ProductListingCard key={product.id} product={product} index={index} />)}
          </div>
        )}
        <div className="listing-pagination">
          <Pagination
            currentPage={catalog.page}
            totalPages={catalog.totalPages}
            basePath={categoryPath}
            queryParams={filters}
          />
        </div>
      </section>
    </div>
  );
}
