'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useConfig } from '@payloadcms/ui';
import { compressUploadImage } from '@/lib/image-compression-client';
import { defaultImageKind, formatImageBytes } from '@/lib/image-upload';
import type { ImageUploadOptions } from '@/lib/image-upload-config';
import { createMediaUploadFetch, type UploadProgress } from '@/lib/media-upload-transport';
import './image-upload.css';

const ImageUploadContext = createContext<{
  getOptions: (file: File) => ImageUploadOptions | undefined;
  setOptions: (file: File, options: ImageUploadOptions) => void;
}>({ getOptions: () => undefined, setOptions: () => {} });
export const useImageUploadOptions = () => useContext(ImageUploadContext);

export default function ImageUploadProvider({ children }: { children?: ReactNode }) {
  const { config } = useConfig();
  const options = useRef(new WeakMap<File, ImageUploadOptions>());
  const context = useMemo(() => ({
    getOptions: (file: File) => options.current.get(file),
    setOptions: (file: File, value: ImageUploadOptions) => { options.current.set(file, value); },
  }), []);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  useEffect(() => {
    const originalFetch = window.fetch;
    const wrappedFetch = createMediaUploadFetch({
      baseFetch: originalFetch.bind(window), origin: window.location.origin, apiPath: config.routes.api,
      optionsFor: (file) => options.current.get(file) ?? { kind: defaultImageKind(window.location.pathname), highQuality: false },
      compress: compressUploadImage,
      onProgress: (entry) => setProgress((current) => {
        const next = current.filter((item) => item.id !== entry.id);
        // Keep active jobs visible; cap only completed messages.
        return [...next.filter((item) => item.status === 'waiting' || item.status === 'processing' || item.status === 'sending'),
          ...next.filter((item) => item.status === 'ready' || item.status === 'error').slice(-5), entry];
      }),
    });
    window.fetch = wrappedFetch;
    return () => { if (window.fetch === wrappedFetch) window.fetch = originalFetch; };
  }, [config.routes.api]);
  const busy = progress.some((item) => item.status === 'waiting' || item.status === 'processing' || item.status === 'sending');
  return (
    <ImageUploadContext value={context}>
      {children}
      {progress.length > 0 && <aside className="image-upload-status" aria-label="Tối ưu ảnh trước khi tải lên">
        <div className="image-upload-status__heading">
          <strong>{busy ? 'Đang chuẩn bị ảnh…' : 'Kết quả xử lý ảnh'}</strong>
          {!busy && <button type="button" onClick={() => setProgress([])}>Đóng</button>}
        </div>
        <div role="status" aria-live="polite" aria-atomic="false">
          {progress.map((item) => <p key={item.id}>
            <strong>{item.name}</strong><br />
            {item.status === 'waiting' ? 'Đang chờ xử lý…' : item.status === 'processing' ? 'Đang xử lý ảnh…'
              : item.status === 'error' ? 'Chưa tải lên.' : `${formatImageBytes(item.before)} → ${formatImageBytes(item.after ?? item.before)} · ${item.status === 'sending' ? 'Đang gửi tới máy chủ…' : 'Đã tải lên.'}`}
            {item.message && <span className="image-upload-status__message">{item.message}</span>}
          </p>)}
        </div>
      </aside>}
    </ImageUploadContext>
  );
}
