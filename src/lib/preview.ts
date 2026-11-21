import { isAdminUser } from '../collections/access';
import { getSiteUrl } from './seo';

// PostgreSQL serial IDs must fit a signed int32; reject overflow before querying.
export function parsePreviewID(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

export function canPreview(user: unknown): boolean {
  return isAdminUser(user);
}

export function previewUrl(collection: 'products' | 'posts', value: unknown, siteUrl = getSiteUrl()): string | null {
  const id = parsePreviewID(value);
  if (id === null) return null;
  let base = 'http://localhost:3000';
  try {
    const url = new URL(siteUrl);
    if (url.protocol === 'http:' || url.protocol === 'https:') base = url.origin;
  } catch { /* Use the local fallback when the site URL is not configured correctly. */ }
  return `${base}/xem-truoc/${collection === 'products' ? 'san-pham' : 'blog'}/${id}`;
}
