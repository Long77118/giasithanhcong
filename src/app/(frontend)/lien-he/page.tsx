import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettingsCached } from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactActions } from '@/components/ContactActions';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { contact } = await getSiteSettingsCached();

  const title = `Liên hệ & Yêu cầu báo giá sỉ | ${contact.brandName}`;
  const description = `Gửi yêu cầu báo giá sỉ ly nhựa, hộp thực phẩm, chai PET và bao bì giấy hoặc liên hệ qua Hotline/Zalo ${contact.brandName}.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/lien-he` },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/lien-he`,
      title,
      description,
    },
  };
}

export default async function ContactPage() {
  const siteUrl = getSiteUrl();
  const { contact } = await getSiteSettingsCached();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Liên hệ & Báo giá' },
        ]}
      />

      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-bold text-[#0C2340]">
          Liên hệ & Yêu cầu báo giá bán sỉ
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Gửi danh mục sản phẩm và số lượng dự kiến để nhận báo giá theo bậc số lượng hoặc liên hệ trực tiếp qua các kênh cấu hình bên dưới.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-[#0C2340]">
              Kênh hỗ trợ trực tiếp
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Thông tin liên hệ được quản lý tập trung từ SiteSettings trong hệ thống quản trị.
            </p>
            <div className="mt-5">
              <ContactActions contact={contact} compact />
            </div>

            <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
              {contact.email && (
                <div>
                  <dt className="text-xs text-slate-500">Email nhận đơn sỉ</dt>
                  <dd className="font-medium text-slate-900">{contact.email}</dd>
                </div>
              )}
              {contact.address && (
                <div>
                  <dt className="text-xs text-slate-500">Địa chỉ kho mẫu</dt>
                  <dd className="text-slate-700">{contact.address}</dd>
                </div>
              )}
              {contact.workingHours && (
                <div>
                  <dt className="text-xs text-slate-500">Thời gian làm việc</dt>
                  <dd className="text-slate-700">{contact.workingHours}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs leading-relaxed text-slate-600">
            {contact.sampleNotice}
          </div>
        </aside>

        <div className="lg:col-span-7">
          <QuoteRequestForm />
        </div>
      </div>
    </div>
  );
}
