import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SiteSetting } from '@/payload-types';
import { normalizeHomePromotionHref } from '@/lib/home-promotions';
import { resolveMediaUrl } from './MediaImage';

export function HomePromotions({ items }: { items: SiteSetting['homePromotions'] }) {
  const banners = (items ?? []).flatMap((item) => {
    const href = normalizeHomePromotionHref(item.url);
    const image = resolveMediaUrl(item.image, 'original');
    const title = item.title?.trim();
    if (item.enabled === false || !href || !image.url || !title) return [];
    return [{ ...item, href, image: { ...image, url: image.url }, title }];
  }).slice(0, 4);
  if (!banners.length) return null;

  return (
    <section className="home-promotions" aria-labelledby="home-promotions-heading">
      <h2 id="home-promotions-heading" className="sr-only">Bao bì theo nhu cầu</h2>
      <div className="home-promotions-grid">
        {banners.map((banner, index) => (
          <Link
            key={banner.id ?? index}
            href={banner.href}
            prefetch={false}
            className={`home-promotion home-promotion-${banner.tone ?? 'mint'}`}
          >
            <div className="home-promotion-content">
              <h3>{banner.title}</h3>
              {banner.description && <p>{banner.description}</p>}
              <span className="home-promotion-action">
                {banner.buttonLabel?.trim() || 'Xem sản phẩm'} <ArrowRight size={16} aria-hidden="true" />
              </span>
            </div>
            <Image
              src={banner.image.url}
              width={banner.image.width}
              height={banner.image.height}
              sizes="(min-width: 64rem) 15vw, 32vw"
              alt=""
              className="home-promotion-image"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
