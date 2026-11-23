import type { ImageUploadOptions } from './image-upload-config';
import type { ImageCompressionResult } from './image-compression-client';

export type UploadProgress = {
  id: number; name: string; before: number; after?: number;
  status: 'waiting' | 'processing' | 'sending' | 'ready' | 'error'; message?: string;
};

// Payload 3.93 has no transform-file hook. Its single and bulk forms both use
// fetch(url, { body: FormData }). Keep this adapter restricted to Media writes;
// never intercept R2 signed URLs, Documents, server actions or other requests.
export function createMediaUploadFetch({ baseFetch, origin, apiPath, optionsFor, compress, onProgress }: {
  baseFetch: typeof fetch;
  origin: string;
  apiPath: string;
  optionsFor: (file: File) => ImageUploadOptions;
  compress: (file: File, options: ImageUploadOptions) => Promise<ImageCompressionResult>;
  onProgress: (progress: UploadProgress) => void;
}): typeof fetch {
  let queue: Promise<unknown> = Promise.resolve();
  let sequence = 0;
  const cache = new WeakMap<File, { key: string; result: ImageCompressionResult }>();
  return async (input, init) => {
    const request = typeof Request !== 'undefined' && input instanceof Request ? input : undefined;
    const url = new URL(request?.url ?? String(input), origin);
    const mediaPath = `${apiPath.replace(/\/$/, '')}/media`;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const isMediaWrite = url.origin === origin && (url.pathname === mediaPath
      || (url.pathname.startsWith(`${mediaPath}/`) && /^[0-9]+$/.test(url.pathname.slice(mediaPath.length + 1))))
      && ['POST', 'PATCH', 'PUT'].includes(method);
    if (!isMediaWrite || !(init?.body instanceof FormData)) return baseFetch(input, init);
    const body = init.body;
    const file = body.get('file');
    if (!(file instanceof File)) return baseFetch(input, init);
    const options = { ...optionsFor(file) };
    const id = ++sequence;
    const progress = { id, name: file.name, before: file.size };
    let resultMessage: string | undefined;
    onProgress({ ...progress, status: 'waiting' });
    const signal = init.signal ?? request?.signal;
    const job = queue.then(async () => {
      signal?.throwIfAborted();
      onProgress({ ...progress, status: 'processing' });
      const key = JSON.stringify(options);
      const cached = cache.get(file);
      const result = cached?.key === key ? cached.result : await compress(file, options);
      signal?.throwIfAborted();
      cache.set(file, { key, result });
      const optimizedBody = new FormData();
      for (const [name, value] of body.entries()) {
        optimizedBody.append(name, name === 'file' ? result.file : value);
      }
      resultMessage = result.warning ?? result.note;
      onProgress({ ...progress, status: 'sending', after: result.file.size, message: resultMessage });
      return optimizedBody;
    });
    // A failed file must not poison the rest of the batch.
    queue = job.catch(() => undefined);
    let optimizedBody: FormData;
    try { optimizedBody = await job; }
    catch (error) {
      if (signal?.aborted) {
        onProgress({ ...progress, status: 'error', message: 'Đã hủy xử lý ảnh.' });
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Không xử lý được ảnh. Vui lòng thử lại.';
      onProgress({ ...progress, status: 'error', message });
      return Response.json({ errors: [{ message }] }, { status: 400 });
    }
    try {
      const response = await baseFetch(input, { ...init, body: optimizedBody });
      onProgress({ ...progress, after: (optimizedBody.get('file') as File).size,
        status: response.ok ? 'ready' : 'error', message: response.ok ? resultMessage : 'Máy chủ chưa lưu ảnh. Xem thông báo trên biểu mẫu để sửa và thử lại.' });
      return response;
    } catch (error) {
      onProgress({ ...progress, status: 'error', message: 'Lượt tải bị hủy hoặc mất kết nối. Vui lòng thử lại.' });
      throw error;
    }
  };
}
