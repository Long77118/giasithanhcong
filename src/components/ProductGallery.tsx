'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { productGallerySizes } from '@/lib/storefront-image-sizes';

export interface GalleryImageItem {
  url: string | null;
  width: number;
  height: number;
  alt: string;
  caption?: string | null;
}

export function ProductGallery({
  items,
  productName,
}: {
  items: GalleryImageItem[];
  productName: string;
}) {
  const validItems = items.filter((item) => Boolean(item.url));
  const [activeIndex, setActiveIndex] = useState(0);

  if (validItems.length === 0) {
    return null;
  }

  const current = validItems[activeIndex] ?? validItems[0];

  return (
    <figure className="product-detail-gallery">
      <div className="product-detail-stage">
        {current.url && (
          <Image
            src={current.url}
            alt={current.alt || productName}
            width={current.width}
            height={current.height}
            preload={activeIndex === 0}
            loading={activeIndex === 0 ? undefined : 'eager'}
            sizes={productGallerySizes}
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {current.caption && (
        <figcaption className="product-detail-caption" aria-live="polite">{current.caption}</figcaption>
      )}

      {validItems.length > 1 && (
        <div className="product-detail-thumbnails" role="group" aria-label={`Chọn ảnh ${productName}`}>
          {validItems.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Ảnh ${idx + 1}: ${item.alt || productName}`}
                onClick={() => setActiveIndex(idx)}
                className="product-detail-thumbnail"
              >
                {item.url && (
                  <Image
                    src={item.url}
                    alt=""
                    width={128}
                    height={128}
                    sizes="80px"
                    className="h-full w-full object-contain"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
