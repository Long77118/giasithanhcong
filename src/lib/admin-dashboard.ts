import type { Where } from 'payload';
import { quoteWaitingCutoff } from './admin-quotes';

export function getDashboardFilters(now: Date) {
  const newQuotes = { status: { equals: 'new' } };
  const waitCutoff = new Date(quoteWaitingCutoff(now.getTime())).toISOString();
  return {
    newQuotes,
    waitingQuotes: { and: [newQuotes, { createdAt: { less_than: waitCutoff } }] },
    drafts: { status: { equals: 'draft' } },
    missingImages: { 'images.image': { exists: false } },
    missingSeoDescription: { or: [
      { 'meta.description': { exists: false } },
      { 'meta.description': { equals: '' } },
    ] },
  } satisfies Record<string, Where>;
}

export function dashboardListHref(adminPath: string, collection: string, where: Where) {
  const params = new URLSearchParams();
  function addFilter(prefix: string, value: unknown) {
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) addFilter(`${prefix}[${key}]`, item);
    } else if (value !== undefined) {
      params.set(prefix, String(value));
    }
  }
  addFilter('where', where);
  return `${adminPath}/collections/${collection}?${params}`;
}

export function adminLoginGreeting(hour: number) {
  if (hour < 11) return 'Chào buổi sáng!';
  if (hour < 14) return 'Chào buổi trưa!';
  if (hour < 18) return 'Chào buổi chiều!';
  return 'Chào buổi tối!';
}
