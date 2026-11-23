import React from 'react';
import Link from 'next/link';
import { publicContentPath } from '@/lib/slug';
import type { ProductCategory } from '@/payload-types';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getContactPageDetails } from '@/lib/contact-page';
import { SiteSampleNotice } from './SiteSampleNotice';

interface SiteFooterProps {
  contact: ResolvedContactConfig;
  categories: ProductCategory[];
}

export function SiteFooter({ contact, categories }: SiteFooterProps) {
  const { phones, hasDetails } = getContactPageDetails(contact);
  return (
    <footer className="site-footer border-t border-slate-200 bg-[#0C2340] text-slate-200">
      <div className="site-shell py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-white">
              {contact.brandName}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              {contact.tagline}
            </p>
            <SiteSampleNotice notice={contact.sampleNotice} />
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">
              Danh mục sản phẩm
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={publicContentPath('product-categories', cat.slug)}
                    className="transition-colors hover:text-white hover:underline"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/san-pham"
                  className="transition-colors hover:text-white hover:underline"
                >
                  Tất cả sản phẩm
                </Link>
              </li>
            </ul>
          </div>

          {hasDetails && <div>
            <h3 className="font-display text-sm font-semibold text-white">
              Thông tin liên hệ
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
              {phones.map((phone, index) => <li key={phone.href}>
                <span className="text-slate-400">{index ? 'Hotline 2: ' : 'Hotline: '}</span>
                  <a
                    href={phone.href}
                    className="font-mono font-medium tabular-nums text-white hover:underline"
                  >
                    {phone.label}
                  </a>
              </li>)}
              {contact.zaloUrl && <li>
                <span className="text-slate-400">Zalo: </span>
                  <a
                    href={contact.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white hover:underline"
                  >
                    Mở Zalo tư vấn
                  </a>
              </li>}
              {contact.email && (
                <li>
                  <span className="text-slate-400">Email: </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-white hover:underline"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="text-xs leading-relaxed text-slate-300">
                  {contact.address}
                </li>
              )}
              {contact.workingHours && (
                <li className="text-xs text-slate-400">{contact.workingHours}</li>
              )}
            </ul>
          </div>}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {contact.brandName}. Nền tảng website giới thiệu sản phẩm bán sỉ & blog.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/gioi-thieu" className="hover:text-white">
              Giới thiệu
            </Link>
            <Link href="/lien-he" className="hover:text-white">
              Liên hệ báo giá
            </Link>
            <Link href="/sitemap.xml" className="hover:text-white">
              Sitemap
            </Link>
            <Link href="/admin" className="hover:text-white">
              Quản trị CMS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
