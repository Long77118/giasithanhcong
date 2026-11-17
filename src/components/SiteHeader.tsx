import React from 'react';
import Link from 'next/link';
import { MobileNav } from './MobileNav';

const NAV_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/san-pham' },
  { label: 'Blog', href: '/blog' },
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Liên hệ', href: '/lien-he' },
];

export function SiteHeader({ brandName }: { brandName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="whitespace-nowrap shrink-0 font-display text-xl font-bold tracking-tight text-[#0C2340] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340]"
        >
          {brandName}
        </Link>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-slate-600 transition-colors hover:text-[#0C2340] hover:underline hover:underline-offset-8"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Single primary action + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/lien-he#bao-gia"
            className="hidden min-h-[40px] items-center justify-center whitespace-nowrap shrink-0 rounded-lg bg-[#B45309] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309] sm:inline-flex"
          >
            Yêu cầu báo giá
          </Link>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
