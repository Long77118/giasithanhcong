const facebookOrigin = 'https://www.facebook.com';
const facebookHosts = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'];
const reservedPaths = new Set([
  'events', 'groups', 'help', 'login', 'marketplace', 'pages', 'people', 'plugins',
  'reel', 'reels', 'share', 'sharer', 'watch',
]);

export function normalizeFacebookPageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const url = URL.parse(value.trim());
  if (
    !url || url.protocol !== 'https:' || !facebookHosts.includes(url.hostname) ||
    url.username || url.password || url.port
  ) return null;

  const pathname = url.pathname.replace(/\/$/, '');
  if (pathname === '/profile.php') {
    const id = url.searchParams.get('id');
    return id && /^\d+$/.test(id) ? `${facebookOrigin}/profile.php?id=${id}` : null;
  }

  const pageId = pathname.match(/^\/(?:pages|people)\/[^/]+\/(\d+)$/)?.[1];
  if (pageId) return `${facebookOrigin}/${pageId}`;

  const username = pathname.slice(1);
  if (!/^[a-z\d]+(?:\.[a-z\d]+)*$/i.test(username) || reservedPaths.has(username.toLowerCase())) {
    return null;
  }
  return `${facebookOrigin}/${username}`;
}

export const facebookPageFrameDimensions = { minWidth: 180, maxWidth: 500, height: 320 } as const;

export function facebookPageFrameWidth(availableWidth: number): number | null {
  const { minWidth, maxWidth } = facebookPageFrameDimensions;
  if (!Number.isFinite(availableWidth) || availableWidth < minWidth) return null;
  return Math.min(maxWidth, Math.floor(availableWidth));
}

export function facebookPagePluginUrl(pageUrl: string, width: number): string {
  const query = new URLSearchParams({
    href: pageUrl,
    tabs: 'timeline',
    width: String(width),
    height: String(facebookPageFrameDimensions.height),
    adapt_container_width: 'true',
    show_facepile: 'false',
    locale: 'vi_VN',
  });
  return `${facebookOrigin}/plugins/page.php?${query}`;
}
