import { getImageProps } from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import type { Product } from '@/payload-types';
import { publicContentPath } from '@/lib/slug';
import { MediaImage, resolveMediaUrl } from './MediaImage';
import { ProductChoiceReveal } from './ProductChoiceReveal';
import './product-choice.css';

// Match the two-, three-, and five-column grid, site gutters, gaps and photo borders.
const sizes = '(min-width: 64rem) calc((min(100vw, 90rem) - 7rem) / 5 - 2px), (min-width: 40rem) calc((100vw - 5rem) / 3 - 2px), calc((100vw - 2.75rem) / 2 - 2px)';
const extraFirstRowMedia = ['(min-width: 40rem)', '(min-width: 64rem)', '(min-width: 64rem)'];
type ChoiceProduct = Pick<Product, 'name' | 'slug' | 'specs' | 'images' | 'packagingSpec' | 'minOrderQty' | 'minOrderUnit'> &
  Partial<Pick<Product, 'sku' | 'category'>>;

export function ProductChoiceCard({ product, zaloUrl, quoteLabel = 'Báo giá', showCatalogMeta, priorityIndex }: {
  product: ChoiceProduct;
  zaloUrl?: string | null;
  quoteLabel?: string;
  showCatalogMeta?: boolean;
  priorityIndex?: number;
}) {
  const path = publicContentPath('products', product.slug);
  const facts = product.specs?.filter(spec => /^(dung tích|chất liệu|chất liệu thân)$/i.test(spec.label.trim()) && spec.value.trim()).slice(0, 2);
  const category = typeof product.category === 'object' ? product.category?.name : undefined;
  const catalogMeta = showCatalogMeta ? [product.sku, category].filter(Boolean).join(' · ') : '';
  const media = product.images?.[0]?.image;
  const { url, width, height, alt } = resolveMediaUrl(media);
  const eager = priorityIndex !== undefined && priorityIndex < 2;
  const preloadMedia = priorityIndex === undefined ? undefined : extraFirstRowMedia[priorityIndex - 2];
  const image = url ? getImageProps({
    src: url, width, height, alt, sizes, className: 'product-choice-image',
    loading: eager ? 'eager' : 'lazy',
    fetchPriority: eager ? 'high' : undefined,
  }).props : null;

  return (
    <ProductChoiceReveal name={product.name} href={path} image={image ? (
      <>
        {preloadMedia && (
          <link
            rel="preload"
            as="image"
            href={image.srcSet ? undefined : image.src}
            imageSrcSet={image.srcSet}
            imageSizes={image.srcSet ? image.sizes : undefined}
            media={preloadMedia}
            fetchPriority="high"
          />
        )}
        <img {...image} />
      </>
    ) : (
      <MediaImage media={media} fallbackTitle={product.name} sizes={sizes} />
    )}>
      {Boolean(facts?.length) && <p className="product-choice-facts">{facts?.map(spec => spec.value).join(' / ')}</p>}
      <div className="product-choice-wholesale">
        {product.packagingSpec && <p>{product.packagingSpec}</p>}
        {product.minOrderQty ? (
          <p>Tối thiểu <strong>{product.minOrderQty.toLocaleString('vi-VN')} {product.minOrderUnit || 'thùng'}</strong></p>
        ) : null}
        {catalogMeta && <p>{catalogMeta}</p>}
      </div>
      <div className="product-choice-contact">
        <Link href={path} className="product-choice-detail" aria-label={`Xem chi tiết ${product.name}`} prefetch={false}>
          Chi tiết <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <a
          href={zaloUrl || `${path}#bao-gia`}
          className="product-choice-quote"
          target={zaloUrl ? '_blank' : undefined}
          rel={zaloUrl ? 'noopener noreferrer' : undefined}
          aria-label={`${zaloUrl ? 'Hỏi giá Zalo' : quoteLabel} ${product.name}`}
        >
          <MessageCircle size={14} aria-hidden="true" />
          {zaloUrl ? 'Zalo' : quoteLabel}
        </a>
      </div>
    </ProductChoiceReveal>
  );
}
