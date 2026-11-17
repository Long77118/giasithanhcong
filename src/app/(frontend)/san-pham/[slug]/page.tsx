import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product, ProductCategory } from '@/payload-types';
import {
  getPublishedProductBySlug,
  getSiteSettingsCached,
} from '@/lib/queries';
import {
  buildProductJsonLd,
  formatPriceVnd,
  getSiteUrl,
  isIndexingAllowed,
} from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactActions } from '@/components/ContactActions';
import { LexicalContent } from '@/components/LexicalContent';
import { resolveMediaUrl } from '@/components/MediaImage';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery, type GalleryImageItem } from '@/components/ProductGallery';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';

export const dynamic = 'force-dynamic';

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { contact } = await getSiteSettingsCached();

  const meta = product.meta as
    | {
        title?: string | null;
        description?: string | null;
        canonicalUrl?: string | null;
        image?: unknown;
      }
    | undefined;

  const canonical = meta?.canonicalUrl || `${siteUrl}/san-pham/${product.slug}`;
  const title = meta?.title || `${product.name} | ${contact.brandName}`;
  const description = meta?.description || product.shortDescription;

  const primaryMedia = resolveMediaUrl(product.images?.[0]?.image ?? null, 'card');
  const ogImages = primaryMedia.url ? [{ url: `${siteUrl}${primaryMedia.url}` }] : undefined;

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
      images: ogImages,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  const [product, { contact }] = await Promise.all([
    getPublishedProductBySlug(slug),
    getSiteSettingsCached(),
  ]);

  if (!product) {
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

  const priceDisplay = formatPriceVnd(product.price, product.showPrice);

  const productJsonLd = buildProductJsonLd({
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    url: `${siteUrl}/san-pham/${product.slug}`,
    brandName: contact.brandName,
    categoryName: categoryObj?.name,
    images: galleryItems
      .map((i) => (i.url ? `${siteUrl}${i.url}` : null))
      .filter((u): u is string => Boolean(u)),
    price: product.price,
    showPrice: product.showPrice,
  });

  const relatedList = (product.relatedProducts ?? [])
    .filter((item): item is Product => Boolean(item && typeof item === 'object'))
    .filter((item) => item.status === 'published' && item.id !== product.id);

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/san-pham' },
    ...(categoryObj && categoryObj.status === 'published'
      ? [{ label: categoryObj.name, href: `/danh-muc/${categoryObj.slug}` }]
      : []),
    { label: product.name },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Breadcrumbs siteUrl={siteUrl} items={breadcrumbItems} />

        {/* Contiguous Product Showcase & Wholesale Purchase/Quote Module */}
        <section className="grid gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <ProductGallery items={galleryItems} productName={product.name} />
          </div>

          <div className="flex flex-col lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {categoryObj && categoryObj.status === 'published' && (
                <>
                  <Link
                    href={`/danh-muc/${categoryObj.slug}`}
                    className="font-medium text-[#0C2340] hover:underline"
                  >
                    {categoryObj.name}
                  </Link>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="font-mono tabular-nums text-slate-700">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="mt-2.5 font-display text-2xl font-bold leading-snug text-[#0C2340] sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-slate-600">
              {product.shortDescription}
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
                <span className="text-xs font-medium text-slate-500">
                  Giá bán sỉ tham khảo
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-[#0C2340]">
                  {priceDisplay}
                </span>
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Quy cách đóng gói</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {product.packagingSpec}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Số lượng đặt tối thiểu (MOQ)</dt>
                  <dd className="font-mono font-semibold tabular-nums text-slate-900">
                    {product.minOrderQty
                      ? `${product.minOrderQty} ${product.minOrderUnit || 'thùng'}`
                      : 'Theo thỏa thuận'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate-600">
                Liên hệ nhận báo giá nhanh
              </p>
              <ContactActions contact={contact} quoteHref="#bao-gia" />
            </div>
          </div>
        </section>

        {/* Technical Specs & Rich Description */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            {product.specs && product.specs.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#0C2340]">
                  Thông số kỹ thuật
                </h2>
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <tbody className="divide-y divide-slate-200">
                      <tr className="bg-slate-50">
                        <th className="w-2/5 px-4 py-3 font-medium text-slate-600">
                          Mã sản phẩm (SKU)
                        </th>
                        <td className="px-4 py-3 font-mono font-semibold tabular-nums text-slate-900">
                          {product.sku}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600">
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
                          <th className="px-4 py-3 font-medium text-slate-600">
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

            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
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

          <div className="lg:col-span-5">
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
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedList.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
