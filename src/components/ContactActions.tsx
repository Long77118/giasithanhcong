import React from 'react';
import { Phone, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import type { ResolvedContactConfig } from '@/lib/contact';

interface ContactActionsProps {
  contact: ResolvedContactConfig;
  quoteHref?: string;
  compact?: boolean;
}

export function ContactActions({
  contact,
  quoteHref = '/lien-he#bao-gia',
  compact = false,
}: ContactActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {contact.isHotlineConfigured && contact.telHref ? (
        <a
          href={contact.telHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#0C2340] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163861] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340]"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">Gọi {contact.hotline}</span>
        </a>
      ) : (
        <span
          className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600"
          title="Số hotline chưa được cấu hình trong SiteSettings"
        >
          <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Hotline chưa cấu hình</span>
        </span>
      )}

      {contact.isZaloConfigured && contact.zaloUrl ? (
        <a
          href={contact.zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#0C2340]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#0C2340] transition-colors hover:border-[#0C2340] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2340]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Nhắn Zalo tư vấn</span>
        </a>
      ) : (
        <span
          className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600"
          title="Đường dẫn Zalo chưa được cấu hình trong SiteSettings"
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Zalo chưa cấu hình</span>
        </span>
      )}

      {!compact && (
        <Link
          href={quoteHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309]"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Gửi yêu cầu báo giá</span>
        </Link>
      )}
    </div>
  );
}
