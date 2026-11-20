import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BottleWine, ChevronsDown, CupSoda, Package, ShoppingBag } from 'lucide-react';
import type { ProductCategory } from '@/payload-types';
import { publicContentPath } from '@/lib/slug';
import { getHomeCategoryArtwork } from '@/lib/home-catalog';
import { HomeCarousel } from './HomeCarousel';

export function HomeBanner({ categories }: { categories: ProductCategory[] }) {
  const categorySlides = categories.filter((category) => !category.parent).slice(0, 2);
  const slides = [
    {
      title: 'Bao bì bán sỉ cho',
      highlight: 'quán & cửa hàng',
      eyebrow: 'Ly, hộp, chai và bao bì giấy',
      href: '/san-pham',
      image: '/images/home/packaging-collection.webp',
      width: 1200,
      height: 800,
    },
    ...categorySlides.map((category) => {
      const artwork = getHomeCategoryArtwork(category);
      return {
        title: 'Chọn mẫu phù hợp,',
        highlight: artwork.label.toLocaleLowerCase('vi'),
        eyebrow: 'Bao bì cho đồ uống & thức ăn mang đi',
        href: publicContentPath('product-categories', category.slug),
        image: artwork.url || '/images/home/packaging-collection.webp',
        width: artwork.width,
        height: artwork.height,
      };
    }),
  ];
  const decorations = [CupSoda, Package, ShoppingBag, BottleWine, CupSoda, ShoppingBag, Package, BottleWine];

  return (
    <div className="home-banner-wrap">
      <HomeCarousel label="Banner sản phẩm" variant="banner">
        {slides.map((slide, index) => {
          const Heading = index === 0 ? 'h1' : 'h2';
          return (
            <div className="home-banner" key={slide.href}>
              <div className="home-banner-pattern" aria-hidden="true">
                {decorations.map((Icon, i) => <Icon key={i} strokeWidth={0.6} />)}
              </div>
              <div className="home-banner-copy">
                <span className="home-banner-eyebrow">{slide.eyebrow}</span>
                <Heading id={index === 0 ? 'home-title' : undefined}>{slide.title}<br /><em>{slide.highlight}</em></Heading>
                <div className="home-banner-offer">
                  <Link href={slide.href} className="home-banner-action">
                    Xem sản phẩm <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <span>Báo giá theo số lượng</span>
                </div>
              </div>
              <div className="home-banner-art" aria-hidden="true">
                <Image
                  src={slide.image}
                  width={slide.width}
                  height={slide.height}
                  sizes="(min-width: 105rem) 560px, (min-width: 64rem) 36vw, (min-width: 40rem) 42vw, 80vw"
                  alt=""
                  loading="eager"
                  fetchPriority={index === 0 ? 'high' : 'low'}
                />
              </div>
            </div>
          );
        })}
      </HomeCarousel>
      <svg className="home-banner-contour" viewBox="0 0 360 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0C76 0 96 64 180 64S284 0 360 0Z" />
      </svg>
      <Link href="#home-category-heading" className="home-banner-scroll" aria-label="Xem danh mục sản phẩm">
        <span className="home-banner-scroll-trail" aria-hidden="true" />
        <ChevronsDown size={28} aria-hidden="true" />
      </Link>
    </div>
  );
}
