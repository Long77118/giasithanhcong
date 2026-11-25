'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

function hasHoverSpace() {
  return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 40rem)').matches;
}

export function ProductChoiceReveal({ name, href, image, children }: {
  name: string;
  href: string;
  image: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mode = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 40rem)');
    const resetHover = () => {
      if (overlay.current?.contains(document.activeElement)) trigger.current?.focus({ preventScroll: true });
      setOpen(false);
    };
    mode.addEventListener('change', resetHover);
    return () => mode.removeEventListener('change', resetHover);
  }, []);

  return (
    <article
      className="product-choice-card"
      data-open={open || undefined}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse' && hasHoverSpace()) setOpen(true);
      }}
      onPointerLeave={event => {
        const focused = document.activeElement;
        if (!focused || !event.currentTarget.contains(focused) || !focused.matches(':focus-visible')) setOpen(false);
      }}
      onFocusCapture={event => {
        if (hasHoverSpace() && event.target.matches(':focus-visible')) setOpen(true);
      }}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={event => {
        if (event.key === 'Escape' && !touchOpen) {
          event.stopPropagation();
          trigger.current?.focus();
          setOpen(false);
        }
      }}
    >
      <div className="product-choice-photo">
        {image}
        <button
          ref={trigger}
          type="button"
          className="product-choice-trigger"
          aria-label={`Xem thông tin ${name}`}
          aria-expanded={open || touchOpen}
          aria-controls={touchOpen ? `${id}-dialog` : `${id}-details`}
          onClick={event => {
            const pointer = event.nativeEvent;
            const directTouch = 'pointerType' in pointer && (pointer.pointerType === 'touch' || pointer.pointerType === 'pen');
            if (hasHoverSpace() && !directTouch) setOpen(true);
            else {
              dialog.current?.showModal();
              setTouchOpen(true);
            }
          }}
        />
        <div ref={overlay} className="product-choice-overlay" id={`${id}-details`} aria-hidden={!open} inert={!open}>
          <div className="product-choice-info">{children}</div>
        </div>
      </div>
      <h3 className="product-choice-name"><Link href={href} prefetch={false}>{name}</Link></h3>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        className="product-choice-dialog"
        aria-labelledby={`${id}-title`}
        onClose={() => { setTouchOpen(false); setOpen(false); }}
        onClick={event => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
          }
        }}
      >
        <div className="product-choice-dialog-heading">
          <h3 id={`${id}-title`}>{name}</h3>
          <button type="button" autoFocus aria-label="Đóng thông tin sản phẩm" onClick={() => dialog.current?.close()}><X size={21} aria-hidden="true" /></button>
        </div>
        <div className="product-choice-info">{children}</div>
      </dialog>
    </article>
  );
}
