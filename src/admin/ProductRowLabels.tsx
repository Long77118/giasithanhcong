'use client';

import { useEffect, useState } from 'react';
import { useConfig, useRowLabel } from '@payloadcms/ui';
import { Image as ImageIcon, ListChecks } from 'lucide-react';
import { selectedImage } from '@/lib/editor-completeness';

export function ProductImageLabel() {
  const { data, rowNumber } = useRowLabel<{ caption?: string; image?: number | { filename?: string } }>();
  const { config } = useConfig();
  const apiPath = config.routes.api;
  const [filename, setFilename] = useState('');
  const image = data?.image;
  const caption = data?.caption?.trim();
  const embeddedName = typeof image === 'object' && image?.filename;
  const id = selectedImage(image)?.id;
  useEffect(() => {
    setFilename('');
    if (caption || embeddedName || !id) return;
    const controller = new AbortController();
    void fetch(`${apiPath}/media/${id}?depth=0&select[filename]=true`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((media) => { if (!controller.signal.aborted) setFilename(media?.filename || ''); })
      .catch(() => {});
    return () => controller.abort();
  }, [apiPath, id, caption, embeddedName]);
  return <span className="admin-editor-row-label">
    <span className="admin-editor-row-icon" data-tone="purple"><ImageIcon size={14} aria-hidden /></span>
    <strong>{caption || embeddedName || filename || `Ảnh ${(rowNumber ?? 0) + 1}`}</strong>
  </span>;
}

export function ProductSpecLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; showInQuickFacts?: boolean }>();
  return <span className="admin-editor-row-label">
    <span className="admin-editor-row-icon" data-tone="mint"><ListChecks size={14} aria-hidden /></span>
    <strong>{data?.label?.trim() || `Thông số ${(rowNumber ?? 0) + 1}`}</strong>
    {data?.showInQuickFacts && <span className="admin-editor-row-pill">Nhìn nhanh</span>}
  </span>;
}
