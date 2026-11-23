import { encodeUploadImage } from './image-compression-codec';
import type { ImageUploadOptions } from './image-upload-config';

// A dedicated module worker per job is terminated on completion/error/timeout.
const workerScope = globalThis as unknown as {
  onmessage: (event: MessageEvent<{ file: File; options: ImageUploadOptions }>) => void;
  postMessage: (value: unknown) => void;
};
workerScope.onmessage = async ({ data }) => {
  try {
    if (typeof OffscreenCanvas !== 'function' || typeof createImageBitmap !== 'function') {
      workerScope.postMessage({ error: 'unsupported' });
      return;
    }
    workerScope.postMessage({ result: await encodeUploadImage(data.file, data.options) });
  } catch {
    workerScope.postMessage({ error: 'encoding' });
  }
};
