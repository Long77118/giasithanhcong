'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ActiveSeason } from '@/lib/seasonal-theme';
import './seasonal.css';

const SeasonalSnow = dynamic(() => import('./SeasonalSnow'), { ssr: false });
const SeasonalAnnouncementControls = dynamic(() => import('./SeasonalAnnouncementControls'), { ssr: false });
const ChristmasDecorations = dynamic(() => import('./ChristmasDecorations'), { ssr: false });
const SeasonalScrollEffects = dynamic(() => import('./SeasonalScrollEffects'), { ssr: false });

export type SeasonalScopeConfig = Pick<ActiveSeason, 'theme' | 'expiresAt' | 'intensity' | 'snow' | 'lights' | 'decorations' | 'scrollEffects'>;

function ChristmasLights() {
  const bulbAnchors = [[27, 6], [76, 9], [124, 9], [173, 6]];
  return (
    <div className="seasonal-lights site-shell" aria-hidden="true">
      {Array.from({ length: 6 }, (_, strand) => (
        <svg key={strand} viewBox="0 0 200 19" preserveAspectRatio="none" focusable="false">
          <path className="seasonal-lights-wire" d="M0 2C57 12 145 12 200 2" />
          {bulbAnchors.map(([x, y]) => (
            <g key={x} className="seasonal-lights-bulb" transform={`translate(${x} ${y})`}>
              <path d="M-2 0h4v2h-4z" />
              <ellipse cy="5.1" rx="3.1" ry="3.6" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}

export default function SeasonalScope({ theme, expiresAt, pathname, intensity, snow, lights, decorations, scrollEffects, hasAnnouncement }:
  SeasonalScopeConfig & { pathname: string; hasAnnouncement: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const { body } = document;
    const main = document.getElementById('main-content');
    if (!main) return;

    let expiryTimer: number | undefined;
    const syncScope = () => {
      window.clearTimeout(expiryTimer);
      const remaining = expiresAt === null ? Infinity : expiresAt - Date.now();
      const canShow = remaining > 0 && !main.querySelector('[data-season-excluded]');
      if (canShow) body.dataset.season = theme;
      else delete body.dataset.season;
      const notice = document.getElementById('seasonal-announcement');
      if (notice) notice.hidden = remaining <= 0;
      setActive(canShow);

      if (remaining <= 0) observer.disconnect();
      else if (Number.isFinite(remaining)) expiryTimer = window.setTimeout(syncScope, Math.min(remaining, 2_147_483_647));
    };

    // A streamed 404 or error can replace the page while the header stays mounted.
    const observer = new MutationObserver(syncScope);
    observer.observe(main, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', syncScope);
    syncScope();

    return () => {
      observer.disconnect();
      window.clearTimeout(expiryTimer);
      document.removeEventListener('visibilitychange', syncScope);
      delete body.dataset.season;
    };
  }, [theme, expiresAt, pathname]);

  if (!active) return null;
  return (
    <>
      {lights && <ChristmasLights />}
      {snow && <SeasonalSnow intensity={intensity} />}
      {hasAnnouncement && <SeasonalAnnouncementControls />}
      {decorations && pathname === '/' && <ChristmasDecorations />}
      {scrollEffects && <SeasonalScrollEffects pathname={pathname} />}
    </>
  );
}
