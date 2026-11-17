'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface NavLinkItem {
  label: string;
  href: string;
}

export function MobileNav({ links }: { links: NavLinkItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 z-40 border-b border-slate-200 bg-white px-4 py-4 shadow-lg">
          <nav aria-label="Điều hướng di động" className="flex flex-col gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0C2340]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/lien-he#bao-gia"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#92400E]"
            >
              Yêu cầu báo giá
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
