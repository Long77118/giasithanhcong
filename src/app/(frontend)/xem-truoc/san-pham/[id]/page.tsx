import type { Metadata } from 'next';
import { ProductDetail } from '@/components/ProductDetail';
import { PreviewBanner } from '@/components/PreviewBanner';
import { requirePreviewProduct } from '@/lib/preview-server';
import { getSiteSettingsCached } from '@/lib/queries';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requirePreviewProduct((await params).id);
  return {
    title: 'Xem trước sản phẩm',
    robots: { index: false, follow: false },
    alternates: null,
    openGraph: null,
  };
}

export default async function ProductPreviewPage({ params }: Props) {
  const product = await requirePreviewProduct((await params).id);
  const { contact } = await getSiteSettingsCached();
  return (
    <>
      <PreviewBanner collection="products" id={product.id} status={product.status} />
      <ProductDetail product={product} contact={contact} siteUrl={getSiteUrl()} preview />
    </>
  );
}
