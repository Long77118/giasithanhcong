import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Product, ProductCategory } from '@/payload-types';
import {
  getPublishedProductBySlug,
  getPublishedCategoriesCached,
  getPublishedSlugRedirect,
  getSiteSettingsCached,
  resolvePublishedCanonicalUrl,
} from '@/lib/queries';
import {
  buildProductJsonLd,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { resolveOpenGraphImages, resolvePublicImageUrl } from '@/lib/seo-images';
import { categoryAncestors } from '@/lib/category-tree';
import { decodePublicSlugParam, publicContentPath, withPublicSearchParams, type PublicSearchParams } from '@/lib/slug';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactActions } from '@/components/ContactActions';
import { LexicalContent } from '@/components/LexicalContent';
import { resolveMediaUrl } from '@/components/MediaImage';
import { ProductCard } from '@/components/ProductCard';
import { compactCatalogCardSizes } from '@/lib/storefront-image-sizes';
import { ProductGallery, type GalleryImageItem } from '@/components/ProductGallery';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicSearchParams>;
}

export async function generateMetadata({
  params,
}: ProductDetailProps): Promise<Metadata> {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const meta = product.meta;
  const canonical = await resolvePublishedCanonicalUrl(siteUrl, publicContentPath('products', product.slug), meta?.canonicalUrl);
  const title = meta?.title || `${product.name} | ${contact.brandName}`;
  const description = meta?.description || product.shortDescription;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      images: resolveOpenGraphImages(
        siteUrl,
        meta?.image,
        ...(product.images ?? []).map(({ image }) => image),
        settings?.defaultOgImage,
      ),
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailProps) {
  const slug = decodePublicSlugParam((await params).slug);
  if (slug === null) notFound();
  const siteUrl = getSiteUrl();

  const [product, { contact }] = await Promise.all([
    getPublishedProductBySlug(slug),
    getSiteSettingsCached(),
  ]);

  if (!product) {
    const currentSlug = await getPublishedSlugRedirect('products', slug);
    if (currentSlug) {
      permanentRedirect(withPublicSearchParams(publicContentPath('products', currentSlug), await searchParams));
    }
    notFound();
  }

  const categoryObj =
    product.category && typeof product.category === 'object'
      ? (product.category as ProductCategory)
      : null;

  const galleryItems: GalleryImageItem[] = (product.images ?? []).map((entry) => {
    const resolved = resolveMediaUrl(entry.image, 'card');
    return {
      ...resolved,
      caption: entry.caption,
    };
  });

  const brandName = product.brandName?.trim();
  const productJsonLd = buildProductJsonLd({
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    url: `${siteUrl}${publicContentPath('products', product.slug)}`,
    brandName,
    categoryName: categoryObj?.name,
    images: galleryItems
      .map((i) => resolvePublicImageUrl(siteUrl, i.url))
      .filter((u): u is string => Boolean(u)),
  });

  const relatedList = (product.relatedProducts ?? [])
    .filter((item): item is Product => Boolean(item && typeof item === 'object'))
    .filter((item) => item.status === 'published' && item.id !== product.id);

  const breadcrumbCategories = categoryObj?.status === 'published'
    ? [...categoryAncestors(categoryObj, await getPublishedCategoriesCached()), categoryObj]
    : [];
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/san-pham' },
    ...breadcrumbCategories.map(category => ({
      label: category.name,
      href: publicContentPath('product-categories', category.slug),
    })),
    { label: product.name, href: publicContentPath('products', product.slug) },
  ];

  return (
    <>
      <JsonLd data={productJsonLd} />

      <div className="site-shell product-page py-4 sm:py-7 lg:py-8">
        <Breadcrumbs siteUrl={siteUrl} items={breadcrumbItems} />

        <section className="product-overview rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-6 lg:p-8">
          <header className="product-heading min-w-0 [overflow-wrap:anywhere]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600">
              {categoryObj?.status === 'published' && (
                <Link
                  href={publicContentPath('product-categories', categoryObj.slug)}
                  className="font-semibold text-[#294762] underline-offset-4 hover:underline"
                >
                  {categoryObj.name}
                </Link>
              )}
              <span className="font-mono tabular-nums text-slate-600">SKU {product.sku}</span>
            </div>
            <h1 className="mt-2 max-w-[36rem] font-display text-[1.65rem] font-bold leading-tight tracking-tight text-[#0C2340] text-pretty sm:text-3xl lg:text-[2.5rem]">
              {product.name}
            </h1>
          </header>

          <div className="product-gallery min-w-0">
            <ProductGallery items={galleryItems} productName={product.name} />
          </div>

          <div className="product-order flex min-w-0 flex-col [overflow-wrap:anywhere]">
            <div className="rounded-xl bg-[#eef3f7] p-3.5 sm:p-5">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-6">
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-[#405670]">Đặt tối thiểu (MOQ)</dt>
                  <dd className="mt-1 font-display text-base font-bold tabular-nums text-[#0C2340] sm:text-lg">
                    {product.minOrderQty
                      ? `${product.minOrderQty} ${product.minOrderUnit || 'thùng'}`
                      : 'Theo thỏa thuận'}
                  </dd>
                </div>
                <div className="min-w-0 border-s border-[#ccd9e4] ps-3 sm:ps-5">
                  <dt className="text-xs font-medium text-[#405670]">Quy cách đóng gói</dt>
                  <dd className="mt-1 text-sm font-semibold text-[#0C2340]">{product.packagingSpec}</dd>
                </div>
                {brandName && (
                  <div className="col-span-2 flex flex-wrap gap-x-2 border-t border-[#ccd9e4] pt-2 text-xs">
                    <dt className="text-[#405670]">Thương hiệu</dt>
                    <dd className="font-semibold text-[#0C2340]">{brandName}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#ccd9e4] pt-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-xs font-medium text-slate-600">Báo giá sỉ</span>
                  <span className="font-display text-base font-bold text-[#0C2340]">Liên hệ</span>
                </div>
                <a
                  href="#bao-gia"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#9a470b] px-4 text-sm font-semibold text-white hover:bg-[#7c3608] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a470b] sm:w-auto"
                >
                  Yêu cầu báo giá
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="mt-3">
              <ContactActions contact={contact} compact tone="secondary" />
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 lg:order-first lg:mt-0 lg:mb-4">
              {product.shortDescription}
            </p>
          </div>
        </section>

        {/* Technical Specs & Rich Description */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:mt-9 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 space-y-5 lg:col-span-7 lg:space-y-8">
            {product.specs && product.specs.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-7">
                <h2 className="font-display text-xl font-bold text-[#0C2340]">
                  Thông số kỹ thuật
                </h2>
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full table-fixed border-collapse text-left text-sm [overflow-wrap:anywhere]">
                    <tbody className="divide-y divide-slate-200">
                      <tr className="bg-slate-50">
                        <th scope="row" className="w-2/5 px-3 py-3 font-medium text-slate-600 sm:px-4">
                          Mã sản phẩm (SKU)
                        </th>
                        <td className="px-4 py-3 font-mono font-semibold tabular-nums text-slate-900">
                          {product.sku}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="px-3 py-3 font-medium text-slate-600 sm:px-4">
                          Quy cách đóng gói
                        </th>
                        <td className="px-4 py-3 text-slate-900">
                          {product.packagingSpec}
                        </td>
                      </tr>
                      {product.specs.map((spec, idx) => (
                        <tr
                          key={spec.id || `${spec.label}-${idx}`}
                          className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <th scope="row" className="px-3 py-3 font-medium text-slate-600 sm:px-4">
                            {spec.label}
                          </th>
                          <td className="px-4 py-3 tabular-nums text-slate-900">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-7">
              <h2 className="font-display text-xl font-bold text-[#0C2340]">
                Thông tin chi tiết sản phẩm
              </h2>
              <div className="mt-3">
                {product.description ? (
                  <LexicalContent data={product.description} />
                ) : (
                  <p className="text-sm text-slate-600">
                    {product.shortDescription}
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <QuoteRequestForm
              productId={product.id}
              productName={`${product.name} (${product.sku})`}
              defaultQuantity={
                product.minOrderQty
                  ? `${product.minOrderQty} ${product.minOrderUnit || 'thùng'}`
                  : ''
              }
            />
          </div>
        </div>

        {/* Related Products */}
        {relatedList.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <h2 className="font-display text-2xl font-bold text-[#0C2340]">
              Sản phẩm liên quan
            </h2>
            <div className="catalog-grid mt-6">
              {relatedList.map((rel) => (
                <ProductCard key={rel.id} product={rel} sizes={compactCatalogCardSizes} variant="catalog" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
