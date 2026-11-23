// Accept the official Share > Embed a map URL or copied iframe HTML. Never render HTML.
export function normalizeContactMapEmbedUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8000) return null;
  const raw = value.trim();
  const source = raw.startsWith('<') ? /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(raw)?.[2] : raw;
  if (!source) return null;
  try {
    const url = new URL(source.replaceAll('&amp;', '&'));
    if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || url.port || url.username || url.password
      || !['/maps/embed', '/maps/embed/'].includes(url.pathname) || !url.searchParams.get('pb')) return null;
    // Keep only Google's opaque embed configuration, not arbitrary parameters/HTML.
    const result = new URL('https://www.google.com/maps/embed');
    result.searchParams.set('pb', url.searchParams.get('pb')!);
    return result.href;
  } catch { return null; }
}
