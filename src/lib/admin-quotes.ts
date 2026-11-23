import type { QuoteRequest } from '@/payload-types';

type QuoteStatus = QuoteRequest['status'];

export const quoteStages = [
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'quoted', label: 'Đã gửi báo giá' },
  { value: 'closed', label: 'Hoàn tất' },
] as const satisfies readonly { value: QuoteStatus; label: string }[];

// Follow up once a new request has waited more than 24 elapsed hours.
export const QUOTE_WAIT_HOURS = 24;
const hourMs = 60 * 60 * 1000;

export function quoteWaitingCutoff(now: number) {
  return now - QUOTE_WAIT_HOURS * hourMs;
}

export function isWaitingQuote(status: QuoteStatus, createdAt: string, now: number) {
  return status === 'new' && Date.parse(createdAt) < quoteWaitingCutoff(now);
}

export function nextQuoteStage(status: unknown) {
  const index = quoteStages.findIndex(stage => stage.value === status);
  return index < 0 ? undefined : quoteStages[index + 1];
}

const relativeTime = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'always' });
const exactTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh',
});

export function quoteReceivedTime(createdAt: string, now: number) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return null;
  const elapsed = Math.max(0, now - timestamp);
  const value = elapsed < 60_000 ? 'Vừa xong'
    : elapsed < hourMs ? relativeTime.format(-Math.floor(elapsed / 60_000), 'minute')
    : elapsed < 24 * hourMs ? relativeTime.format(-Math.floor(elapsed / hourMs), 'hour')
    : relativeTime.format(-Math.floor(elapsed / (24 * hourMs)), 'day');
  return { value, exact: `${exactTime.format(timestamp)} (giờ Việt Nam)` };
}

export function quotePhoneLinks(phone: string) {
  const compact = phone.trim().replace(/[ ().-]/g, '');
  const match = /^(?:0|\+?84)([1-9]\d{8,9})$/.exec(compact);
  if (!match) return null;
  const national = match[1];
  return {
    tel: `tel:+84${national}`,
    zalo: /^[35789]\d{8}$/.test(national) ? `https://zalo.me/0${national}` : null,
  };
}
