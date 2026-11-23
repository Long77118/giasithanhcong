'use client';

import { Children, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const ShelfMotion = createContext({ step: 0, autoplay: false });

export function HomeCategorySliderGroup({ children, canRotate }: { children: ReactNode; canRotate: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoplay = canRotate && visible && pageVisible && !reducedMotion && !hovered && !focused && !dragging && !paused;
  const motion = useMemo(() => ({ step, autoplay }), [step, autoplay]);
  const move = useCallback((direction: number) => setStep(current => current + direction), []);

  useEffect(() => {
    if (!canRotate || !root.current) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    // Watch individual cards: on mobile the group can be taller than the viewport.
    const visibleCards = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= .25) visibleCards.add(entry.target);
        else visibleCards.delete(entry.target);
      }
      setVisible(visibleCards.size > 0);
    }, { threshold: .25 });
    for (const card of root.current.children) observer.observe(card);
    preference.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [canRotate]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => move(1), 2500);
    return () => clearInterval(timer);
  }, [autoplay, move]);

  return (
    <ShelfMotion value={motion}>
      <div
        ref={root}
        className="home-shelves-grid"
        data-autoplay={autoplay ? 'running' : 'paused'}
        data-step={step}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
        onPointerLeave={event => {
          setHovered(false);
          if (!gesture.current || !event.currentTarget.hasPointerCapture(gesture.current.id)) {
            gesture.current = null;
            setDragging(false);
          }
        }}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onKeyDown={event => {
          if (!(event.target as HTMLElement).classList.contains('home-shelf-viewport')) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            move(event.key === 'ArrowRight' ? 1 : -1);
          } else if (event.key === ' ') {
            event.preventDefault();
            setPaused(current => !current);
          }
        }}
        onPointerDown={event => {
          suppressClick.current = false;
          if (!event.isPrimary || event.button !== 0) return;
          gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
          setDragging(true);
        }}
        onPointerMove={event => {
          const start = gesture.current;
          if (!start) return;
          const dx = Math.abs(event.clientX - start.x);
          if (dx > 12 && dx > Math.abs(event.clientY - start.y)) {
            event.currentTarget.setPointerCapture(event.pointerId);
            suppressClick.current = true;
          }
        }}
        onPointerUp={event => {
          const start = gesture.current;
          gesture.current = null;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(event.clientY - start.y)) move(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { gesture.current = null; setDragging(false); }}
        onLostPointerCapture={() => { gesture.current = null; setDragging(false); }}
        onClickCapture={event => {
          if (!suppressClick.current || event.detail === 0) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
        onDragStart={event => event.preventDefault()}
      >
        {children}
      </div>
    </ShelfMotion>
  );
}

export function HomeCategorySlider({ children, label }: { children: ReactNode; label: string }) {
  const pages = Children.toArray(children);
  const { step, autoplay } = useContext(ShelfMotion);
  const active = ((step % pages.length) + pages.length) % pages.length;
  return (
    <div className="home-shelf-slider" role="region" aria-roledescription="băng chuyền" aria-label={label}>
      <div className="home-shelf-viewport" tabIndex={pages.length > 1 ? 0 : undefined} data-page={active + 1} aria-label={`${label}. Phím mũi tên để chuyển cả nhóm, phím cách để dừng hoặc tiếp tục.`}>
        <div className="home-shelf-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {pages.map((page, index) => (
            <div key={index} className="home-shelf-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${pages.length}`} aria-hidden={index !== active} inert={index !== active}>
              {page}
            </div>
          ))}
        </div>
      </div>
      {pages.length > 1 && <span className="sr-only" aria-live={autoplay ? 'off' : 'polite'}>Nhóm sản phẩm {active + 1} trên {pages.length}</span>}
    </div>
  );
}
