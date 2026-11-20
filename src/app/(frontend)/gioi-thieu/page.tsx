import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettingsCached } from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactActions } from '@/components/ContactActions';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const title = `Giới thiệu & Liên hệ | ${contact.brandName}`;
  const description = `Thông tin giới thiệu năng lực cung ứng bao bì bán sỉ và kênh liên hệ báo giá của ${contact.brandName} (dữ liệu minh họa).`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/gioi-thieu` },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      type: 'website',
      url: `${siteUrl}/gioi-thieu`,
      title,
      description,
    },
  };
}

export default async function AboutPage() {
  const siteUrl = getSiteUrl();
  const { contact } = await getSiteSettingsCached();

  return (
    <div className="site-shell py-8 lg:py-12">
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Giới thiệu & Liên hệ', href: '/gioi-thieu' },
        ]}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
        <p className="text-xs font-semibold tracking-wide text-[#B45309]">
          Giới thiệu đơn vị cung ứng (Nội dung minh họa)
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#0C2340] sm:text-4xl">
          {contact.brandName} – Đối tác bao bì dùng một lần cho chuỗi F&B
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          {contact.tagline}
        </p>
        <p className="mt-3 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          {contact.sampleNotice}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-display text-base font-semibold text-[#0C2340]">
              01. Danh mục đồng bộ theo ngành hàng
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cung ứng đầy đủ ly PET/PP, nắp cầu/nắp bằng, hộp thực phẩm chịu nhiệt, chai hũ PET, túi giấy kraft và phụ kiện mang đi.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-display text-base font-semibold text-[#0C2340]">
              02. Thông số & quy cách rõ ràng
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Mỗi mã sản phẩm đều công bố kích thước, chất liệu, quy cách đóng thùng và số lượng đặt tối thiểu (MOQ) giúp dễ dự toán tồn kho.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-display text-base font-semibold text-[#0C2340]">
              03. Tiếp nhận báo giá nhanh chóng
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Hỗ trợ gửi yêu cầu báo giá trực tuyến theo từng mã hàng hoặc trao đổi trực tiếp qua Hotline và Zalo của đội ngũ tư vấn.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <ContactActions contact={contact} quoteHref="#bao-gia" />
          <Link
            href="/san-pham"
            className="text-sm font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
          >
            Xem danh mục sản phẩm →
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-5">
          <h2 className="font-display text-xl font-bold text-[#0C2340]">
            Thông tin liên hệ
          </h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Hotline bán sỉ</dt>
              <dd className="mt-1 font-mono font-semibold text-slate-900">
                {contact.isHotlineConfigured && contact.telHref ? (
                  <a href={contact.telHref} className="hover:underline">
                    {contact.hotline}
                  </a>
                ) : (
                  <span className="font-sans font-normal text-slate-500">
                    Chưa cấu hình trong SiteSettings
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Zalo tư vấn</dt>
              <dd className="mt-1">
                {contact.isZaloConfigured && contact.zaloUrl ? (
                  <a
                    href={contact.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#0C2340] hover:underline"
                  >
                    {contact.zaloUrl}
                  </a>
                ) : (
                  <span className="text-slate-500">
                    Chưa cấu hình trong SiteSettings
                  </span>
                )}
              </dd>
            </div>
            {contact.email && (
              <div>
                <dt className="text-xs font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-slate-900">{contact.email}</dd>
              </div>
            )}
            {contact.address && (
              <div>
                <dt className="text-xs font-medium text-slate-500">Địa chỉ kho mẫu</dt>
                <dd className="mt-1 text-slate-700">{contact.address}</dd>
              </div>
            )}
            {contact.workingHours && (
              <div>
                <dt className="text-xs font-medium text-slate-500">Giờ làm việc</dt>
                <dd className="mt-1 text-slate-700">{contact.workingHours}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="lg:col-span-7">
          <QuoteRequestForm />
        </div>
      </div>
    </div>
  );
}
