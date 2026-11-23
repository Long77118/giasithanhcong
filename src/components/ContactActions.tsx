import React from 'react';
import { Phone, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getHeaderContact } from '@/lib/header';
import './contact-actions.css';

interface ContactActionsProps {
  contact: ResolvedContactConfig;
  quoteHref?: string;
  compact?: boolean;
  tone?: 'default' | 'secondary';
}

export function ContactActions({
  contact,
  quoteHref = '/lien-he#bao-gia',
  compact = false,
  tone = 'default',
}: ContactActionsProps) {
  const phone = getHeaderContact(contact).phones[0];
  if (compact && !phone && !contact.zaloUrl) return null;
  return (
    <nav className={`contact-actions contact-actions--${tone}`} aria-label="Liên hệ và báo giá">
      {phone && (
        <a
          href={phone.href}
          className="contact-action contact-action--phone"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">Gọi {phone.label}</span>
        </a>
      )}

      {contact.zaloUrl && (
        <a
          href={contact.zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-action contact-action--zalo"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Nhắn Zalo tư vấn</span>
        </a>
      )}

      {!compact && (
        <Link
          href={quoteHref}
          className="contact-action contact-action--quote"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Gửi yêu cầu báo giá</span>
        </Link>
      )}
    </nav>
  );
}
