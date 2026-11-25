import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getHomeProductSelectionCached } from '@/lib/queries';
import { HomeProductTabs } from './HomeProductTabs';
import { ProductChoiceCard } from './ProductChoiceCard';

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
              <div className="product-choice-grid">
                {group.products.map(product => <ProductChoiceCard key={product.id} product={product} zaloUrl={zaloUrl} />)}
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
