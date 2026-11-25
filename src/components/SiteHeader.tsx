'use client';

import { useEffect, useRef, useState, type FormEventHandler, type Ref } from 'react';
import dynamic from 'next/dynamic';
import Form from 'next/form';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { headerLinks, isHeaderLinkCurrent, type HeaderContact, type HeaderFeaturedProduct } from '@/lib/header';
import type { CategoryMenuItem } from './ProductCategoryMenu';
import { HeaderBrand } from './HeaderBrand';
import { HeaderContactDetails, HeaderQuoteLink } from './HeaderContactActions';
import { HeaderCategoryMenu } from './HeaderCategoryMenu';
import { MobileNav } from './MobileNav';
import type { SeasonalScopeConfig } from './SeasonalScope';

const SeasonalScope = dynamic(() => import('./SeasonalScope'), { ssr: false });

function HeaderSearch({ className = '', inputRef, onSubmit, active = true, compact = false }: {
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <Form action="/san-pham" prefetch={false} onSubmit={onSubmit} role={active ? 'search' : undefined}
      aria-label="Tìm sản phẩm" className={`site-header-search ${className}`}>
      <input ref={inputRef} type="search" name="q" required disabled={!active}
        aria-label="Tìm theo tên sản phẩm hoặc mã SKU" placeholder={compact ? 'Tìm sản phẩm...' : 'Tên sản phẩm hoặc SKU'} />
      <button type="submit" aria-label="Tìm kiếm" disabled={!active}><Search size={20} aria-hidden="true" /></button>
    </Form>
  );
}

export function SiteHeader({ brandName, categories, contact, featured, season }: {
  brandName: string;
  categories: CategoryMenuItem[];
  contact: HeaderContact;
  featured: HeaderFeaturedProduct | null;
  season?: SeasonalScopeConfig;
}) {
  const pathname = usePathname();
  const topRow = useRef<HTMLDivElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [pinned, setPinned] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const row = topRow.current;
    const header = row?.parentElement;
    if (!row || !header) return;
    // Keep the current sticky mechanism and measure the real first-row height.
    const updateOffset = () => header.style.setProperty('--header-top-offset', `${row.getBoundingClientRect().height}px`);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(row);
    return () => { observer.disconnect(); header.style.removeProperty('--header-top-offset'); };
  }, [brandName]);

  useEffect(() => {
    if (!topRow.current) return;
    const observer = new IntersectionObserver(([entry]) => setPinned(entry.boundingClientRect.bottom <= 1), { threshold: [0, 0.01, 1] });
    observer.observe(topRow.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 80rem)');
    const closeOnDesktop = () => { if (desktop.matches) searchDialog.current?.close(); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);
  const closeSearch = () => searchDialog.current?.close();

  return (
    <header className="site-header" data-pinned={pinned}>
      {season && pathname && !/^\/xem-truoc(?:\/|$)/.test(pathname) && <SeasonalScope {...season} pathname={pathname} />}
      <div ref={topRow} className="site-header-top" inert={pinned}>
        <div className="site-shell site-header-top-inner">
          <HeaderBrand name={brandName} />
          <HeaderSearch className="site-header-desktop-search" active={!pinned && !searchOpen} />
          <HeaderContactDetails contact={contact} />
          <nav aria-label="Báo giá tại đầu trang"><HeaderQuoteLink contact={contact} /></nav>
        </div>
      </div>
      <div className="site-header-bar">
        <div className="site-shell site-header-bar-inner">
          <HeaderBrand name={brandName} className="site-mobile-wordmark" />
          {categories.length > 0 && <HeaderCategoryMenu items={categories} featured={featured} />}
          <nav aria-label="Điều hướng chính" className="site-header-nav">
            {headerLinks.map(({ href, label }) => <Link key={href} href={href} aria-current={isHeaderLinkCurrent(pathname, href) ? 'page' : undefined}>{label}</Link>)}
          </nav>
          <div className="site-header-pinned-actions" inert={!pinned} aria-hidden={!pinned}>
            <HeaderSearch active={pinned && !searchOpen} compact />
            <nav aria-label="Báo giá khi cuộn"><HeaderQuoteLink contact={contact} /></nav>
          </div>
          <button type="button" className="site-header-search-trigger" aria-label="Tìm theo tên sản phẩm hoặc SKU" aria-haspopup="dialog"
            aria-controls="site-header-search-dialog" onClick={() => { searchDialog.current?.showModal(); setSearchOpen(true); }}>
            <Search size={21} aria-hidden="true" />
          </button>
          <MobileNav brandName={brandName} links={headerLinks} currentPath={pathname} categories={categories} contact={contact} />
        </div>
      </div>
      <dialog id="site-header-search-dialog" ref={searchDialog} className="site-header-dialog site-search-dialog"
        aria-labelledby="site-header-search-title" onClose={() => setSearchOpen(false)}>
        <button type="button" className="site-dialog-close" aria-label="Đóng tìm kiếm" onClick={closeSearch}><X size={23} aria-hidden="true" /></button>
        <div className="site-search-dialog-content">
          <p id="site-header-search-title">Tìm sản phẩm</p>
          <HeaderSearch inputRef={searchInput} onSubmit={closeSearch} active={searchOpen} />
        </div>
      </dialog>
    </header>
  );
}
