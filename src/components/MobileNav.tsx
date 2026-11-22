'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { groupHeaderCategories, isHeaderLinkCurrent, type HeaderContact } from '@/lib/header';
import type { CategoryMenuItem } from './ProductCategoryMenu';
import { HeaderContactButtons, HeaderContactDetails } from './HeaderContactActions';

export function MobileNav({ brandName, links, currentPath, categories, contact }: {
  brandName: string;
  links: { label: string; href: string }[];
  currentPath: string;
  categories: CategoryMenuItem[];
  contact: HeaderContact;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const close = () => drawer.current?.close();
  const groups = groupHeaderCategories(categories);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 80rem)');
    const update = () => { if (desktop.matches) close(); };
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  return (
    <>
      <button
        type="button"
        className="site-mobile-toggle"
        aria-label="Mở menu điều hướng"
        aria-haspopup="dialog"
        aria-controls="site-mobile-navigation"
        onClick={() => drawer.current?.showModal()}
      >
        <Menu size={24} aria-hidden="true" />
      </button>
      <dialog
        id="site-mobile-navigation"
        ref={drawer}
        className="site-header-dialog site-mobile-drawer"
        aria-labelledby="site-mobile-title"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
        }}
      >
        <div className="site-mobile-drawer-inner">
          <div className="site-mobile-drawer-heading">
            <p id="site-mobile-title">{brandName}</p>
            <button type="button" className="site-dialog-close" onClick={close} aria-label="Đóng menu điều hướng">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          {groups.length > 0 && <nav aria-label="Danh mục trên điện thoại" className="site-mobile-categories">
            <p>Danh mục sản phẩm</p>
            {groups.map(({ root, children }) => <details key={root.id}>
              <summary>{root.name}<ChevronDown size={17} aria-hidden="true" /></summary>
              <Link href={root.href} prefetch={false} onNavigate={close}>Xem {root.name}</Link>
              {children.map(child => <Link key={child.id} href={child.href} prefetch={false} onNavigate={close}>{child.name}</Link>)}
            </details>)}
            <Link href="/san-pham" onNavigate={close}>Xem tất cả sản phẩm<ChevronRight size={16} aria-hidden="true" /></Link>
          </nav>}
          <nav aria-label="Điều hướng di động" className="site-mobile-links">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onNavigate={close} aria-current={isHeaderLinkCurrent(currentPath, href) ? 'page' : undefined}>
                {label} <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="site-mobile-contacts"><HeaderContactDetails contact={contact} /></div>
          <nav aria-label="Liên hệ từ menu" className="site-mobile-contact-actions"><HeaderContactButtons contact={contact} onClick={close} /></nav>
        </div>
      </dialog>
    </>
  );
}
