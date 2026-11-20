import React from 'react';
import Link from 'next/link';
import { publicContentPath } from '@/lib/slug';
import { threeColumnCardSizes } from '@/lib/storefront-image-sizes';
import type { Product, ProductCategory } from '@/payload-types';
import { MediaImage } from './MediaImage';

export function ProductCard({
  product,
  sizes = threeColumnCardSizes,
  variant = 'default',
}: { product: Product; sizes?: string; variant?: 'catalog' | 'default' | 'featured' }) {
  const primaryImage = product.images?.[0]?.image ?? null;
  const productPath = publicContentPath('products', product.slug);
  if (variant === 'featured') {
    return (
      <article className="home-product">
        <div className="home-product-image">
          <MediaImage media={primaryImage} prefer="card" sizes={sizes} fallbackTitle={product.name} />
        </div>
        <h3 className="home-product-title">
          <Link href={productPath} className="home-product-name">{product.name}</Link>
        </h3>
        <div className="home-product-actions">
          <div className="home-product-reveal">
            <Link
              href={`${productPath}#bao-gia`}
              className="home-product-contact"
              aria-label={`Liên hệ về ${product.name}`}
            >
              Liên hệ
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const inCatalog = variant === 'catalog';
  const categoryObj =
    product.category && typeof product.category === 'object'
      ? (product.category as ProductCategory)
      : null;

  return (
    <article className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-slate-300 ${inCatalog
      ? 'transition-colors max-sm:grid max-sm:grid-cols-[6rem_minmax(0,1fr)] max-sm:items-start max-sm:gap-3 max-sm:p-2.5'
      : 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'}`}>
      <Link
        href={productPath}
        className={`relative aspect-[4/3] w-full overflow-hidden bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0C2340] ${inCatalog ? 'max-sm:aspect-square max-sm:rounded-lg' : ''}`}
      >
        <MediaImage
          media={primaryImage}
          prefer="card"
          sizes={sizes}
          fallbackTitle={product.name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col p-5 ${inCatalog ? 'max-sm:p-0' : ''}`}>
        <div className={`mb-2 flex flex-wrap items-center gap-2 text-xs [overflow-wrap:anywhere] text-slate-500 ${inCatalog ? 'max-sm:mb-1' : ''}`}>
          {categoryObj && (
            <>
              <span className={inCatalog ? 'max-sm:hidden' : undefined}>{categoryObj.name}</span>
              <span className={inCatalog ? 'max-sm:hidden' : undefined} aria-hidden="true">·</span>
            </>
          )}
          <span className="font-mono tabular-nums text-slate-600">{product.sku}</span>
        </div>

        <h3 className={`mb-2 font-display text-base font-semibold leading-snug [overflow-wrap:anywhere] text-slate-900 ${inCatalog ? 'max-sm:mb-1 max-sm:text-sm' : ''}`}>
          <Link
            href={productPath}
            className="hover:text-[#0C2340] hover:underline focus-visible:outline-2 focus-visible:outline-[#0C2340]"
          >
            {product.name}
          </Link>
        </h3>

        <p className={`mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600 ${inCatalog ? 'max-sm:hidden' : ''}`}>
          {product.shortDescription}
        </p>

        <div className={`mt-auto border-t border-slate-100 pt-3.5 text-xs text-slate-600 ${inCatalog ? 'max-sm:border-0 max-sm:pt-1' : ''}`}>
          <div className={`flex items-baseline justify-between gap-2 ${inCatalog ? 'max-sm:flex-col max-sm:gap-0.5' : ''}`}>
            <span className="min-w-0 [overflow-wrap:anywhere]">{product.packagingSpec}</span>
            {product.minOrderQty ? (
              <span className={`max-w-[55%] shrink-0 text-right font-mono tabular-nums [overflow-wrap:anywhere] text-slate-700 ${inCatalog ? 'max-sm:max-w-full max-sm:text-left' : ''}`}>
                MOQ {product.minOrderQty} {product.minOrderUnit || 'thùng'}
              </span>
            ) : null}
          </div>

          <div className={`mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${inCatalog ? 'max-sm:mt-0 max-sm:gap-x-2 max-sm:gap-y-0' : ''}`}>
            <span className={`font-mono text-sm font-semibold tabular-nums text-[#0C2340] ${inCatalog ? 'max-sm:text-xs' : ''}`}>
              Liên hệ
            </span>
            <Link
              href={`${productPath}#bao-gia`}
              className={`whitespace-nowrap text-xs font-semibold text-[#B45309] transition-colors hover:text-[#92400E] hover:underline ${inCatalog ? 'inline-flex min-h-11 items-center' : ''}`}
            >
              Hỏi báo giá
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
