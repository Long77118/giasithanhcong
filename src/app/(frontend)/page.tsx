import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  getPublishedCategoriesCached,
  getPublishedPosts,
  getSiteSettingsCached,
} from '@/lib/queries';
import { buildOrganizationJsonLd, getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { normalizeFacebookPageUrl } from '@/lib/facebook-page';
import { homeNewsCategoryTones } from '@/lib/home-news';
import { homeNewsCoverSizes } from '@/lib/storefront-image-sizes';
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
      getPublishedPosts({ page: 1, limit: 5 }),
    ]);

  const facebookPages = (settings?.facebookPages ?? []).flatMap(({ id, name, url }, index) => {
    const pageUrl = normalizeFacebookPageUrl(url);
    const label = name?.trim();
    return pageUrl && label ? [{ id: id ?? String(index), name: label, url: pageUrl }] : [];
  });
  const categoryTones = homeNewsCategoryTones(latestPosts.docs.flatMap(({ category }) =>
    category && typeof category === 'object' ? [category.id] : [],
  ));
  const [leadStory, ...otherStories] = latestPosts.docs.map((post, index, posts) => (
    <PostCard
      key={post.id}
      post={post}
      variant={index === 0 ? 'feature' : 'brief'}
      sizes={homeNewsCoverSizes(posts.length, index)}
      categoryTone={post.category && typeof post.category === 'object' ? categoryTones.get(post.category.id) : undefined}
    />
  ));

  return (
    <div className="home-page">
      <JsonLd data={buildOrganizationJsonLd(siteUrl, contact)} />

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

        <section aria-labelledby="home-blog-heading" className="home-posts">
          <div className="home-section-heading">
            <h2 id="home-blog-heading">Kinh nghiệm chọn bao bì</h2>
            <Link href="/blog" className="home-more home-posts-more">
              Xem tất cả bài viết <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          {leadStory ? (
            <div className="home-stories" data-count={latestPosts.docs.length}>
              {leadStory}
              {otherStories.length > 0 && <div className="home-stories-secondary">{otherStories}</div>}
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
