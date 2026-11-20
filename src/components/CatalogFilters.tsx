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
  const selectStyle = 'min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340] sm:text-sm';

  return (
    <Form action="/san-pham" role="search" aria-label="Tìm và lọc sản phẩm" className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            aria-label="Tên sản phẩm hoặc mã SKU"
            placeholder="Tên / SKU"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pe-2.5 ps-10 text-base text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340] sm:text-sm"
          />
        </div>
        <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-[#0C2340] px-3.5 text-sm font-semibold text-white hover:bg-[#163861] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340] sm:px-5">
          Tìm
        </button>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={optionsId}
          onClick={() => setExpanded(open => !open)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0C2340] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340] sm:px-3 lg:hidden"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Bộ lọc
          <ChevronDown size={14} aria-hidden="true" className={expanded ? 'rotate-180' : undefined} />
        </button>
      </div>

      <div id={optionsId} className={`${expanded ? 'grid' : 'hidden'} min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-end`}>
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-700">
          Nhóm hàng
          <select name="category" defaultValue={category} className={selectStyle}>
            <option value="">Tất cả nhóm hàng</option>
            {categories.map(({ slug, name, depth }) => (
              <option key={slug} value={slug}>{`${'— '.repeat(Math.min(depth, 3))}${name}`}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-700">
          Sắp xếp
          <select name="sort" defaultValue={sort} className={selectStyle}>
            {sorts.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-lg border border-[#0C2340] px-3 text-sm font-semibold text-[#0C2340] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340] sm:col-span-2 lg:col-span-1">
          Áp dụng
        </button>
      </div>
    </Form>
  );
}
