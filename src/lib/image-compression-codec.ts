import { imageUploadConfig as config, type ImageUploadOptions } from './image-upload-config';
import { imageTargetSize, outputImageType, preferredImageType } from './image-upload';

export type EncodedImage = { blob: Blob; width: number; height: number };

async function decodeImage(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      // The browser decoder reads EXIF orientation (including mirrored phone images).
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (error) {
      if (typeof document === 'undefined') throw error;
    }
  }
  if (typeof document === 'undefined') throw new Error('Trình duyệt không hỗ trợ giải mã ảnh trong Worker.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    // Modern HTML image decoders also honor EXIF. No second manual rotation.
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function encodeUploadImage(file: Blob, options: ImageUploadOptions): Promise<EncodedImage> {
  const image = await decodeImage(file);
  let canvas: HTMLCanvasElement | OffscreenCanvas | undefined;
  try {
    if (image.width * image.height > config.maxDecodePixels) throw new Error('Ảnh có quá nhiều điểm ảnh để xử lý an toàn trên thiết bị này.');
    const { width, height } = imageTargetSize(image.width, image.height, options.kind);
    canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(width, height) : document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) throw new Error('Không tạo được vùng xử lý ảnh.');
    context.drawImage(image.source, 0, 0, width, height);
    let alpha = false;
    if (file.type !== 'image/jpeg') {
      const pixels = context.getImageData(0, 0, width, height).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] !== 255) { alpha = true; break; }
      }
    }
    const encode = (type: string, quality: number): Promise<Blob> => {
      if (typeof OffscreenCanvas === 'function' && canvas instanceof OffscreenCanvas) return canvas.convertToBlob({ type, quality });
      return new Promise((resolve, reject) => (canvas as HTMLCanvasElement).toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Không mã hóa được ảnh.')), type, quality,
      ));
    };
    // Canvas produces fresh pixels: EXIF/GPS are not copied into the encoded file.
    const quality = options.highQuality ? config.highQuality : config.quality;
    const requestedType = preferredImageType(file.type, alpha, options.highQuality);
    let blob = await encode(requestedType, quality);
    if (requestedType === 'image/webp') {
      const actualType = outputImageType(blob.type, alpha);
      if (actualType !== blob.type) blob = await encode(actualType, quality);
      if (blob.type !== actualType) throw new Error('Trình duyệt không hỗ trợ định dạng ảnh thay thế.');
      if (!options.highQuality && blob.size > config.targetBytes && blob.type !== 'image/png') {
        const smaller = await encode(blob.type, config.minimumQuality);
        if (smaller.type === blob.type && smaller.size < blob.size) blob = smaller;
      }
    } else if (blob.type !== requestedType) throw new Error('Trình duyệt không hỗ trợ định dạng ảnh chất lượng cao.');
    return { blob, width, height };
  } finally {
    image.close();
    // Release the canvas backing store promptly, especially on mobile Safari.
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }
}
