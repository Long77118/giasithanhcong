'use client';

import { useId, useState } from 'react';
import Form from 'next/form';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';

interface CatalogFiltersProps {
  query: string;
  category: string;
  sort: string;
  categories: { slug: string; name: string; depth: number }[];
  sorts: { value: string; label: string }[];
}

export function CatalogFilters({ query, category, sort, categories, sorts }: CatalogFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const optionsId = useId();

  return (
    <Form action="/san-pham" role="search" aria-label="Tìm và lọc sản phẩm" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="product-catalog-search-icon pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            aria-label="Tên sản phẩm hoặc mã SKU"
            placeholder="Tên / mã"
            className="w-full pe-2.5 ps-10 text-base sm:text-sm"
          />
        </div>
        <button type="submit" className="product-catalog-search-submit shrink-0 px-3.5 sm:px-5">
          Tìm
        </button>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={optionsId}
          onClick={() => setExpanded(open => !open)}
          className="inline-flex shrink-0 items-center gap-1.5 px-2.5 sm:px-3 lg:hidden"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Bộ lọc
          <ChevronDown size={14} aria-hidden="true" className={`product-catalog-filter-chevron${expanded ? ' rotate-180' : ''}`} />
        </button>
      </div>

      <div id={optionsId} className={`${expanded ? 'grid' : 'hidden'} min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-end`}>
        <label className="grid min-w-0 gap-1 text-xs font-semibold">
          Nhóm hàng
          <select name="category" defaultValue={category} className="w-full min-w-0 px-3 text-base sm:text-sm">
            <option value="">Tất cả nhóm hàng</option>
            {categories.map(({ slug, name, depth }) => (
              <option key={slug} value={slug}>{`${'— '.repeat(Math.min(depth, 3))}${name}`}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-xs font-semibold">
          Sắp xếp
          <select name="sort" defaultValue={sort} className="w-full min-w-0 px-3 text-base sm:text-sm">
            {sorts.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className="px-3 sm:col-span-2 lg:col-span-1">
          Áp dụng
        </button>
      </div>
    </Form>
  );
}
