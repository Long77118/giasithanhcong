'use client';

import { useEffect, useRef } from 'react';
import { observeScrollReveal } from '@/lib/scroll-reveal';
import './scroll-reveal.css';
import './seasonal-scroll.css';

function revealSelector(pathname: string): string | undefined {
  if (pathname === '/') {
    return '.home-category-shortcuts, .home-entry > :not(.home-discovery), .home-posts, .home-social, .home-quote';
  }
  if (pathname === '/gioi-thieu') return '[data-reveal]';
  if (pathname === '/blog' || pathname === '/san-pham' || /^\/danh-muc\/[^/]+$/.test(pathname)) {
    return '.listing-results :is(.listing-grid, .product-choice-grid) > article';
  }
}

export default function SeasonalScrollEffects({ pathname }: { pathname: string }) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const main = document.getElementById('main-content');
    const selector = revealSelector(pathname);
    if (main && selector) return observeScrollReveal(main, selector);
  }, [pathname]);

  useEffect(() => {
    const progress = progressRef.current;
    const header = progress?.closest('header');
    const page = document.scrollingElement;
    if (!progress || !header || !page) return;

    const fallback = typeof CSS === 'undefined' || !CSS.supports('animation-timeline', 'scroll(root)');
    const mobile = window.matchMedia('(width < 80rem)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      header.toggleAttribute('data-seasonal-scroll-shadow', mobile.matches && window.scrollY > 4);

      if (fallback && !motion.matches) {
        const range = page.scrollHeight - page.clientHeight;
        const fraction = range > 0 ? Math.min(1, Math.max(0, page.scrollTop / range)) : 0;
        progress.style.setProperty('--season-scroll-progress', String(fraction));
      }
    };
    const queue = () => { frame ??= window.requestAnimationFrame(update); };

    const resize = fallback && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(queue) : undefined;
    resize?.observe(document.body);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    motion.addEventListener('change', queue);
    queue();

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      motion.removeEventListener('change', queue);
      header.removeAttribute('data-seasonal-scroll-shadow');
    };
  }, [pathname]);

  return (
    <div ref={progressRef} className="seasonal-scroll-progress" aria-hidden="true">
      <div className="seasonal-scroll-fill" />
      <div className="seasonal-scroll-cursor">
        <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
          <path d="M8 1c.55 4.1 2.9 6.45 7 7-4.1.55-6.45 2.9-7 7-.55-4.1-2.9-6.45-7-7 4.1-.55 6.45-2.9 7-7Z" />
        </svg>
      </div>
    </div>
  );
}
