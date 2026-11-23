import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  getPublishedCategoriesCached,
  getPublishedPosts,
  getSiteSettingsCached,
} from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { normalizeFacebookPageUrl } from '@/lib/facebook-page';
import { PostCard } from '@/components/PostCard';
import { JsonLd } from '@/components/JsonLd';
import { FacebookFanpages } from '@/components/FacebookFanpages';
import { HomeCategoryShortcuts } from '@/components/HomeCategoryShortcuts';
import { HomeBanner } from '@/components/HomeBanner';
import { HomePromotions } from '@/components/HomePromotions';
import { HomeServiceStrip } from '@/components/HomeServiceStrip';
import { HomeProductSelection } from '@/components/HomeProductSelection';
import { HomeCategoryShelves } from '@/components/HomeCategoryShelves';
import './home.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const title =
    settings?.defaultSeoTitle ||
    `${contact.brandName} – Tổng Kho Sỉ Ly, Hộp Nhựa & Bao Bì Giấy`;
  const description = settings?.defaultSeoDescription || contact.tagline;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/`,
    },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      type: 'website',
      url: `${siteUrl}/`,
      title,
      description,
      siteName: contact.brandName,
    },
  };
}

export default async function HomePage() {
  const siteUrl = getSiteUrl();
  const [{ settings, contact }, categories, latestPosts] =
    await Promise.all([
      getSiteSettingsCached(),
      getPublishedCategoriesCached(),
      getPublishedPosts({ page: 1, limit: 3 }),
    ]);

  const facebookPages = (settings?.facebookPages ?? []).flatMap(({ id, name, url }, index) => {
    const pageUrl = normalizeFacebookPageUrl(url);
    const label = name?.trim();
    return pageUrl && label ? [{ id: id ?? String(index), name: label, url: pageUrl }] : [];
  });

  const orgJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: contact.brandName,
    url: siteUrl,
    description: contact.tagline,
  };
  if (contact.hotline) orgJsonLd.telephone = contact.hotline;
  if (contact.email) orgJsonLd.email = contact.email;
  if (contact.address) {
    orgJsonLd.address = {
      '@type': 'PostalAddress',
      streetAddress: contact.address,
      addressCountry: 'VN',
    };
  }

  return (
    <div className="home-page">
      <JsonLd data={orgJsonLd} />

      <div className="site-shell home-layout">
        <div className="home-entry">
          <div className="home-discovery">
            <HomeBanner categories={categories} />
            <HomeCategoryShortcuts categories={categories} />
          </div>

          <HomeServiceStrip contact={contact} />

          <HomeProductSelection zaloUrl={contact.zaloUrl} />

          <HomeCategoryShelves settings={settings} categories={categories} />

          <HomePromotions items={settings?.homePromotions} />
        </div>

        <aside aria-labelledby="home-advice-heading" className="home-advice">
          <h2 id="home-advice-heading">Cần tư vấn chọn bao bì?</h2>
          <Link href="/lien-he#bao-gia" className="home-more">
            Nhận tư vấn <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Image src="/images/home/advice-bowl.webp" width={360} height={240} sizes="(min-width: 64rem) 120px, 32vw" alt="" />
        </aside>

        <section aria-labelledby="home-blog-heading" className="home-posts">
          <div className="home-section-heading">
            <h2 id="home-blog-heading">Kinh nghiệm chọn bao bì</h2>
            <Link href="/blog" className="home-more">
              Xem blog <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          {latestPosts.docs.length ? (
            <div className="home-stories">
              {latestPosts.docs.map((post, index) => (
                <PostCard key={post.id} post={post} variant={index === 0 ? 'feature' : 'brief'} />
              ))}
            </div>
          ) : (
            <p className="home-empty">Chưa có bài viết nào được xuất bản.</p>
          )}
        </section>

        {facebookPages.length > 0 && <FacebookFanpages pages={facebookPages} />}
      </div>

      <section aria-labelledby="home-quote-heading" className="site-shell home-quote">
        <div>
          <h2 id="home-quote-heading">Cần báo giá theo số lượng?</h2>
          <Link href="/lien-he#bao-gia" className="home-quote-button">Yêu cầu báo giá</Link>
        </div>
      </section>
    </div>
  );
}
