'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const autoplayInterval = 5000;

type MoveOptions = { instant?: boolean; automatic?: boolean };

function bannerSwipeDistance(width: number) {
  return Math.min(96, Math.max(40, width * 0.12));
}

export function HomeCarousel({
  children,
  backdrop,
  label,
  variant,
}: {
  children: ReactNode;
  backdrop?: ReactNode;
  label: string;
  variant: 'banner' | 'categories';
}) {
  const items = Children.toArray(children);
  const looping = variant === 'categories' && items.length > 1;
  const renderedItems = looping ? [...items, ...items, ...items, ...items, ...items] : items;
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrollAnimation = useRef<Animation | null>(null);
  const categoryAutoplay = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const resumeAt = useRef(0);
  const pointerDown = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const interactionDelay = variant === 'banner' ? autoplayInterval : 1600;

  function stopCategoryScroll() {
    const animation = scrollAnimation.current;
    const element = viewport.current;
    const rail = track.current;
    if (!animation || !element || !rail) return;
    const transform = getComputedStyle(rail).transform;
    const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
    const visiblePosition = element.scrollLeft - offset;
    scrollAnimation.current = null;
    categoryAutoplay.current = false;
    animation.cancel();
    element.scrollTo({ left: visiblePosition, behavior: 'instant' });
  }

  function centerCategoryLoop(element: HTMLDivElement, rail: HTMLDivElement) {
    const nextCopy = rail.children[items.length];
    if (!looping || !nextCopy) return;
    const period = nextCopy.getBoundingClientRect().left - rail.children[0].getBoundingClientRect().left;
    const max = element.scrollWidth - element.clientWidth;
    if (period <= 0 || max < 2 * period) return;
    const lower = Math.min(2 * period, max - 2 * period);
    const position = element.scrollLeft;
    const offset = ((position - lower) % period + period) % period;
    const equivalent = lower + offset;
    if (Math.abs(equivalent - position) > 0.5) element.scrollLeft = equivalent;
  }

  function scrollCategoryTo(target: number, { instant, automatic }: MoveOptions) {
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    const start = element.scrollLeft;
    const destination = Math.max(0, Math.min(target, element.scrollWidth - element.clientWidth));
    if (instant || reducedMotion || typeof rail.animate !== 'function') {
      element.scrollTo({ left: destination, behavior: 'instant' });
      return;
    }
    element.scrollTo({ left: destination, behavior: 'instant' });
    const distance = element.scrollLeft - start;
    if (!distance) return;
    const easing = automatic ? '--home-ease-soft' : '--home-ease-out';
    const animation = rail.animate(
      [{ transform: `translateX(${distance}px)` }, { transform: 'translateX(0)' }],
      { duration: automatic ? 560 : 260, easing: getComputedStyle(element).getPropertyValue(easing).trim() },
    );
    scrollAnimation.current = animation;
    categoryAutoplay.current = Boolean(automatic);
    animation.onfinish = () => {
      if (scrollAnimation.current !== animation) return;
      scrollAnimation.current = null;
      categoryAutoplay.current = false;
    };
  }

  useEffect(() => () => { scrollAnimation.current?.cancel(); }, []);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const preview = new URLSearchParams(window.location.search).get('preview-motion');
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    const previewMotion = process.env.NODE_ENV === 'development'
      && (preview === 'on' || (loopback && preview !== 'off'));
    const update = () => {
      const reduce = preference.matches && !previewMotion;
      setReducedMotion(reduce);
      if (reduce) stopCategoryScroll();
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const releasePointer = (event: PointerEvent) => {
      if (pointerDown.current !== event.pointerId) return;
      pointerDown.current = null;
      resumeAt.current = Date.now() + interactionDelay;
      drag.current = null;
    };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    return () => {
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
    };
  }, [interactionDelay]);

  function move(direction: number, options: MoveOptions = {}) {
    if (!options.automatic) resumeAt.current = Date.now() + interactionDelay;
    if (variant === 'banner') {
      if (items.length < 2) return;
      if (options.instant && viewport.current) {
        const element = viewport.current;
        element.dataset.instant = 'true';
        requestAnimationFrame(() => requestAnimationFrame(() => { delete element.dataset.instant; }));
      }
      setActive((index) => (index + direction + items.length) % items.length);
      return;
    }
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    stopCategoryScroll();
    centerCategoryLoop(element, rail);
    const slides = Array.from(rail.children) as HTMLElement[];
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
    scrollCategoryTo(target, options);
  }

  useEffect(() => {
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    const resize = new ResizeObserver(() => {
      if (!element.isConnected) return;
      stopCategoryScroll();
      setScrollable(variant === 'banner' ? items.length > 1 : element.scrollWidth > element.clientWidth + 2);
      if (looping) {
        element.scrollLeft = (rail.children[items.length * 2] as HTMLElement).offsetLeft;
      }
    });
    resize.observe(element);
    const onScroll = () => {
      if (!scrollAnimation.current) {
        resumeAt.current = Math.max(resumeAt.current, Date.now() + 450);
      }
    };
    if (looping) element.addEventListener('scroll', onScroll, { passive: true });
    if (looping) {
      element.querySelectorAll<HTMLElement>('[data-clone="true"] a').forEach((link) => {
        link.tabIndex = -1;
      });
    }
    return () => {
      resize.disconnect();
      element.removeEventListener('scroll', onScroll);
    };
  }, [items.length, variant, looping]);

  useEffect(() => {
    const element = viewport.current;
    const root = element?.parentElement;
    if (!element || !root || !scrollable || reducedMotion) return;
    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.3;
      if (!visible && categoryAutoplay.current) stopCategoryScroll();
    }, { threshold: 0.3 });
    observer.observe(element);
    const onVisibility = () => {
      if (document.hidden && categoryAutoplay.current) stopCategoryScroll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(() => {
      if (!visible || document.hidden || Date.now() < resumeAt.current || pointerDown.current !== null || drag.current) return;
      if (root.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')) return;
      if (hover.matches && root.matches(':hover')) return;
      if (scrollAnimation.current) return;
      move(1, { automatic: true });
    }, autoplayInterval);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (categoryAutoplay.current) stopCategoryScroll();
    };
  }, [scrollable, variant, items.length, looping, reducedMotion]);

  return (
    <section
      aria-label={label}
      aria-roledescription="băng chuyền"
      className={`home-carousel home-carousel-${variant}`}
      data-autoplay={reducedMotion ? 'paused' : 'enabled'}
      data-motion={reducedMotion ? 'reduced' : 'full'}
      onFocusCapture={() => { if (variant === 'categories') stopCategoryScroll(); }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && variant === 'categories') stopCategoryScroll();
      }}
      onPointerDown={(event) => { if (event.isPrimary) pointerDown.current = event.pointerId; }}
      onPointerUp={(event) => {
        if (pointerDown.current !== event.pointerId) return;
        pointerDown.current = null;
        resumeAt.current = Date.now() + interactionDelay;
      }}
      onPointerCancel={(event) => {
        if (pointerDown.current !== event.pointerId) return;
        pointerDown.current = null;
        resumeAt.current = Date.now() + interactionDelay;
      }}
      onWheel={() => {
        stopCategoryScroll();
        resumeAt.current = Date.now() + interactionDelay;
      }}
      onKeyDown={() => { resumeAt.current = Date.now() + interactionDelay; }}
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
            move(event.key === 'ArrowRight' ? 1 : -1, { instant: true });
          }
        }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (variant === 'categories') stopCategoryScroll();
          if (!event.isPrimary || items.length < 2 || (event.pointerType !== 'mouse' && variant !== 'banner') || event.button !== 0) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: event.currentTarget.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const tracking = drag.current;
          if (!tracking || tracking.id !== event.pointerId) return;
          const delta = event.clientX - tracking.x;
          if (!tracking.moved && Math.abs(event.clientY - tracking.y) > Math.abs(delta)) return;
          if (Math.abs(delta) < 6 && !tracking.moved) return;
          if (!tracking.moved) {
            tracking.moved = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = 'true';
          }
          if (variant === 'banner') {
            const slides = track.current!.children;
            const next = (active + (delta < 0 ? 1 : -1) + items.length) % items.length;
            const progress = Math.min(Math.abs(delta) / (bannerSwipeDistance(event.currentTarget.clientWidth) * 1.5), 1);
            for (const slide of slides) (slide as HTMLElement).style.opacity = '0';
            (slides[active] as HTMLElement).style.opacity = String(1 - progress);
            (slides[next] as HTMLElement).style.opacity = String(progress);
          } else {
            event.currentTarget.scrollLeft = tracking.scroll - delta;
          }
        }}
        onPointerUp={(event) => {
          const tracking = drag.current;
          if (tracking && tracking.id !== event.pointerId) return;
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
          if (!tracking?.moved) return;
          const element = event.currentTarget;
          if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
          if (variant === 'banner') {
            for (const slide of track.current!.children) (slide as HTMLElement).style.removeProperty('opacity');
            const distance = event.clientX - tracking.x;
            if (Math.abs(distance) > bannerSwipeDistance(element.clientWidth)) move(distance < 0 ? 1 : -1);
            return;
          }
        }}
        onPointerCancel={(event) => {
          if (drag.current?.id !== event.pointerId) return;
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
        {backdrop}
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
          <button type="button" aria-label={`${label} trước`} onClick={(event) => move(-1, { instant: event.detail === 0 })}>
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <button type="button" aria-label={`${label} tiếp theo`} onClick={(event) => move(1, { instant: event.detail === 0 })}>
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
