'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ArticleHeading } from '@/lib/article-content';

export function ArticleToc({ headings, mobile = false }: { headings: readonly ArticleHeading[]; mobile?: boolean }) {
  const [current, setCurrent] = useState<string>();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 64rem)');
    let cleanup = () => {};
    const connect = () => {
      cleanup();
      if (media.matches === mobile) return;
      const sections = headings.map(({ id }) => document.getElementById(id))
        .filter((section): section is HTMLElement => Boolean(section));
      let frame = 0;
      const update = () => {
        frame = 0;
        const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
        const line = Math.max(0, headerBottom) + 28;
        const passed = sections.findLast((section) => section.getBoundingClientRect().top <= line);
        setCurrent(passed?.id ?? sections[0]?.id);
      };
      const schedule = () => {
        if (!frame) frame = window.requestAnimationFrame(update);
      };
      const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(schedule);
      sections.forEach((section) => observer?.observe(section));
      // A scroll sample also handles jumps that cross the reading line between IO callbacks.
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      schedule();
      cleanup = () => {
        observer?.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        window.cancelAnimationFrame(frame);
      };
    };
    connect();
    media.addEventListener('change', connect);
    return () => {
      cleanup();
      media.removeEventListener('change', connect);
    };
  }, [headings, mobile]);

  const list = (
    <nav aria-label={mobile ? 'Mục lục trên điện thoại' : 'Mục lục'}>
      <ol className="article-toc-list">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? 'article-toc-subitem' : undefined}>
            <a href={`#${id}`} aria-current={current === id ? 'true' : undefined}>{text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
  return mobile ? (
    <details className="article-tile article-toc article-toc-mobile">
      <summary>Mục lục <ChevronDown size={18} aria-hidden="true" /></summary>
      {list}
    </details>
  ) : (
    <section className="article-tile article-toc article-toc-desktop">
      <h2>Mục lục</h2>
      {list}
    </section>
  );
}
