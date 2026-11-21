'use client';

import { useEffect, useRef, useState, type FormEventHandler, type Ref } from 'react';
import Form from 'next/form';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, LayoutGrid, Search, X } from 'lucide-react';
import { CategoryIcon, type CategoryMenuItem } from './ProductCategoryMenu';
import { MobileNav } from './MobileNav';

const NAV_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/san-pham' },
  { label: 'Blog', href: '/blog' },
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Liên hệ', href: '/lien-he' },
];

function HeaderSearch({
  className,
  inputRef,
  onSubmit,
}: {
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Form action="/san-pham" prefetch={false} onSubmit={onSubmit} role="search" aria-label="Tìm sản phẩm" className={`site-header-search ${className ?? ''}`}>
      <input
        ref={inputRef}
        type="search"
        name="q"
        required
        aria-label="Tìm theo tên sản phẩm hoặc mã SKU"
        placeholder="Tên sản phẩm hoặc SKU"
      />
      <button type="submit" aria-label="Tìm kiếm">
        <Search size={21} aria-hidden="true" />
      </button>
    </Form>
  );
}

function HeaderCategories({ items }: { items: CategoryMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const groups: CategoryMenuItem[][] = [];

  for (const item of items) {
    if (item.depth === 0) groups.push([item]);
    else groups.at(-1)?.push(item);
  }

  useEffect(() => {
    if (!open) return;
    function onOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onOutsidePointer);
    return () => document.removeEventListener('pointerdown', onOutsidePointer);
  }, [open]);

  return (
    <div
      ref={wrapper}
      className="site-header-categories"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="site-header-category-trigger"
        aria-expanded={open}
        aria-controls="site-header-category-list"
        onClick={() => setOpen((current) => !current)}
      >
        <LayoutGrid size={18} aria-hidden="true" />
        <span>Danh mục<span className="site-header-category-long"> sản phẩm</span></span>
        <ChevronDown size={15} className="site-header-chevron" aria-hidden="true" />
      </button>
      <nav
        id="site-header-category-list"
        aria-label="Danh mục sản phẩm"
        className="site-header-category-panel"
        data-open={open}
        inert={!open}
      >
        <ul className="site-header-category-grid">
          {groups.map(([root, ...descendants]) => (
            <li key={root.id}>
              <Link href={root.href} prefetch={false} className="site-header-category-root" onNavigate={() => setOpen(false)}>
                <CategoryIcon href={root.href} />
                <span>{root.name}</span>
              </Link>
              {descendants.length > 0 && (
                <ul className="site-header-category-children">
                  {descendants.map((category) => (
                    <li key={category.id} data-nested={category.depth > 1}>
                      <Link href={category.href} prefetch={false} onNavigate={() => setOpen(false)}>{category.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <Link href="/san-pham" className="site-header-all-products" onNavigate={() => setOpen(false)}>
          Tất cả sản phẩm <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}

export function SiteHeader({ brandName, categories }: { brandName: string; categories: CategoryMenuItem[] }) {
  const pathname = usePathname();
  const topRow = useRef<HTMLDivElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const row = topRow.current;
    const header = row?.parentElement;
    if (!row || !header) return;
    // A long company name may wrap. Pin only the navigation bar, using the real top-row height.
    const updateOffset = () => header.style.setProperty('--header-top-offset', `${row.getBoundingClientRect().height}px`);
    updateOffset();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOffset);
    observer?.observe(row);
    return () => {
      observer?.disconnect();
      header.style.removeProperty('--header-top-offset');
    };
  }, [brandName]);

  useEffect(() => {
    if (!topRow.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setPinned(entry.boundingClientRect.bottom <= 1);
    }, { threshold: [0, 0.01, 1] });
    observer.observe(topRow.current);
    return () => observer.disconnect();
  }, []);

  const closeSearch = () => searchDialog.current?.close();

  return (
    <header className="site-header" data-pinned={pinned}>
      <div ref={topRow} className="site-header-top">
        <div className="site-shell site-header-top-inner">
          <Link href="/" className="site-wordmark">{brandName}</Link>
          <HeaderSearch className="site-header-desktop-search" />
          <Link href="/lien-he#bao-gia" className="site-header-quote">
            <span className="site-header-quote-long">Yêu cầu báo giá</span>
            <span className="site-header-quote-short">Báo giá</span>
          </Link>
        </div>
      </div>

      <div className="site-header-bar">
        <div className="site-shell site-header-bar-inner">
          {categories.length > 0 && <HeaderCategories items={categories} />}
          <nav aria-label="Điều hướng chính" className="site-header-nav">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <button
            type="button"
            className="site-header-search-trigger"
            aria-label="Tìm theo tên sản phẩm hoặc SKU"
            aria-haspopup="dialog"
            aria-controls="site-header-search-dialog"
            onClick={() => {
              searchDialog.current?.showModal();
              searchInput.current?.focus();
            }}
          >
            <Search size={20} aria-hidden="true" />
            <span>Tìm hàng</span>
          </button>
          <MobileNav brandName={brandName} links={NAV_LINKS} currentPath={pathname} />
        </div>
      </div>

      <dialog
        id="site-header-search-dialog"
        ref={searchDialog}
        className="site-header-dialog site-search-dialog"
        aria-labelledby="site-header-search-title"
      >
        <button type="button" className="site-dialog-close" aria-label="Đóng tìm kiếm" onClick={closeSearch}>
          <X size={23} aria-hidden="true" />
        </button>
        <div className="site-search-dialog-content">
          <h2 id="site-header-search-title">Tìm sản phẩm</h2>
          <HeaderSearch inputRef={searchInput} onSubmit={closeSearch} />
        </div>
      </dialog>
    </header>
  );
}
