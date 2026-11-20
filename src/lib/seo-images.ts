import type { Media } from '@/payload-types';

type MediaReference = Media | number | null | undefined;

export function resolvePublicImageUrl(siteUrl: string, value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input || /^[?#]/.test(input) || /[\\\u0000-\u001f\u007f]/.test(input)) return null;

  try {
    const url = new URL(input, `${siteUrl}/`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function imageDimension(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

export function resolveOpenGraphImages(siteUrl: string, ...candidates: MediaReference[]) {
  for (const media of candidates) {
    if (!media || typeof media !== 'object') continue;
    if (media.mimeType && !media.mimeType.startsWith('image/')) continue;
    const url = resolvePublicImageUrl(siteUrl, media.url);
    if (!url) continue;

    return [{
      url,
      alt: media.alt?.trim() || undefined,
      width: imageDimension(media.width),
      height: imageDimension(media.height),
    }];
  }
  return undefined;
}
