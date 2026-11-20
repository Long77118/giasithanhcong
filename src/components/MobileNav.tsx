'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Menu, X } from 'lucide-react';

interface NavLinkItem {
  label: string;
  href: string;
}

export function MobileNav({ brandName, links, currentPath }: {
  brandName: string;
  links: NavLinkItem[];
  currentPath: string;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const close = () => drawer.current?.close();

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
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="site-mobile-drawer-inner">
          <div className="site-mobile-drawer-heading">
            <h2 id="site-mobile-title">{brandName}</h2>
            <button type="button" className="site-dialog-close" onClick={close} aria-label="Đóng menu điều hướng">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Điều hướng di động">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onNavigate={close} aria-current={currentPath === href ? 'page' : undefined}>
                {label} <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <Link href="/lien-he#bao-gia" onNavigate={close} className="site-header-quote">
            Yêu cầu báo giá
          </Link>
        </div>
      </dialog>
    </>
  );
}
