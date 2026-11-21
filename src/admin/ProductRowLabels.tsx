'use client';

import { useEffect, useState } from 'react';
import { useRowLabel } from '@payloadcms/ui';

export function ProductImageLabel() {
  const { data, rowNumber } = useRowLabel<{ caption?: string; image?: number | { filename?: string } }>();
  const [filename, setFilename] = useState('');
  const image = data?.image;
  const caption = data?.caption?.trim();
  useEffect(() => {
    setFilename('');
    if (caption || typeof image !== 'number') return;
    const controller = new AbortController();
    void fetch(`/api/media/${image}?depth=0&select[filename]=true`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((media) => { if (!controller.signal.aborted) setFilename(media?.filename || ''); })
      .catch(() => {});
    return () => controller.abort();
  }, [image, caption]);
  return <span>{caption || (typeof image === 'object' && image?.filename) || filename || `Ảnh ${(rowNumber ?? 0) + 1}`}</span>;
}

export function ProductSpecLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; showInQuickFacts?: boolean }>();
  return <span>{data?.label?.trim() || `Thông số ${(rowNumber ?? 0) + 1}`}{data?.showInQuickFacts ? ' · Nhìn nhanh' : ''}</span>;
}
