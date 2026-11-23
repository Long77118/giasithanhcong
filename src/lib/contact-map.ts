const embedUrl = 'https://www.google.com/maps/embed';
const maxEmbedLength = 8000;

// Accept the official Share > Embed a map URL or copied iframe HTML. Never render HTML.
export function normalizeContactMapEmbedUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > maxEmbedLength) return null;
  const raw = value.trim();
  const source = raw.startsWith('<') ? /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(raw)?.[2] : raw;
  if (!source) return null;
  const href = source.trim().replaceAll('&amp;', '&');
  // URL normalizes an explicit :443 away, so check the authority before parsing.
  if (!/^https:\/\/www\.google\.com\//i.test(href)) return null;
  try {
    const url = new URL(href);
    if (!['/maps/embed', '/maps/embed/'].includes(url.pathname)) return null;

    // Read from the parsed query to keep Google's encoding and discard every other parameter.
    const pb = url.search.slice(1).split('&').find(part => new URLSearchParams(`?${part}`).has('pb'));
    const separator = pb?.indexOf('=') ?? -1;
    if (!pb || separator === -1 || separator === pb.length - 1) return null;
    const result = `${embedUrl}?pb=${pb.slice(separator + 1)}`;
    return result.length <= maxEmbedLength ? result : null;
  } catch { return null; }
}
