import React from 'react';
import Link from 'next/link';
import type { Product, ProductCategory } from '@/payload-types';
import { formatPriceVnd } from '@/lib/seo';
import { MediaImage } from './MediaImage';

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.[0]?.image ?? null;
  const categoryObj =
    product.category && typeof product.category === 'object'
      ? (product.category as ProductCategory)
      : null;

  const priceLabel = formatPriceVnd(product.price, product.showPrice);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link
        href={`/san-pham/${product.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340]"
      >
        <MediaImage
          media={primaryImage}
          prefer="card"
          fallbackTitle={product.name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {categoryObj && (
            <>
              <span>{categoryObj.name}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span className="font-mono tabular-nums text-slate-600">{product.sku}</span>
        </div>

        <h3 className="mb-2 font-display text-base font-semibold leading-snug text-slate-900">
          <Link
            href={`/san-pham/${product.slug}`}
            className="hover:text-[#0C2340] hover:underline focus-visible:outline-2 focus-visible:outline-[#0C2340]"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {product.shortDescription}
        </p>

        <div className="mt-auto border-t border-slate-100 pt-3.5 text-xs text-slate-600">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{product.packagingSpec}</span>
            {product.minOrderQty ? (
              <span className="shrink-0 font-mono tabular-nums text-slate-700">
                MOQ {product.minOrderQty} {product.minOrderUnit || 'thùng'}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums text-[#0C2340]">
              {priceLabel}
            </span>
            <Link
              href={`/san-pham/${product.slug}#bao-gia`}
              className="whitespace-nowrap text-xs font-semibold text-[#B45309] transition-colors hover:text-[#92400E] hover:underline"
            >
              Hỏi báo giá
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
