import type { Product } from '../payload-types';
import { getYouTubeID, youTubeThumbnailUrl } from './youtube';
import { resolvePublicImageUrl } from './seo-images';
import { publicDocumentLink, richTextImage } from './rich-text';

export const availabilityLabels = {
  in_stock: 'Còn hàng',
  made_to_order: 'Đặt theo yêu cầu',
  discontinued: 'Ngừng cung cấp',
} as const;

export function productQuickFacts(specs: Product['specs']) {
  return (specs ?? []).filter((spec) => spec.showInQuickFacts && spec.label.trim() && spec.value.trim()).slice(0, 4);
}

export function productTextItems(items: string[] | null | undefined): string[] {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

export function productDocuments(documents: Product['documents'], siteUrl: string) {
  return (documents ?? []).flatMap((document) => {
    if (!document || typeof document !== 'object' || document.mimeType !== 'application/pdf') return [];
    const url = resolvePublicImageUrl(siteUrl, document.url);
    const title = document.title?.trim();
    return url && title ? [{ id: document.id, title, url }] : [];
  });
}

export function productVideos(videos: Product['videos'], siteUrl: string) {
  return (videos ?? []).flatMap((video, index) => {
    const videoId = getYouTubeID(video.youtubeUrl);
    const title = video.title?.trim();
    const description = video.description?.trim();
    if (!videoId || !title || !description) return [];
    const media = typeof video.thumbnail === 'object' ? video.thumbnail : null;
    const thumbnail = media?.mimeType?.startsWith('image/')
      ? resolvePublicImageUrl(siteUrl, media.url)
      : null;
    return [{
      id: video.id || `video-${index}`,
      videoId, title, description,
      thumbnail: thumbnail || youTubeThumbnailUrl(videoId),
      thumbnailAlt: media?.alt?.trim() || title,
    }];
  });
}

/** A blank Lexical paragraph is not product content and must not create an empty section. */
export function hasProductDescription(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !('root' in value)) return false;
  const root = value.root;
  if (!root || typeof root !== 'object' || !('children' in root) || !Array.isArray(root.children)) return false;
  const pending: unknown[] = [...root.children];
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if ('text' in node && typeof node.text === 'string' && node.text.trim()) return true;
    if ('type' in node && node.type === 'upload' && 'value' in node && richTextImage(node.value)) return true;
    if ('type' in node && node.type === 'relationship' && publicDocumentLink(node)) return true;
    if ('children' in node && Array.isArray(node.children)) pending.push(...node.children);
  }
  return false;
}
