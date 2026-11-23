import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ProductCategory, SiteSetting } from '@/payload-types';
import { resolveHomeCategoryShelves, shelfPages } from '@/lib/home-category-shelves';
import { getHomeCategoryShelfCached } from '@/lib/queries';
import { publicContentPath } from '@/lib/slug';
import { MediaImage } from './MediaImage';
import { HomeCategorySlider, HomeCategorySliderGroup } from './HomeCategorySlider';

export async function HomeCategoryShelves({ settings, categories }: { settings: SiteSetting | null; categories: ProductCategory[] }) {
  const shelves = await Promise.all(resolveHomeCategoryShelves(settings, categories).map(async entry => ({
    ...entry, ...await getHomeCategoryShelfCached(entry.category.id),
  })));
  const populated = shelves.filter(shelf => shelf.products.length > 0);
  if (!populated.length) return null;

  return (
    <section className="home-shelves" aria-labelledby="home-shelves-heading" id="ke-danh-muc">
      <HomeCategorySliderGroup
        canRotate={populated.some(shelf => shelf.products.length >= 4)}
        heading={(
          <div className="home-shop-heading">
            <h2 id="home-shelves-heading">Khám phá từng danh mục</h2>
            <p>Tìm thêm mẫu trong từng nhóm bao bì.</p>
          </div>
        )}
      >
        {populated.map(({ category, title, products, totalDocs }) => (
          <article className="home-shelf" key={category.id}>
            <header className="home-shelf-heading">
              <h3><Link href={publicContentPath('product-categories', category.slug)}>{title}</Link></h3>
              <p>{totalDocs} sản phẩm</p>
            </header>
            <HomeCategorySlider label={title}>
              {shelfPages(products).map((page, index) => (
                <ul className="home-shelf-products" key={index}>
                  {page.map(product => (
                    <li key={product.id}>
                      <Link href={publicContentPath('products', product.slug)} prefetch={false} className="home-shelf-product">
                        <span className="home-shelf-photo"><MediaImage media={product.images?.[0]?.image} prefer="thumbnail" fallbackTitle="" sizes="72px" /></span>
                        <span className="home-shelf-product-copy">
                          <span className="home-shelf-product-name">{product.name}</span>
                          <span className="home-shelf-packaging">{product.packagingSpec}</span>
                          {product.minOrderQty ? <span className="home-shelf-moq">Từ {product.minOrderQty.toLocaleString('vi-VN')} {product.minOrderUnit || 'thùng'}</span> : <span className="home-shelf-moq">Liên hệ báo giá sỉ</span>}
                        </span>
                        <ArrowUpRight className="home-shelf-product-arrow" size={15} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </HomeCategorySlider>
          </article>
        ))}
      </HomeCategorySliderGroup>
    </section>
  );
}
