'use client';

import { useEffect, useRef, useState } from 'react';
import { facebookPageFrameDimensions, facebookPageFrameWidth, facebookPagePluginUrl } from '@/lib/facebook-page';

export function FacebookPageFrame({ name, pageUrl }: { name: string; pageUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let resizeObserver: ResizeObserver | undefined;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => setWidth(facebookPageFrameWidth(element.clientWidth));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.02) return;
      observer.disconnect();
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measure, 180);
      });
      resizeObserver.observe(element);
    }, { threshold: 0.02 });
    const observe = () => observer.observe(element);

    // Leave off-screen embeds unrequested even if native lazy loading uses a larger margin.
    if (window.scrollY > 0) observe();
    else window.addEventListener('scroll', observe, { once: true, passive: true });

    return () => {
      window.removeEventListener('scroll', observe);
      observer.disconnect();
      resizeObserver?.disconnect();
      clearTimeout(resizeTimer);
    };
  }, []);

  const { height, maxWidth } = facebookPageFrameDimensions;

  return (
    <div ref={container} className="home-facebook-frame" style={{ height, maxWidth }}>
      <div className="home-facebook-skeleton" aria-hidden="true">
        <div><span /><span /><span /></div>
        <svg viewBox="0 0 280 150" preserveAspectRatio="xMidYMid slice" focusable="false">
          <path d="M-19 142C30 61 81 160 130 83c37-59 89-51 169-75v155H-19Z" fill="var(--home-sage)" />
          <path d="M-23 124C33 52 82 140 127 81c25-32 51-53 93-40 22 7 45 7 82-23" fill="none" stroke="var(--home-sage-ink)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 7" />
          <path d="M167 47v26m-13-13h26m33 35v14m-7-7h14" fill="none" stroke="var(--home-accent)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="82" cy="51" r="5" fill="var(--home-sage-ink)" />
          <circle cx="204" cy="35" r="3" fill="var(--home-accent)" />
        </svg>
        <span /><span />
      </div>
      {width !== null && (
        <iframe
          src={facebookPagePluginUrl(pageUrl, width)}
          title={`Bài viết mới trên trang Facebook ${name}`}
          width={width}
          height={height}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
