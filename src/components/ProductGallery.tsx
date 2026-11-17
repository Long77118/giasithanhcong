'use client';

import React, { useState } from 'react';
import Image from 'next/image';

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
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-8 text-center text-slate-500">
        <span className="text-sm font-medium text-slate-700">{productName}</span>
        <span className="mt-1 text-xs text-slate-500">Chưa có hình ảnh sản phẩm</span>
      </div>
    );
  }

  const current = validItems[activeIndex] ?? validItems[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {current.url && (
          <Image
            src={current.url}
            alt={current.alt || productName}
            width={current.width}
            height={current.height}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {current.caption && (
        <p className="text-xs text-slate-500">{current.caption}</p>
      )}

      {validItems.length > 1 && (
        <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Chọn ảnh sản phẩm">
          {validItems.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Xem ảnh ${idx + 1} của ${productName}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative h-16 w-20 overflow-hidden rounded-lg border transition-all ${
                  isSelected
                    ? 'border-[#0C2340] ring-2 ring-[#0C2340]/20'
                    : 'border-slate-200 opacity-75 hover:opacity-100'
                }`}
              >
                {item.url && (
                  <Image
                    src={item.url}
                    alt={item.alt}
                    width={160}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
