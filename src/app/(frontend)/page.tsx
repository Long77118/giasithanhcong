import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import {
  getFeaturedProductsCached,
  getPublishedCategoriesCached,
  getPublishedPosts,
  getSiteSettingsCached,
} from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { MediaImage } from '@/components/MediaImage';
import { ProductCard } from '@/components/ProductCard';
import { PostCard } from '@/components/PostCard';
import { ContactActions } from '@/components/ContactActions';

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
  const [{ settings, contact }, categories, featuredProducts, latestPosts] =
    await Promise.all([
      getSiteSettingsCached(),
      getPublishedCategoriesCached(),
      getFeaturedProductsCached(6),
      getPublishedPosts({ page: 1, limit: 4 }),
    ]);

  const topCategories = categories.filter((c) => !c.parent).slice(0, 4);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Section 1: Wholesale Storefront Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#B45309]">
                Nguồn hàng sỉ bao bì thực phẩm & đồ uống
              </p>
              <h1 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-[#0C2340] text-balance sm:text-4xl lg:text-[2.75rem]">
                Tổng kho sỉ ly nhựa, hộp thực phẩm và bao bì giấy dùng một lần
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                {contact.tagline}
              </p>

              {/* Quick Catalog Search Bar */}
              <form
                action="/san-pham"
                method="GET"
                role="search"
                aria-label="Tìm kiếm sản phẩm bán sỉ"
                className="mt-6 flex w-full max-w-lg flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2"
              >
                <div className="relative w-full min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    name="q"
                    aria-label="Nhập tên sản phẩm hoặc mã SKU"
                    placeholder="Tìm tên sản phẩm hoặc mã SKU..."
                    className="min-h-[46px] w-full rounded-lg border border-slate-300 bg-slate-50 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[46px] w-full shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163861] sm:w-auto"
                >
                  Tìm sản phẩm
                </button>
              </form>

              <div className="mt-6">
                <ContactActions contact={contact} quoteHref="/lien-he#bao-gia" />
              </div>

              <p className="mt-5 text-xs text-slate-500">
                {contact.sampleNotice}
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <MediaImage
                  media={settings?.defaultOgImage ?? null}
                  prefer="hero"
                  priority
                  fallbackTitle="Kho trưng bày sản phẩm bao bì bán sỉ"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 4 Core Wholesale Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0C2340] sm:text-3xl">
              Danh mục ngành hàng chủ lực
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Tra cứu nhanh theo nhóm sản phẩm đóng gói cho quán cà phê, nhà hàng và đại lý.
            </p>
          </div>
          <Link
            href="/san-pham"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
          >
            <span>Xem toàn bộ danh mục</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {topCategories.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có danh mục sản phẩm nào được xuất bản.
          </div>
        ) : (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/danh-muc/${cat.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <MediaImage
                    media={cat.image}
                    prefer="card"
                    fallbackTitle={cat.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-[#0C2340]">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {cat.description}
                    </p>
                  )}
                  <span className="mt-auto pt-3 text-xs font-semibold text-[#B45309]">
                    Xem sản phẩm →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Featured Wholesale Products */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0C2340] sm:text-3xl">
                Sản phẩm bán sỉ tiêu biểu
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Thông số kích thước, quy cách đóng thùng và số lượng đặt tối thiểu rõ ràng.
              </p>
            </div>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
            >
              <span>Tất cả sản phẩm</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Hiện chưa có sản phẩm nào được xuất bản.
            </div>
          ) : (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Packaging Blog & Guides */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0C2340] sm:text-3xl">
              Kinh nghiệm chọn bao bì & Vận hành
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Hướng dẫn phân biệt chất liệu nhựa PET, PP, HDPE và tính định mức nhập kho.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C2340] hover:text-[#B45309] hover:underline"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {latestPosts.docs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có bài viết nào được xuất bản.
          </div>
        ) : (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestPosts.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Direct Wholesale Inquiry CTA */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-[#0C2340]">
                Cần bảng giá sỉ theo số lượng hoặc đặt hàng định kỳ?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Gửi danh sách mã sản phẩm và sản lượng dự kiến qua form báo giá hoặc trao đổi trực tiếp qua Hotline/Zalo của bộ phận kinh doanh.
              </p>
            </div>
            <div className="shrink-0">
              <ContactActions contact={contact} quoteHref="/lien-he#bao-gia" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
