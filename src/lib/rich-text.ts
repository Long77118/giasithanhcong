import { isPublicContentCollection, publicContentPath, withPublicSearchParams } from './slug';

export const richTextCollections = ['products', 'posts', 'product-categories', 'post-categories'] as const;

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function safeRichTextHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const href = value.trim();
  if (!href || /[\\\u0000-\u001f\u007f]/.test(href)) return undefined;
  if (href.startsWith('//')) return undefined;
  if (/^[/#?]/.test(href)) return href;
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

/** Public queries populate relationships with access control; unresolved/draft targets stay unlinked. */
export function publicDocumentLink(reference: unknown): { href: string; label: string } | undefined {
  const ref = asRecord(reference);
  const doc = asRecord(ref?.value);
  if (!doc || doc.status !== 'published' || typeof doc.slug !== 'string' || !doc.slug.trim()) return undefined;
  const collection = ref?.relationTo;
  if (typeof collection !== 'string') return undefined;
  let href: string;
  if (isPublicContentCollection(collection)) {
    href = publicContentPath(collection, doc.slug);
  } else if (collection === 'post-categories') {
    href = withPublicSearchParams('/blog', { category: doc.slug });
  } else {
    return undefined;
  }
  const label = typeof doc.title === 'string' ? doc.title : typeof doc.name === 'string' ? doc.name : doc.slug;
  return { href, label };
}

export function richTextImage(value: unknown, fields?: unknown) {
  const media = asRecord(value);
  const overrides = asRecord(fields);
  if (!media || typeof media.mimeType !== 'string' || !/^image\/(jpeg|png|webp|avif)$/.test(media.mimeType)) return undefined;
  const src = safeRichTextHref(media.url);
  if (!src || (!src.startsWith('/') && !/^https?:\/\//i.test(src))) return undefined;
  const dimension = (number: unknown) => typeof number === 'number' && Number.isFinite(number) && number > 0 ? number : undefined;
  const width = dimension(media.width);
  const height = dimension(media.height);
  // CMS thumbnails may be cropped: only use sizes that preserve the original image ratio.
  const candidates = new Map<number, string>();
  if (width && height) {
    for (const size of Object.values(asRecord(media.sizes) ?? {})) {
      const image = asRecord(size);
      const w = dimension(image?.width), h = dimension(image?.height);
      const url = safeRichTextHref(image?.url);
      if (w && h && url && (url.startsWith('/') || /^https?:\/\//i.test(url)) && Math.abs(h - w * height / width) <= 1) candidates.set(w, url);
    }
    candidates.set(width, src);
  }
  const alt = typeof overrides?.alt === 'string' ? overrides.alt : typeof media.alt === 'string' ? media.alt : '';
  const caption = typeof overrides?.caption === 'string' ? overrides.caption : typeof media.caption === 'string' ? media.caption : undefined;
  return { src, width, height, alt, caption, srcSet: candidates.size > 1 ? [...candidates].sort(([a], [b]) => a - b).map(([w, url]) => `${url} ${w}w`).join(', ') : undefined };
}
