'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { carouselOffset, readCarouselPosition } from '@/lib/carousel-position';

export function HomeCarousel({
  children,
  label,
  variant,
}: {
  children: ReactNode;
  label: string;
  variant: 'banner' | 'categories';
}) {
  const items = Children.toArray(children);
  const looping = variant === 'categories' && items.length > 1;
  const renderedItems = looping ? [...items, ...items, ...items, ...items, ...items] : items;
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrollAnimation = useRef<Animation | null>(null);
  const drag = useRef<{ x: number; y: number; scroll: number; moved: boolean; pointerId: number } | null>(null);
  const categoryOffsets = useRef<number[]>([]);
  const categoryPosition = useRef({ index: 0, progress: 0 });
  const suppressClick = useRef(false);
  const resumeAt = useRef(0);
  const pointerDown = useRef(false);
  const [active, setActive] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const interval = variant === 'banner' ? 5000 : 2800;

  function rememberCategoryPosition(left = viewport.current?.scrollLeft ?? 0) {
    if (!looping || !categoryOffsets.current.length) return;
    const position = readCarouselPosition(categoryOffsets.current, left);
    categoryPosition.current = { ...position, index: position.index % items.length };
  }

  function cancelDrag() {
    const tracking = drag.current;
    const element = viewport.current;
    drag.current = null;
    pointerDown.current = false;
    if (!element) return;
    if (tracking?.moved) suppressClick.current = true;
    if (tracking && element.hasPointerCapture(tracking.pointerId)) element.releasePointerCapture(tracking.pointerId);
    delete element.dataset.dragging;
    if (variant === 'banner') {
      for (const slide of track.current?.children ?? []) (slide as HTMLElement).style.removeProperty('opacity');
    }
  }

  function stopCategoryScroll() {
    const animation = scrollAnimation.current;
    const element = viewport.current;
    const rail = track.current;
    if (!animation || !element || !rail) return;
    const transform = getComputedStyle(rail).transform;
    const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
    const visiblePosition = element.scrollLeft - offset;
    scrollAnimation.current = null;
    animation.cancel();
    element.scrollTo({ left: visiblePosition, behavior: 'instant' });
    rememberCategoryPosition(visiblePosition);
    delete element.dataset.animating;
  }

  function scrollCategoryTo(target: number, instant = false, duration = 900) {
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    stopCategoryScroll();
    const start = element.scrollLeft;
    const destination = Math.max(0, Math.min(target, element.scrollWidth - element.clientWidth));
    if (instant || typeof rail.animate !== 'function') {
      element.scrollTo({ left: destination, behavior: 'instant' });
      rememberCategoryPosition(destination);
      delete element.dataset.animating;
      return;
    }
    element.dataset.animating = 'true';
    element.scrollTo({ left: destination, behavior: 'instant' });
    const distance = element.scrollLeft - start;
    const animation = reducedMotion
      ? rail.animate([{ opacity: 0.7 }, { opacity: 1 }], { duration: 180, easing: 'ease' })
      : rail.animate(
        [{ transform: `translateX(${distance}px)` }, { transform: 'translateX(0)' }],
        { duration, easing: getComputedStyle(element).getPropertyValue(duration === 900 ? '--home-ease-soft' : '--home-ease-out').trim() },
      );
    scrollAnimation.current = animation;
    animation.onfinish = () => {
      if (scrollAnimation.current !== animation) return;
      scrollAnimation.current = null;
      rememberCategoryPosition();
      delete element.dataset.animating;
    };
  }

  useEffect(() => () => { scrollAnimation.current?.cancel(); }, []);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) stopCategoryScroll();
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const releasePointer = () => {
      if (!pointerDown.current) return;
      pointerDown.current = false;
      resumeAt.current = Date.now() + interval;
    };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    return () => {
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
    };
  }, [interval]);

  function move(direction: number, instant = false) {
    if (variant === 'banner') {
      if (instant && viewport.current) {
        const element = viewport.current;
        element.dataset.instant = 'true';
        requestAnimationFrame(() => requestAnimationFrame(() => { delete element.dataset.instant; }));
      }
      setActive((index) => (index + direction + items.length) % items.length);
      return;
    }
    const element = viewport.current;
    if (!element) return;
    const slides = Array.from(track.current?.children ?? []) as HTMLElement[];
    const max = element.scrollWidth - element.clientWidth;
    const current = element.scrollLeft;
    let target: number;
    if (direction > 0) {
      target = current >= max - 2
        ? 0
        : slides.find((slide) => slide.offsetLeft > current + 2)?.offsetLeft ?? max;
    } else {
      target = current <= 2
        ? max
        : slides.findLast((slide) => slide.offsetLeft < current - 2)?.offsetLeft ?? 0;
    }
    scrollCategoryTo(target, instant, 250);
  }

  useEffect(() => {
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    let previousWidth = -1;
    const resize = new ResizeObserver(() => {
      if (!element.isConnected) return;
      const width = element.getBoundingClientRect().width;
      if (width === previousWidth) return;
      previousWidth = width;
      stopCategoryScroll();
      cancelDrag();
      setScrollable(variant === 'banner' ? items.length > 1 : element.scrollWidth > element.clientWidth + 2);
      if (looping) {
        categoryOffsets.current = Array.from(rail.children, child => (child as HTMLElement).offsetLeft);
        element.scrollTo({
          left: carouselOffset(categoryOffsets.current, {
            ...categoryPosition.current,
            index: items.length * 2 + categoryPosition.current.index,
          }),
          behavior: 'instant',
        });
      }
      resumeAt.current = Date.now() + interval;
      delete element.dataset.animating;
    });
    resize.observe(element);
    let settleTimer: ReturnType<typeof setTimeout>;
    const normalizeLoop = () => {
      if (!looping || drag.current || !element.isConnected) return;
      if (scrollAnimation.current) {
        settleTimer = setTimeout(normalizeLoop, 180);
        return;
      }
      const start = (rail.children[items.length] as HTMLElement).offsetLeft;
      const maximum = element.scrollWidth - element.clientWidth;
      const lower = Math.max(0, (maximum - start) / 2);
      if (element.scrollLeft >= lower + start) {
        element.scrollTo({ left: element.scrollLeft - start, behavior: 'instant' });
      } else if (element.scrollLeft < lower) {
        element.scrollTo({ left: element.scrollLeft + start, behavior: 'instant' });
      }
    };
    const onScroll = () => {
      if (!scrollAnimation.current) rememberCategoryPosition();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(normalizeLoop, 180);
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    if (looping) {
      element.querySelectorAll<HTMLElement>('[data-clone="true"] a').forEach((link) => {
        link.tabIndex = -1;
      });
    }
    return () => {
      resize.disconnect();
      element.removeEventListener('scroll', onScroll);
      clearTimeout(settleTimer);
    };
  }, [items.length, variant, looping]);

  useEffect(() => {
    const element = viewport.current;
    if (!element || !scrollable) return;
    const timer = window.setInterval(() => {
      const root = element.parentElement;
      const rect = element.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
      if (visibleHeight < rect.height * 0.3 || document.hidden || Date.now() < resumeAt.current || pointerDown.current || drag.current) return;
      if (root?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')) return;
      if (matchMedia('(hover: hover) and (pointer: fine)').matches && root?.matches(':hover')) return;
      if (variant === 'banner') {
        setActive((index) => (index + 1) % items.length);
        return;
      }
      const slides = Array.from(track.current?.children ?? []) as HTMLElement[];
      const next = slides.find((slide) => slide.offsetLeft > element.scrollLeft + 2);
      const max = element.scrollWidth - element.clientWidth;
      scrollCategoryTo(element.scrollLeft >= max - 2 ? 0 : Math.min(next?.offsetLeft ?? max, max));
    }, interval);
    return () => {
      clearInterval(timer);
    };
  }, [scrollable, variant, items.length, interval, reducedMotion]);

  return (
    <section
      aria-label={label}
      aria-roledescription="băng chuyền"
      className={`home-carousel home-carousel-${variant}`}
      data-autoplay="enabled"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      onFocusCapture={() => { if (variant === 'categories') stopCategoryScroll(); }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && variant === 'categories') stopCategoryScroll();
      }}
      onPointerDown={() => { pointerDown.current = true; }}
      onPointerUp={() => {
        pointerDown.current = false;
        resumeAt.current = Date.now() + interval;
      }}
      onPointerCancel={() => {
        pointerDown.current = false;
        resumeAt.current = Date.now() + interval;
      }}
      onWheel={(event) => {
        if (event.ctrlKey || event.metaKey) return;
        stopCategoryScroll();
        resumeAt.current = Date.now() + interval;
      }}
      onKeyDown={() => { resumeAt.current = Date.now() + interval; }}
    >
      <div
        ref={viewport}
        className="home-carousel-viewport"
        tabIndex={0}
        aria-label={`${label}, dùng phím mũi tên để xem tiếp`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            move(event.key === 'ArrowRight' ? 1 : -1, true);
          }
        }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (variant === 'categories') stopCategoryScroll();
          if (!event.isPrimary) { cancelDrag(); return; }
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if ((event.pointerType !== 'mouse' && variant !== 'banner') || event.button !== 0) return;
          drag.current = { x: event.clientX, y: event.clientY, scroll: event.currentTarget.scrollLeft, moved: false, pointerId: event.pointerId };
        }}
        onPointerMove={(event) => {
          const tracking = drag.current;
          if (!tracking) return;
          const delta = event.clientX - tracking.x;
          if (!tracking.moved && Math.abs(event.clientY - tracking.y) > Math.abs(delta)) return;
          if (Math.abs(delta) < 6 && !tracking.moved) return;
          tracking.moved = true;
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.dragging = 'true';
          if (variant === 'banner') {
            const slides = track.current!.children;
            const next = (active + (delta < 0 ? 1 : -1) + items.length) % items.length;
            const progress = Math.min(Math.abs(delta) / (event.currentTarget.clientWidth * 0.5), 1);
            for (const slide of slides) (slide as HTMLElement).style.opacity = '0';
            (slides[active] as HTMLElement).style.opacity = String(1 - progress);
            (slides[next] as HTMLElement).style.opacity = String(progress);
          } else {
            event.currentTarget.scrollLeft = tracking.scroll - delta;
          }
        }}
        onPointerUp={(event) => {
          const tracking = drag.current;
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
          if (!tracking?.moved) return;
          const element = event.currentTarget;
          if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
          if (variant === 'banner') {
            for (const slide of track.current!.children) (slide as HTMLElement).style.removeProperty('opacity');
            const distance = event.clientX - tracking.x;
            if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
            return;
          }
          const slides = Array.from(track.current?.children ?? []) as HTMLElement[];
          const nearest = slides.reduce((a, b) =>
            Math.abs(a.offsetLeft - element.scrollLeft) < Math.abs(b.offsetLeft - element.scrollLeft) ? a : b);
          scrollCategoryTo(nearest.offsetLeft, false, 250);
        }}
        onPointerCancel={(event) => {
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
          if (variant === 'banner') {
            for (const slide of track.current!.children) (slide as HTMLElement).style.removeProperty('opacity');
          }
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div ref={track} className="home-carousel-track">
          {renderedItems.map((item, index) => (
            <div
              className="home-carousel-slide"
              key={index}
              data-active={variant === 'banner' ? index === active : undefined}
              data-clone={looping && (index < items.length * 2 || index >= items.length * 3) ? 'true' : undefined}
              aria-hidden={looping && (index < items.length * 2 || index >= items.length * 3) ? true : undefined}
              inert={variant === 'banner' && index !== active ? true : undefined}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      {scrollable && (
        <div className="home-carousel-controls">
          <button type="button" aria-label={`${label} trước`} onClick={(event) => move(-1, event.detail === 0)}>
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <button type="button" aria-label={`${label} tiếp theo`} onClick={(event) => move(1, event.detail === 0)}>
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
