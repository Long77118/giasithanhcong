'use client';

import { useRowLabel } from '@payloadcms/ui';

export default function HomePromotionLabel() {
  const { data } = useRowLabel<{ title?: string; enabled?: boolean }>();
  return <span>{data?.title?.trim() || 'Banner mới'}{data?.enabled === false ? ' · Đang ẩn' : ''}</span>;
}
