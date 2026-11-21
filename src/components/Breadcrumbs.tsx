import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from './JsonLd';

export interface BreadcrumbTrailItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbTrailItem[];
  siteUrl: string;
  structuredData?: boolean;
}

export function Breadcrumbs({ items, siteUrl, structuredData = true }: BreadcrumbsProps) {
  const jsonLdItems = items.map((item) => ({
    name: item.label,
    url: new URL(item.href, siteUrl).href,
  }));

  const jsonLd = buildBreadcrumbJsonLd(jsonLdItems);

  return (
    <>
      {structuredData && <JsonLd data={jsonLd} />}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                )}
                {!isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#0C2340] hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="font-medium text-slate-900"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
