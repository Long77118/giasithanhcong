'use client';

import { useEffect } from 'react';
import type { ActiveSeason } from '@/lib/seasonal-theme';

export type SeasonalScopeConfig = Pick<ActiveSeason, 'theme' | 'expiresAt'>;

export default function SeasonalScope({ theme, expiresAt, pathname }: SeasonalScopeConfig & { pathname: string }) {
  useEffect(() => {
    const { body } = document;
    const main = document.getElementById('main-content');
    if (!main) return;

    let expiryTimer: number | undefined;
    const syncScope = () => {
      window.clearTimeout(expiryTimer);
      const remaining = expiresAt === null ? Infinity : expiresAt - Date.now();
      if (remaining > 0 && !main.querySelector('[data-season-excluded]')) body.dataset.season = theme;
      else delete body.dataset.season;

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

  return null;
}
