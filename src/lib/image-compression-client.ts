import { encodeUploadImage, type EncodedImage } from './image-compression-codec';
import { imageUploadConfig as config, type ImageUploadOptions } from './image-upload-config';
import { hasImageAnimation, imageSourceError, imageUploadFilename, preferCompressedImage, shouldCompressImage } from './image-upload';

export type ImageCompressionResult = { file: File; warning?: string; note?: string };

async function inWorker(file: File, options: ImageUploadOptions): Promise<EncodedImage> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return encodeUploadImage(file, options);
  // Next/Webpack emits this as a same-origin worker asset on both deployment targets.
  let worker: Worker;
  try { worker = new Worker(new URL('./image-compression.worker.ts', import.meta.url)); }
  catch { return encodeUploadImage(file, options); }
  try {
    return await new Promise<EncodedImage>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), config.workerTimeoutMs);
      worker.onmessage = ({ data }) => {
        clearTimeout(timeout);
        if (data.error) reject(new Error(data.error)); else resolve(data.result as EncodedImage);
      };
      worker.onerror = () => { clearTimeout(timeout); reject(new Error('encoding')); };
      try { worker.postMessage({ file, options }); }
      catch { clearTimeout(timeout); reject(new Error('unsupported')); }
    });
  } catch (error) {
    // Unsupported workers may fall back. Encoding/OOM/timeout failures should not
    // repeat an expensive decode on the UI thread; the caller uploads the original.
    if (error instanceof Error && error.message === 'unsupported') return encodeUploadImage(file, options);
    throw error;
  } finally { worker.terminate(); }
}

export async function compressUploadImage(file: File, options: ImageUploadOptions): Promise<ImageCompressionResult> {
  const error = imageSourceError(file.size, file.type);
  if (error) throw new Error(error);
  const renamedOriginal = () => new File([file], imageUploadFilename(file.name, file.type), { type: file.type, lastModified: file.lastModified });
  if (!shouldCompressImage(file.size, file.type)) {
    return { file: renamedOriginal(), note: 'Giữ nguyên dữ liệu ảnh: file nhỏ hoặc định dạng không nén.' };
  }
  try {
    if (hasImageAnimation(new Uint8Array(await file.arrayBuffer()), file.type)) {
      return { file: renamedOriginal(), note: 'Giữ nguyên ảnh động.' };
    }
    const result = await inWorker(file, options);
    if (!preferCompressedImage(file.size, result.blob.size)) {
      return { file: renamedOriginal(), note: 'Giữ nguyên dữ liệu ảnh vì kết quả nén không nhỏ hơn.' };
    }
    return { file: new File([result.blob], imageUploadFilename(file.name, result.blob.type), { type: result.blob.type }) };
  } catch {
    return { file: renamedOriginal(), warning: 'Không nén được ảnh trên thiết bị này. Đang tải bản gốc; EXIF/GPS có thể còn trong file.' };
  }
}
