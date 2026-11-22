import React from 'react';
import type { Metadata } from 'next';
import {
  Be_Vietnam_Pro,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import './header.css';
import {
  getPublishedCategoriesCached,
  getFeaturedProductsCached,
  getSiteSettingsCached,
} from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { categoryMenuItems } from '@/components/ProductCategoryMenu';
import { MobileContactDock } from '@/components/MobileContactDock';
import { getHeaderContact } from '@/lib/header';
import { publicContentPath } from '@/lib/slug';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const title =
    settings?.defaultSeoTitle ||
    `${contact.brandName} – Tổng Kho Sỉ Ly, Hộp Nhựa & Bao Bì Giấy`;
  const description =
    settings?.defaultSeoDescription || contact.tagline;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s`,
    },
    description,
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      type: 'website',
      locale: 'vi_VN',
      siteName: contact.brandName,
      title,
      description,
      url: siteUrl,
    },
  };
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ contact }, categories, featuredProducts] = await Promise.all([
    getSiteSettingsCached(),
    getPublishedCategoriesCached(),
    getFeaturedProductsCached(1),
  ]);

  const topCategories = categories.filter((c) => !c.parent);
  const headerContact = getHeaderContact(contact);
  const featured = featuredProducts.find(product => product.featured);

  return (
    <html
      lang="vi"
      className={`${plusJakarta.variable} ${beVietnam.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[#0C2340] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Chuyển tới nội dung chính
        </a>
        <SiteHeader brandName={contact.brandName} categories={categoryMenuItems(categories)} contact={headerContact}
          featured={featured ? { name: featured.name, href: publicContentPath('products', featured.slug) } : null} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter contact={contact} categories={topCategories} />
        <MobileContactDock contact={headerContact} />
      </body>
    </html>
  );
}
