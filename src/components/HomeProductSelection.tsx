import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import type { Product } from '@/payload-types';
import { getHomeProductSelectionCached } from '@/lib/queries';
import { publicContentPath } from '@/lib/slug';
import { MediaImage } from './MediaImage';
import { HomeProductTabs } from './HomeProductTabs';
import { HomeProductReveal } from './HomeProductReveal';

const cardSizes = '(min-width: 90rem) 261px, (min-width: 64rem) calc(20vw - 32px), (min-width: 40rem) calc(33.333vw - 28px), calc(50vw - 28px)';

type SelectionProduct = Pick<Product, 'name' | 'slug' | 'specs' | 'images' | 'featured' | 'packagingSpec' | 'minOrderQty' | 'minOrderUnit'>;

function SelectionCard({ product, zaloUrl }: { product: SelectionProduct; zaloUrl: string | null }) {
  const path = publicContentPath('products', product.slug);
  const facts = product.specs?.filter(spec => /^(dung tích|chất liệu|chất liệu thân)$/i.test(spec.label.trim()) && spec.value.trim()).slice(0, 2);
  return (
    <HomeProductReveal name={product.name} href={path} image={(
        <MediaImage
          media={product.images?.[0]?.image}
          prefer="card"
          fallbackTitle={product.name}
          sizes={cardSizes}
          className="home-choice-image"
        />
    )}>
      {Boolean(facts?.length) && <p className="home-choice-facts">{facts?.map(spec => spec.value).join(' / ')}</p>}
      <div className="home-choice-wholesale">
        <p>{product.packagingSpec}</p>
        {product.minOrderQty ? (
          <p>Tối thiểu <strong>{product.minOrderQty.toLocaleString('vi-VN')} {product.minOrderUnit || 'thùng'}</strong></p>
        ) : null}
      </div>
      <div className="home-choice-contact">
        <Link href={path} className="home-choice-detail" aria-label={`Xem chi tiết ${product.name}`} prefetch={false}>
          Chi tiết <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <a
          href={zaloUrl || `${path}#bao-gia`}
          className="home-choice-zalo"
          target={zaloUrl ? '_blank' : undefined}
          rel={zaloUrl ? 'noopener noreferrer' : undefined}
          aria-label={`${zaloUrl ? 'Hỏi giá Zalo' : 'Yêu cầu báo giá'}: ${product.name}`}
        >
          <MessageCircle size={14} aria-hidden="true" />
          {zaloUrl ? 'Zalo' : 'Báo giá'}
        </a>
      </div>
    </HomeProductReveal>
  );
}

export async function HomeProductSelection({ zaloUrl }: { zaloUrl: string | null }) {
  const groups = await getHomeProductSelectionCached();
  return (
    <section aria-labelledby="home-shop-heading" className="home-shop" id="chon-bao-bi">
      <div className="home-shop-heading">
        <h2 id="home-shop-heading">Chọn bao bì hợp với quán</h2>
        <p>Từ ly nước đến hộp mang đi, tìm mẫu phù hợp với món bạn bán.</p>
      </div>
      <HomeProductTabs tabs={groups.map(group => ({
        id: group.id,
        label: group.label,
        content: (
          <>
            {group.products.length ? (
              <div className="home-shop-grid">
                {group.products.map(product => <SelectionCard key={product.id} product={product} zaloUrl={zaloUrl} />)}
              </div>
            ) : (
              <div className="home-shop-empty">
                <p>Chưa có mẫu trong nhóm này. Nhắn mình để được tư vấn bao bì phù hợp.</p>
                <Link href="/lien-he#bao-gia">Nhận tư vấn chọn mẫu</Link>
              </div>
            )}
            <div className="home-shop-footer">
              <p>Hiển thị {group.products.length} / {group.totalDocs} sản phẩm</p>
              <Link href="/san-pham">Xem tất cả sản phẩm <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </>
        ),
      }))} />
    </section>
  );
}
