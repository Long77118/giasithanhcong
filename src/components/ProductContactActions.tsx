import { MessageCircle, Phone } from 'lucide-react';
import type { ResolvedContactConfig } from '@/lib/contact';

export function ProductContactActions({ contact, mobile = false }: { contact: ResolvedContactConfig; mobile?: boolean }) {
  if (!contact.telHref && !contact.zaloUrl) return null;
  return (
    <div className={mobile ? 'product-detail-dock' : 'product-detail-actions'} aria-label={mobile ? 'Liên hệ báo giá nhanh' : 'Liên hệ nhận báo giá'}>
      {contact.zaloUrl && (
        <a className="product-detail-button product-detail-button-primary" href={contact.zaloUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={19} aria-hidden="true" />
          {mobile ? 'Zalo báo giá' : 'Nhận báo giá qua Zalo'}
        </a>
      )}
      {contact.telHref && (
        <a className="product-detail-button product-detail-button-secondary" href={contact.telHref}>
          <Phone size={18} aria-hidden="true" />
          Gọi hotline
        </a>
      )}
    </div>
  );
}
