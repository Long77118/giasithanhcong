import { safeRichTextHref } from './rich-text';

export function normalizeHomePromotionHref(value: unknown): string | undefined {
  const href = safeRichTextHref(value);
  return href && (href.startsWith('/') || /^https?:\/\//i.test(href)) ? href : undefined;
}
