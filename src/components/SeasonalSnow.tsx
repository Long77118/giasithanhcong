'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { ActiveSeason } from '@/lib/seasonal-theme';

const SnowCanvas = dynamic(() => import('./SnowCanvas'), { ssr: false });
const preferenceKey = 'storefront:seasonal:snow';
const reducedMotion = '(prefers-reduced-motion: reduce)';

function readSnowPreference() {
  try {
    return localStorage.getItem(preferenceKey) !== 'off';
  } catch {
    return true;
  }
}

export default function SeasonalSnow({ intensity }: Pick<ActiveSeason, 'intensity'>) {
  const [enabled, setEnabled] = useState(readSnowPreference);
  const [motionAllowed, setMotionAllowed] = useState(() => !window.matchMedia(reducedMotion).matches);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(reducedMotion);
    const sync = () => setMotionAllowed(!media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!enabled || !motionAllowed || ready) return;

    let cancel: (() => void) | undefined;
    const schedule = () => {
      if (cancel || document.hidden || document.readyState !== 'complete') return;
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(() => setReady(true));
        cancel = () => window.cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(() => setReady(true), 200);
        cancel = () => window.clearTimeout(id);
      }
    };
    const syncVisibility = () => {
      if (document.hidden) {
        cancel?.();
        cancel = undefined;
      } else schedule();
    };
    window.addEventListener('load', schedule);
    document.addEventListener('visibilitychange', syncVisibility);
    schedule();

    return () => {
      cancel?.();
      window.removeEventListener('load', schedule);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [enabled, motionAllowed, ready]);

  if (!motionAllowed) return null;

  const footer = document.getElementById('site-footer-content');
  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(preferenceKey, next ? 'on' : 'off');
    } catch {
      // The control still works for the current page when storage is unavailable.
    }
  };

  return (
    <>
      {enabled && ready && createPortal(<SnowCanvas intensity={intensity} />, document.body)}
      {footer && createPortal(
        <div className="seasonal-snow-control">
          <button type="button" aria-label="Tuyết" aria-pressed={enabled} onClick={toggle}>
            <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" focusable="false">
              <path d="M10 2.5v15M3.5 6.25l13 7.5m0-7.5-13 7.5M7.75 4.75 10 7l2.25-2.25m-4.5 10.5L10 13l2.25 2.25M4.3 9.35l3.1-.85-.85-3.1m6.9 9.2-.85-3.1 3.1-.85m-9.15 3.95.85-3.1-3.1-.85m11.4-1.3-3.1-.85.85-3.1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span aria-hidden="true">Tuyết: {enabled ? 'bật' : 'tắt'}</span>
          </button>
        </div>,
        footer,
      )}
    </>
  );
}
