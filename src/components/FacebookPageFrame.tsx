'use client';

import { useEffect, useRef, useState } from 'react';
import { Facebook } from 'lucide-react';

const frameHeight = 240;

export function FacebookPageFrame({ name, pageUrl }: { name: string; pageUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry || entry.intersectionRatio < 0.02 || entry.boundingClientRect.width < 180) return;
        setWidth(Math.min(500, Math.floor(entry.boundingClientRect.width)));
        observer?.disconnect();
      }, { threshold: 0.02 });
      observer.observe(element);
    };

    // A tall viewport may already reveal part of the sidebar on arrival.
    if (window.scrollY > 0) observe();
    else window.addEventListener('scroll', observe, { once: true, passive: true });

    return () => {
      window.removeEventListener('scroll', observe);
      observer?.disconnect();
    };
  }, []);

  const src = width && `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
    href: pageUrl,
    tabs: 'timeline',
    width: String(width),
    height: String(frameHeight),
    adapt_container_width: 'true',
    show_facepile: 'false',
    locale: 'vi_VN',
  })}`;

  return (
    <div ref={container} className="home-facebook-frame">
      {src ? (
        <iframe
          src={src}
          title={`Fanpage Facebook ${name}`}
          width={width}
          height={frameHeight}
          loading="lazy"
          className="block h-full w-full border-0"
        />
      ) : (
        <Facebook size={33} aria-hidden="true" />
      )}
    </div>
  );
}
