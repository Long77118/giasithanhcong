import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParams?: Record<string, string | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (pageNum: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v && v.trim().length > 0) {
        params.set(k, v.trim());
      }
    }
    if (pageNum > 1) {
      params.set('page', String(pageNum));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Phân trang"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Trước</span>
        </Link>
      ) : (
        <span className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Trước</span>
        </span>
      )}

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
        {pages.map((p) =>
          p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg bg-[#0C2340] px-3 text-sm font-semibold tabular-nums text-white"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium tabular-nums text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          <span>Sau</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">
          <span>Sau</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
