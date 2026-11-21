import { FileDown } from 'lucide-react';
import type { Post, Product } from '@/payload-types';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getPublishedCategoriesCached, getRelatedPublishedProducts } from '@/lib/queries';
import { buildProductJsonLd, buildVideoJsonLd } from '@/lib/seo';
import { resolvePublicImageUrl } from '@/lib/seo-images';
import { categoryAncestors } from '@/lib/category-tree';
import { publicContentPath } from '@/lib/slug';
import { availabilityLabels, hasProductDescription, productDocuments, productQuickFacts, productTextItems, productVideos } from '@/lib/product-detail';
import { compactCatalogCardSizes } from '@/lib/storefront-image-sizes';
import { Breadcrumbs } from './Breadcrumbs';
import { LexicalContent } from './LexicalContent';
import { ProductCard } from './ProductCard';
import { PostCard } from './PostCard';
import { ProductGallery, type GalleryImageItem } from './ProductGallery';
import { ProductContactActions } from './ProductContactActions';
import { ProductVideo } from './ProductVideo';
import { QuoteRequestForm } from './QuoteRequestForm';
import { JsonLd } from './JsonLd';
import './product-detail.css';

const orderSteps = [
  'Gửi mã sản phẩm, quy cách và số lượng cần qua Zalo, hotline hoặc form báo giá.',
  'Trao đổi nhu cầu và nhận báo giá theo số lượng đặt hàng.',
  'Xác nhận quy cách, thời gian và địa điểm giao hàng với bộ phận kinh doanh.',
];

export async function ProductDetail({ product, contact, siteUrl, canonical = '', preview = false }: {
  product: Product;
  contact: ResolvedContactConfig;
  siteUrl: string;
  canonical?: string;
  preview?: boolean;
}) {
  const category = typeof product.category === 'object' ? product.category : null;
  const explicitRelated = (product.relatedProducts ?? [])
    .filter((item): item is Product => Boolean(item && typeof item === 'object'))
    .filter((item) => item.status === 'published' && item.id !== product.id);
  const categoryId = category?.id ?? (typeof product.category === 'number' ? product.category : null);
  const [relatedProducts, categories] = await Promise.all([
    explicitRelated.length ? Promise.resolve(explicitRelated) : categoryId ? getRelatedPublishedProducts(categoryId, product.id) : Promise.resolve([]),
    category?.status === 'published' ? getPublishedCategoriesCached() : Promise.resolve([]),
  ]);
  const relatedPosts = (product.relatedPosts ?? [])
    .filter((post): post is Post => Boolean(post && typeof post === 'object'))
    .filter((post) => post.status === 'published');
  const gallery: GalleryImageItem[] = (product.images ?? []).flatMap(({ image, caption }) => {
    if (!image || typeof image !== 'object' || !image.url) return [];
    return [{ url: image.url, width: image.width || 800, height: image.height || 800, alt: image.alt, caption }];
  });
  const specs = (product.specs ?? []).filter((spec) => spec.label.trim() && spec.value.trim());
  const quickFacts = productQuickFacts(specs);
  const benefits = productTextItems(product.benefits);
  const applications = productTextItems(product.applications);
  const faq = (product.faq ?? []).filter((item) => item.question.trim() && item.answer.trim());
  const documents = productDocuments(product.documents, siteUrl);
  const videos = productVideos(product.videos, siteUrl);
  const hasDescription = hasProductDescription(product.description);
  const availability = product.availability ? availabilityLabels[product.availability] : null;
  const breadcrumbCategories = category?.status === 'published' ? [...categoryAncestors(category, categories), category] : [];
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    ...breadcrumbCategories.map((item) => ({ label: item.name, href: publicContentPath('product-categories', item.slug) })),
    { label: product.name, href: publicContentPath('products', product.slug) },
  ];
  const productJsonLd = buildProductJsonLd({
    name: product.name, sku: product.sku, description: product.shortDescription,
    url: canonical, brandName: product.brandName, categoryName: category?.name,
    images: gallery.map((image) => resolvePublicImageUrl(siteUrl, image.url)).filter((url): url is string => Boolean(url)),
  });
  return (
    <article className="site-shell product-page product-detail">
      {!preview && <JsonLd data={productJsonLd} />}
      {!preview && videos.map((video) => <JsonLd key={video.id} data={buildVideoJsonLd({ youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`, title: video.title, description: video.description, thumbnailUrl: video.thumbnail, pageUrl: canonical })!} />)}
      <Breadcrumbs siteUrl={siteUrl} items={breadcrumbItems} structuredData={!preview} />
      <div className="product-detail-top" data-gallery={gallery.length > 0}>
        {gallery.length > 0 && <ProductGallery items={gallery} productName={product.name} />}
        <div className="product-detail-summary">
          <div className="product-detail-identity">
            <span>SKU {product.sku}</span>
            {product.brandName?.trim() && <span>Thương hiệu: {product.brandName}</span>}
          </div>
          <h1>{product.name}</h1>
          {product.shortDescription?.trim() && <p className="product-detail-lead">{product.shortDescription}</p>}
          {quickFacts.length > 0 && (
            <ul className="product-detail-facts" aria-label="Thông số nhìn nhanh">
              {quickFacts.map((spec, index) => <li key={spec.id || index}><span>{spec.label}:</span> {spec.value}</li>)}
            </ul>
          )}
          {availability && <p className="product-detail-availability" data-availability={product.availability}>{availability}</p>}
          <ProductContactActions contact={contact} />
          <a href="#bao-gia" className="product-detail-form-link">Gửi yêu cầu báo giá theo quy cách</a>
          {documents.length > 0 && (
            <details className="product-detail-documents">
              <summary>Tải bảng giá và catalog (PDF)</summary>
              <ul>{documents.map((document) => (
                <li key={document.id}><a href={document.url} target="_blank" rel="noopener noreferrer"><FileDown size={17} aria-hidden="true" />{document.title} (PDF)</a></li>
              ))}</ul>
            </details>
          )}
        </div>
      </div>
      {specs.length > 0 && (
        <section className="product-detail-section" aria-labelledby="product-specs-heading">
          <h2 id="product-specs-heading">Thông số kỹ thuật</h2>
          <div className="product-detail-table-wrap" role="region" tabIndex={0} aria-label="Bảng thông số kỹ thuật, có thể cuộn ngang">
            <table className="product-detail-table"><tbody>
              {product.packagingSpec?.trim() && <tr><th scope="row">Quy cách đóng gói</th><td>{product.packagingSpec}</td></tr>}
              {product.minOrderQty != null && <tr><th scope="row">Số lượng đặt tối thiểu</th><td>{product.minOrderQty} {product.minOrderUnit}</td></tr>}
              {specs.map((spec, index) => <tr key={spec.id || index}><th scope="row">{spec.label}</th><td>{spec.value}</td></tr>)}
            </tbody></table>
          </div>
        </section>
      )}
      {(hasDescription || benefits.length > 0 || applications.length > 0) && (
        <section className="product-detail-section" aria-labelledby="product-description-heading">
          <h2 id="product-description-heading">Mô tả sản phẩm</h2>
          {hasDescription && <div className="product-detail-description"><LexicalContent data={product.description} headingTag="h3" hideUnavailable /></div>}
          {(benefits.length > 0 || applications.length > 0) && (
            <div className="product-detail-lists">
              {benefits.length > 0 && <div><h3>Ưu điểm</h3><ul>{benefits.map((text, index) => <li key={index}>{text}</li>)}</ul></div>}
              {applications.length > 0 && <div><h3>Ứng dụng</h3><ul>{applications.map((text, index) => <li key={index}>{text}</li>)}</ul></div>}
            </div>
          )}
        </section>
      )}
      <section className="product-detail-section" aria-labelledby="product-order-heading">
        <h2 id="product-order-heading">Cách đặt hàng sỉ</h2>
        <ol className="product-detail-steps">
          {orderSteps.map((step, index) => <li key={step}><span className="product-detail-step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}
        </ol>
      </section>
      {videos.length > 0 && (
        <section className="product-detail-section" aria-labelledby="product-videos-heading">
          <h2 id="product-videos-heading">Video sản phẩm</h2>
          <div className="product-detail-videos">{videos.map((video) => (
            <div className="product-detail-video" key={video.id}>
              <ProductVideo videoId={video.videoId} title={video.title} thumbnail={video.thumbnail} thumbnailAlt={video.thumbnailAlt} />
              <div><h3>{video.title}</h3><p>{video.description}</p></div>
            </div>
          ))}</div>
        </section>
      )}
      {faq.length > 0 && (
        <section className="product-detail-section product-detail-faq" aria-labelledby="product-faq-heading">
          <h2 id="product-faq-heading">Câu hỏi thường gặp</h2>
          {faq.map((item, index) => <details key={item.id || index}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </section>
      )}
      <div className="product-detail-quote">
        {preview ? (
          <section id="bao-gia" className="preview-quote-notice">
            <h2>Yêu cầu báo giá</h2>
            <p>Form báo giá được tắt trong chế độ xem trước. Không có yêu cầu nào được gửi từ đây.</p>
          </section>
        ) : (
          <QuoteRequestForm productId={product.id} productName={`${product.name} (${product.sku})`} defaultQuantity={product.minOrderQty ? `${product.minOrderQty} ${product.minOrderUnit || 'thùng'}` : ''} />
        )}
      </div>
      {relatedProducts.length > 0 && (
        <section className="product-detail-related" aria-labelledby="product-related-heading">
          <h2 id="product-related-heading">Sản phẩm liên quan</h2>
          <div className="catalog-grid">{relatedProducts.map((related) => <ProductCard key={related.id} product={related} sizes={compactCatalogCardSizes} variant="catalog" />)}</div>
        </section>
      )}
      {relatedPosts.length > 0 && (
        <section className="product-detail-related" aria-labelledby="product-posts-heading">
          <h2 id="product-posts-heading">Bài viết liên quan</h2>
          <div className="product-detail-posts">{relatedPosts.map((post) => <PostCard key={post.id} post={post} />)}</div>
        </section>
      )}
      <ProductContactActions contact={contact} mobile />
    </article>
  );
}
