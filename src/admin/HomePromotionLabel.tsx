'use client';

import { useRowLabel } from '@payloadcms/ui';
import { PanelsTopLeft } from 'lucide-react';

export default function HomePromotionLabel() {
  const { data } = useRowLabel<{ title?: string; enabled?: boolean }>();
  return <span className="admin-editor-row-label">
    <span className="admin-editor-row-icon" data-tone="sun"><PanelsTopLeft size={14} aria-hidden /></span>
    <strong>{data?.title?.trim() || 'Banner mới'}</strong>
    {data?.enabled === false && <span className="admin-editor-row-pill" data-kind="muted">Đang ẩn</span>}
  </span>;
}
