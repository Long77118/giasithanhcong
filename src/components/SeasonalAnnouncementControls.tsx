'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getChristmasCountdown, seasonalAnnouncementStorageKey } from '@/lib/seasonal-theme';

type Countdown = NonNullable<ReturnType<typeof getChristmasCountdown>>;

function ChristmasCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const update = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      const now = Date.now();
      const remaining = getChristmasCountdown(new Date(now));
      setCountdown(remaining);
      if (remaining) timer = window.setTimeout(update, 1000 - now % 1000);
    };
    document.addEventListener('visibilitychange', update);
    update();

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  if (!countdown) return null;
  const { days, hours, minutes, seconds, deadline } = countdown;
  const clock = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
  return (
    <div className="seasonal-countdown">
      <span className="seasonal-countdown-label" aria-hidden="true">Đến hết 25/12</span>
      <span className="sr-only">Còn {days} ngày, {hours} giờ, {minutes} phút và {seconds} giây đến hết ngày 25 tháng 12</span>
      <time dateTime={new Date(deadline).toISOString()} aria-hidden="true">
        {days} ngày <b>{clock}</b>
      </time>
    </div>
  );
}

export default function SeasonalAnnouncementControls() {
  const [dismissedIdentity, setDismissedIdentity] = useState<string>();
  const notice = document.getElementById('seasonal-announcement');
  const identity = notice?.dataset.announcementKey;

  useEffect(() => {
    if (!notice || !identity) return;
    try {
      if (localStorage.getItem(seasonalAnnouncementStorageKey) === identity) {
        notice.dataset.dismissed = 'true';
        setDismissedIdentity(identity);
      } else {
        delete notice.dataset.dismissed;
      }
    } catch {
      // Dismissing still works for the current page when storage is unavailable.
    }
  }, [notice, identity]);

  if (!notice || !identity || dismissedIdentity === identity) return null;

  const closeSlot = notice.querySelector('[data-seasonal-close-slot]');
  const countdownSlot = notice.querySelector('[data-seasonal-countdown-slot]');
  const close = () => {
    try {
      localStorage.setItem(seasonalAnnouncementStorageKey, identity);
    } catch {
      // Keep the current-page dismissal even if storage is blocked.
    }
    notice.dataset.dismissed = 'true';
    setDismissedIdentity(identity);
    const headerControls = document.querySelectorAll<HTMLElement>('.site-header-bar-inner :is(a[href], summary, button:not([disabled]))');
    Array.from(headerControls).find(control => !control.closest('[inert]') && control.getClientRects().length)?.focus({ preventScroll: true });
  };

  return (
    <>
      {countdownSlot && createPortal(<ChristmasCountdown />, countdownSlot)}
      {closeSlot && createPortal(
        <button type="button" className="seasonal-announcement-close" aria-label="Đóng thông báo Giáng sinh" onClick={close}>
          <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>,
        closeSlot,
      )}
    </>
  );
}
