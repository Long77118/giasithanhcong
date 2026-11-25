import Link from 'next/link';
import {
  getChristmasCountdown,
  getSeasonalAnnouncementIdentity,
  seasonalAnnouncementStorageKey,
  type ActiveSeason,
} from '@/lib/seasonal-theme';
import './seasonal-announcement.css';

// Only static code runs before paint. CMS text stays in escaped HTML attributes and text nodes.
const restoreDismissedAnnouncement = `try{const notice=document.currentScript.parentElement;if(localStorage.getItem(${JSON.stringify(seasonalAnnouncementStorageKey)})===notice.dataset.announcementKey)notice.dataset.dismissed='true'}catch{}`;

export function SeasonalAnnouncement({ announcement, now }: { announcement: NonNullable<ActiveSeason['announcement']>; now: Date }) {
  return (
    <aside
      id="seasonal-announcement"
      className="seasonal-announcement"
      aria-label="Thông báo Giáng sinh"
      data-announcement-key={getSeasonalAnnouncementIdentity(announcement, now)}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: restoreDismissedAnnouncement }} />
      <div className="site-shell seasonal-announcement-inner">
        <div className="seasonal-announcement-message">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M10 1.5c.8 5.5 3 7.7 8.5 8.5-5.5.8-7.7 3-8.5 8.5C9.2 13 7 10.8 1.5 10 7 9.2 9.2 7 10 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
          </svg>
          <p>
            {announcement.text}
            {announcement.href && <Link href={announcement.href} prefetch={false} className="seasonal-announcement-link">Xem chi tiết</Link>}
          </p>
        </div>
        {getChristmasCountdown(now) && <div className="seasonal-announcement-countdown" data-seasonal-countdown-slot />}
        <div className="seasonal-announcement-close-slot" data-seasonal-close-slot />
      </div>
    </aside>
  );
}
