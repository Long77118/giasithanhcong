// Shared by the admin, worker and server. No browser/server dependencies here.
export const imageUploadConfig = {
  maxSourceBytes: 20 * 1024 * 1024,
  // Below 150 KiB the original is already economical; do not decode/re-encode it.
  smallFileBytes: 150 * 1024,
  targetBytes: 400 * 1024,
  maxEdge: { product: 2000, editorial: 1600, social: 2000 },
  socialMinimumEdge: 1200,
  quality: 0.82,
  minimumQuality: 0.78,
  highQuality: 0.94,
  // Bound canvas allocations after decoding; decode failures fall back to the original.
  maxDecodePixels: 48_000_000,
  workerTimeoutMs: 45_000,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  // Preserve animation, including animated WebP/PNG, rather than flattening frames.
  passthroughMimeTypes: ['image/svg+xml', 'image/gif'],
} as const;

export type ImageUploadKind = keyof typeof imageUploadConfig.maxEdge;
export type ImageUploadOptions = { kind: ImageUploadKind; highQuality: boolean };

export const defaultImageUploadOptions: ImageUploadOptions = { kind: 'product', highQuality: false };
