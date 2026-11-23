import { toVietnameseSlug } from './slug';
import { imageUploadConfig as config, type ImageUploadKind } from './image-upload-config';

export function imageSourceError(size: number, mime: string): string | null {
  if (!Number.isSafeInteger(size) || size <= 0) return 'File ảnh rỗng hoặc dung lượng không hợp lệ.';
  if (size > config.maxSourceBytes) return 'Ảnh vượt quá 20 MB. Vui lòng chọn ảnh nhỏ hơn trước khi tải lên.';
  if (![...config.allowedMimeTypes, ...config.passthroughMimeTypes].includes(mime as never)) {
    return 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc AVIF. Vui lòng kiểm tra định dạng file.';
  }
  return null;
}

export function mediaUploadError(size: number, mime: string, bytes?: Uint8Array): string | null {
  const error = imageSourceError(size, mime);
  if (error) return error;
  if (!config.allowedMimeTypes.includes(mime as never)) return 'Thư viện hiện chỉ nhận JPEG, PNG, WebP và AVIF. SVG/GIF chưa được cho phép.';
  if (!bytes?.length) return 'Không đọc được dữ liệu ảnh để kiểm tra định dạng.';
  const tag = (offset: number, value: string) => [...value].every((letter, index) => bytes[offset + index] === letter.charCodeAt(0));
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = bytes.length >= 16 && tag(0, 'RIFF') && tag(8, 'WEBP');
  let avif = false;
  if (bytes.length >= 16 && tag(4, 'ftyp')) {
    const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
    for (let offset = 8; offset + 4 <= Math.min(size, bytes.length); offset += 4) {
      if (offset !== 12 && (tag(offset, 'avif') || tag(offset, 'avis'))) avif = true;
    }
  }
  const matches = ({ 'image/jpeg': jpeg, 'image/png': png, 'image/webp': webp, 'image/avif': avif } as Record<string, boolean>)[mime];
  return matches ? null : 'Nội dung file không khớp định dạng ảnh. Vui lòng chọn một file ảnh hợp lệ.';
}

export function imageTargetSize(width: number, height: number, kind: ImageUploadKind) {
  if (![width, height].every((value) => Number.isFinite(value) && value > 0)) throw new Error('Kích thước ảnh không hợp lệ.');
  const limit = kind === 'social' ? Math.max(config.socialMinimumEdge, config.maxEdge[kind]) : config.maxEdge[kind];
  const scale = Math.min(1, limit / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function shouldCompressImage(size: number, mime: string, animated = false) {
  return !imageSourceError(size, mime) && size >= config.smallFileBytes
    && !config.passthroughMimeTypes.includes(mime as never) && !animated;
}

// The encoder may return PNG when WebP is unsupported. Never assign a false extension.
export function outputImageType(actualType: string, alpha: boolean): 'image/webp' | 'image/jpeg' | 'image/png' {
  if (actualType === 'image/webp') return 'image/webp';
  return alpha ? 'image/png' : 'image/jpeg';
}

export function preferredImageType(sourceType: string, alpha: boolean, highQuality: boolean) {
  // Payload/Sharp also re-encodes WebP originals on Node. Keep important artwork
  // in PNG/JPEG so a second WebP encode cannot undo the high-quality choice.
  return highQuality ? (alpha || sourceType === 'image/png' ? 'image/png' : 'image/jpeg') : 'image/webp';
}

export function imageUploadFilename(name: string, mime: string) {
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
    'image/gif': 'gif', 'image/svg+xml': 'svg' } as Record<string, string>)[mime];
  if (!extension) throw new Error('Định dạng ảnh không được hỗ trợ.');
  const base = toVietnameseSlug(name.replace(/\.[^.]*$/, '')).slice(0, 120).replace(/-$/, '') || 'hinh-anh';
  return `${base}.${extension}`;
}

export function preferCompressedImage(originalBytes: number, resultBytes: number) {
  return resultBytes > 0 && resultBytes < originalBytes;
}

export function formatImageBytes(bytes: number) {
  if (bytes < 1024) return `${bytes.toLocaleString('vi-VN')} B`;
  const megabytes = bytes / (1024 * 1024);
  return megabytes >= 1 ? `${megabytes.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
    : `${Math.round(bytes / 1024).toLocaleString('vi-VN')} KB`;
}

export function defaultImageKind(pathname: string): ImageUploadKind {
  // Nested Media drawers keep the parent page URL. Shared library/SEO/banner must be selected explicitly.
  return /\/collections\/posts(?:\/|$)/.test(pathname) ? 'editorial' : 'product';
}

// Container markers, not a lossy decoder. Preserve animated WebP/APNG/AVIF as well as GIF.
export function hasImageAnimation(bytes: Uint8Array, mime: string) {
  if (mime === 'image/gif') return true;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number, value: string) => [...value].every((letter, index) => bytes[offset + index] === letter.charCodeAt(0));
  if (mime === 'image/webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      if (tag(offset, 'ANIM') || tag(offset, 'ANMF')) return true;
      const length = view.getUint32(offset + 4, true);
      offset += 8 + length + (length % 2);
    }
  }
  if (mime === 'image/png') {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      if (tag(offset + 4, 'acTL')) return true;
      offset += 12 + view.getUint32(offset);
    }
  }
  // AVIF image sequences advertise the avis brand in ftyp.
  if (mime === 'image/avif' && tag(4, 'ftyp')) {
    const end = Math.min(bytes.length, view.getUint32(0));
    for (let offset = 8; offset + 4 <= end; offset += 4) if (tag(offset, 'avis')) return true;
  }
  return false;
}
