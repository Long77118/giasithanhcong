import { asRecord } from './rich-text';

export type ArticleHeading = { id: string; text: string; level: 2 | 3; index: number };

export function articleHeadingSlug(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'muc';
}

function children(node: Record<string, unknown> | undefined): unknown[] {
  return Array.isArray(node?.children) ? node.children : [];
}

function textOf(value: unknown, separator: string): string {
  const node = asRecord(value);
  if (node?.type === 'text' && typeof node.text === 'string') return node.text;
  if (node?.type === 'linebreak' || node?.type === 'tab') return ' ';
  const joiner = node?.type === 'paragraph' || node?.type === 'heading' || node?.type === 'link'
    || node?.type === 'autolink' || node?.type === 'quote' ? '' : separator;
  return children(node).map((child) => textOf(child, separator)).join(joiner);
}

export function extractArticleHeadings(data: unknown): ArticleHeading[] {
  const seen = new Set<string>();
  const nextSuffix = new Map<string, number>();
  const headings: ArticleHeading[] = [];
  children(asRecord(asRecord(data)?.root)).forEach((value, index) => {
    const node = asRecord(value);
    if (node?.type !== 'heading' || (node.tag !== 'h2' && node.tag !== 'h3')) return;
    const text = textOf(node, '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const base = articleHeadingSlug(text);
    let id = base;
    let suffix = nextSuffix.get(base) ?? 2;
    while (seen.has(id)) id = `${base}-${suffix++}`;
    nextSuffix.set(base, suffix);
    seen.add(id);
    // Scope the IDs to the article so a heading cannot collide with the site chrome.
    headings.push({ id: `bai-viet-${id}`, text, level: node.tag === 'h2' ? 2 : 3, index });
  });
  return headings;
}

export function articleWordCount(data: unknown): number {
  const text = textOf(asRecord(data)?.root, ' ');
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return words?.length ?? 0;
}

export function articleReadingMinutes(data: unknown): number {
  return Math.max(1, Math.ceil(articleWordCount(data) / 200));
}

export function formatArticleDate(iso?: string | null): string {
  const date = new Date(iso ?? '');
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
}
