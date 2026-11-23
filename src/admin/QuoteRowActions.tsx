'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@payloadcms/ui';
import { ArrowRight, Clipboard, Copy, MessageCircle, Phone } from 'lucide-react';
import type { QuoteRequest } from '@/payload-types';
import { nextQuoteStage, quotePhoneLinks } from '@/lib/admin-quotes';

export function QuoteRowActions({ phone, message, status, endpoint }: Pick<QuoteRequest, 'phone' | 'message' | 'status'> & { endpoint: string }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const links = quotePhoneLinks(phone);
  const next = nextQuoteStage(status);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      toast.error(`Chưa thể sao chép ${label}. Bạn có thể mở yêu cầu và sao chép thủ công.`);
    }
  }

  async function advance() {
    if (saving || !next) return;
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast.success(`Đã chuyển sang “${next.label}”.`);
        router.refresh();
      } else if (response.status === 409 || response.status === 404) {
        toast.error('Yêu cầu đã thay đổi. Danh sách đang được cập nhật.');
        router.refresh();
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Phiên đăng nhập đã hết hạn hoặc bạn chưa có quyền cập nhật. Hãy đăng nhập lại bằng tài khoản quản trị.');
      } else if (response.status === 423) {
        toast.error('Yêu cầu đang được mở để chỉnh sửa ở cửa sổ khác. Hãy đóng cửa sổ đó hoặc thử lại sau.');
      } else {
        toast.error('Chưa cập nhật được trạng thái. Hãy tải lại trang rồi thử lại.');
      }
    } catch {
      toast.error('Chưa kết nối được. Hãy kiểm tra mạng rồi tải lại danh sách để xem trạng thái.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-quote-actions">
      <div className="admin-quote-contact-actions">
        {links && <a href={links.tel} aria-label="Gọi khách" title="Gọi khách"><Phone size={16} aria-hidden /></a>}
        {links?.zalo && <a href={links.zalo} target="_blank" rel="noopener noreferrer" aria-label="Mở Zalo theo số khách" title="Mở Zalo theo số khách"><MessageCircle size={16} aria-hidden /></a>}
        <button type="button" aria-label="Sao chép số" title="Sao chép số" onClick={() => void copy(phone, 'số điện thoại')}><Copy size={16} aria-hidden /></button>
        <button type="button" aria-label="Sao chép nội dung" title="Sao chép nội dung" onClick={() => void copy(message, 'nội dung')}><Clipboard size={16} aria-hidden /></button>
      </div>
      {next && <button type="button" className="admin-quote-advance" onClick={() => void advance()} disabled={saving}>
        <ArrowRight size={15} aria-hidden />
        {saving ? 'Đang cập nhật…' : `Chuyển sang ${next.label.toLocaleLowerCase('vi-VN')}`}
      </button>}
    </div>
  );
}
