export const publicSlugMaxLength = 160;
const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const publicContentPrefixes = {
  products: '/san-pham',
  'product-categories': '/danh-muc',
  posts: '/blog',
} as const;

export type PublicContentCollection = keyof typeof publicContentPrefixes;
export type PublicSearchParams = Record<string, string | string[] | undefined>;

export function isPublicContentCollection(value: string | undefined): value is PublicContentCollection {
  return value !== undefined && Object.hasOwn(publicContentPrefixes, value);
}

export function isValidPublicSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= publicSlugMaxLength && publicSlugPattern.test(value);
}

export function publicContentPath(collection: PublicContentCollection, slug: string): string {
  return `${publicContentPrefixes[collection]}/${encodeURIComponent(slug)}`;
}

export function decodePublicSlugParam(param: string): string | null {
  // The App Router supplies an encoded path segment, including for legacy slugs.
  try {
    const slug = decodeURIComponent(param);
    return slug.includes('\0') ? null : slug;
  } catch {
    return null;
  }
}

export function parsePublicContentPath(path: string): { collection: PublicContentCollection; slug: string } | null {
  const separator = path.lastIndexOf('/');
  const prefix = path.slice(0, separator);
  for (const collection of Object.keys(publicContentPrefixes) as PublicContentCollection[]) {
    if (publicContentPrefixes[collection] === prefix) {
      const slug = decodePublicSlugParam(path.slice(separator + 1));
      return slug ? { collection, slug } : null;
    }
  }
  return null;
}

export function withPublicSearchParams(path: string, params: PublicSearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (value !== undefined) {
      search.append(key, value);
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function toVietnameseSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parsePositivePage(raw?: string | string[] | null): number | null {
  if (raw == null) return 1;
  if (typeof raw !== 'string' || !/^[0-9]+$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}
