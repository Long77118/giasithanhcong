import { getImageProps } from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, PackageOpen } from 'lucide-react';
import { publicContentPath } from '@/lib/slug';
import { productListingImageSchedule, productListingImageSizes } from '@/lib/product-listing';
import type { Product } from '@/payload-types';
import { resolveMediaUrl } from './MediaImage';

const quantityFormat = new Intl.NumberFormat('vi-VN');

export function ProductListingCard({ product, index }: { product: Product; index: number }) {
  const path = publicContentPath('products', product.slug);
  const titleId = `product-listing-title-${product.id}`;
  const { url, width, height, alt } = resolveMediaUrl(product.images?.[0]?.image, 'original');
  const { loading, fetchPriority, preloadMedia } = productListingImageSchedule(index);
  const image = url ? getImageProps({ src: url, width, height, alt, sizes: productListingImageSizes, loading, fetchPriority }).props : null;
  const category = product.category && typeof product.category === 'object' ? product.category.name : undefined;
  const minOrder = product.minOrderQty
    ? `Từ ${quantityFormat.format(product.minOrderQty)} ${product.minOrderUnit || 'thùng'}`
    : undefined;

  return (
    <article className="listing-card listing-product-card">
      {image && preloadMedia && (
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
      <Link href={path} className="listing-card-link" aria-labelledby={titleId}>
        <div className="listing-card-media listing-product-media">
          {image ? <img {...image} /> : (
            <div className="listing-product-placeholder">
              <PackageOpen aria-hidden="true" />
              <span>Chưa có ảnh</span>
            </div>
          )}
          <span className="listing-product-reveal" aria-hidden="true">
            Xem chi tiết <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="listing-card-body listing-product-body">
          <h3 id={titleId} className="listing-card-title">{product.name}</h3>
          {minOrder && <p className="listing-product-moq">{minOrder}</p>}
          {product.packagingSpec && <p className="listing-product-packaging">{product.packagingSpec}</p>}
          {(product.sku || category) && (
            <div className="listing-product-meta">
              {product.sku && <span className="listing-product-sku">{product.sku}</span>}
              {product.sku && category && <span aria-hidden="true">·</span>}
              {category && <span>{category}</span>}
            </div>
          )}
        </div>
      </Link>
      <div className="listing-product-actions">
        <Link href={`${path}#bao-gia`} className="listing-button listing-button--primary" aria-label={`Hỏi báo giá ${product.name}`}>
          Hỏi báo giá <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
