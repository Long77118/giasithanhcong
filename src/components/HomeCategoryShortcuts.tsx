import Image from 'next/image';
import Link from 'next/link';
import type { ProductCategory } from '@/payload-types';
import { publicContentPath } from '@/lib/slug';
import { getHomeShortcutProductCountCached } from '@/lib/queries';
import { getHomeCategoryArtwork, homeProductShortcuts } from '@/lib/home-catalog';
import { HomeCarousel } from './HomeCarousel';
import { CategoryIcon } from './ProductCategoryMenu';

export async function HomeCategoryShortcuts({ categories }: { categories: ProductCategory[] }) {
  const entries = [
    ...categories.filter((category) => !category.parent).map((category) => {
      const artwork = getHomeCategoryArtwork(category);
      return {
        label: artwork.label,
        href: publicContentPath('product-categories', category.slug),
        filter: { categorySlug: category.slug },
        image: artwork.url,
      };
    }),
    ...homeProductShortcuts.map((shortcut) => ({
      label: shortcut.label,
      href: `/san-pham?${new URLSearchParams({ q: shortcut.query })}`,
      filter: { q: shortcut.query },
      image: `/images/home/${shortcut.image}.webp`,
    })),
  ];
  const items = (await Promise.all(entries.map(async (entry) => ({
    ...entry,
    count: await getHomeShortcutProductCountCached(entry.filter),
  })))).filter((entry) => entry.count > 0);
  if (!items.length) return null;

  return (
    <div className="home-category-shortcuts" id="home-category-heading">
      <h2 className="sr-only">Danh mục sản phẩm</h2>
      <HomeCarousel label="Danh mục sản phẩm" variant="categories">
        {items.map((item) => (
          <Link key={item.href} href={item.href} prefetch={false} className="home-category-link">
            <span className="home-category-photo" aria-hidden="true">
              {item.image ? (
                <Image src={item.image} width={640} height={640} sizes="(min-width: 40rem) 148px, 113px" alt="" />
              ) : (
                <CategoryIcon href={item.href} />
              )}
            </span>
            <span className="home-category-name">{item.label}</span>
            <span className="home-category-count">{item.count} sản phẩm</span>
          </Link>
        ))}
      </HomeCarousel>
    </div>
  );
}
