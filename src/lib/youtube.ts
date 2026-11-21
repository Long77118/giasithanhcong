const videoIDPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

/** Accept a YouTube video URL, never a bare ID, channel, playlist or another origin. */
export function getYouTubeID(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    let id: string | null = null;
    if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
      const match = /^\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname);
      id = match?.[1] ?? null;
    } else if (youtubeHosts.has(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else id = /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      id = /^\/embed\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    }
    return id && videoIDPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youTubeEmbedUrl(id: string): string {
  if (!videoIDPattern.test(id)) throw new Error('Invalid YouTube video ID');
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

export function youTubeThumbnailUrl(id: string): string {
  if (!videoIDPattern.test(id)) throw new Error('Invalid YouTube video ID');
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
