'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, LayoutGrid } from 'lucide-react';
import { groupHeaderCategories, type HeaderFeaturedProduct } from '@/lib/header';
import { CategoryIcon, type CategoryMenuItem } from './ProductCategoryMenu';

export function HeaderCategoryMenu({ items, featured }: { items: CategoryMenuItem[]; featured: HeaderFeaturedProduct | null }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const groups = groupHeaderCategories(items);

  function clearTimers() {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }
  function close() { clearTimers(); setOpen(false); }

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    if (!open) return;
    const onOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', onOutsidePointer);
    return () => document.removeEventListener('pointerdown', onOutsidePointer);
  }, [open]);

  return (
    <div ref={wrapper} className="site-header-categories"
      onPointerEnter={event => {
        if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        clearTimers();
        if (!open) openTimer.current = setTimeout(() => setOpen(true), 150);
      }}
      onPointerLeave={event => {
        if (event.pointerType !== 'mouse') return;
        clearTimers();
        if (wrapper.current?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')) return;
        closeTimer.current = setTimeout(() => setOpen(false), 200);
      }}
      onFocusCapture={() => clearTimeout(closeTimer.current)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation(); close(); trigger.current?.focus();
        }
      }}>
      <button ref={trigger} type="button" className="site-header-category-trigger" aria-expanded={open}
        aria-controls="site-header-category-list" onClick={() => { clearTimers(); setOpen(value => !value); }}>
        <LayoutGrid size={18} aria-hidden="true" />
        <span>Danh mục<span className="site-header-category-long"> sản phẩm</span></span>
        <ChevronDown size={15} className="site-header-chevron" aria-hidden="true" />
      </button>
      <nav id="site-header-category-list" aria-label="Danh mục sản phẩm" className="site-header-category-panel" data-open={open} inert={!open}>
        <ul className="site-header-category-grid" data-featured={Boolean(featured)}>
          {groups.map(({ root, children }) => <li key={root.id} className="site-header-category-tile">
            <Link href={root.href} prefetch={false} className="site-header-category-root" onNavigate={close}>
              <span className="site-header-category-image">
                {root.image ? <Image src={root.image} alt="" width={56} height={56} sizes="56px" loading="lazy" /> : <CategoryIcon href={root.href} />}
              </span>
              <strong>{root.name}</strong>
            </Link>
            {children.length > 0 && <ul className="site-header-category-children">
              {children.map(child => <li key={child.id}><Link href={child.href} prefetch={false} onNavigate={close}>{child.name}</Link></li>)}
            </ul>}
          </li>)}
          {featured && <li className="site-header-category-featured">
            <span>Bán chạy</span>
            <Link href={featured.href} prefetch={false} onNavigate={close}>{featured.name}<ArrowRight size={20} aria-hidden="true" /></Link>
          </li>}
        </ul>
        <Link href="/san-pham" className="site-header-all-products" onNavigate={close}>Xem tất cả sản phẩm<ArrowRight size={18} aria-hidden="true" /></Link>
      </nav>
    </div>
  );
}
