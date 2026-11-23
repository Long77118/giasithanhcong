import React from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { MessageCircle, Phone } from 'lucide-react';
import { getPublishedProductBySlug, getPublishedSlugRedirect, getSiteSettingsCached } from '@/lib/queries';
import { getSiteUrl, isIndexingAllowed } from '@/lib/seo';
import { resolveOpenGraphImages } from '@/lib/seo-images';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';
import { ContactInformation } from '@/components/ContactInformation';
import { ContactMap } from '@/components/ContactMap';
import { JsonLd } from '@/components/JsonLd';
import { buildContactPageJsonLd, getContactPageDetails, resolveContactProduct } from '@/lib/contact-page';
import { normalizeContactMapEmbedUrl } from '@/lib/contact-map';
import type { PublicSearchParams } from '@/lib/slug';
import './contact.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const indexingAllowed = isIndexingAllowed();
  const { settings, contact } = await getSiteSettingsCached();

  const title = `Liên hệ & nhận báo giá sỉ | ${contact.brandName}`;
  const description = `Liên hệ ${contact.brandName} để trao đổi nhu cầu, quy cách và nhận báo giá theo số lượng.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/lien-he` },
    robots: {
      index: indexingAllowed,
      follow: indexingAllowed,
    },
    openGraph: {
      images: resolveOpenGraphImages(siteUrl, settings?.defaultOgImage),
      type: 'website',
      url: `${siteUrl}/lien-he`,
      title,
      description,
    },
  };
}

export default async function ContactPage({ searchParams }: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const { product, redirectTo } = await resolveContactProduct(
    await searchParams, getPublishedProductBySlug, slug => getPublishedSlugRedirect('products', slug),
  );
  if (redirectTo) permanentRedirect(redirectTo);

  const siteUrl = getSiteUrl();
  const { contact, settings } = await getSiteSettingsCached();
  const { phones, hasDetails, address, directionsHref } = getContactPageDetails(contact);
  const mapEmbedUrl = normalizeContactMapEmbedUrl(settings?.contactMapEmbedUrl);
  const phone = phones[0];

  return (
    <div className="contact-page"><div className="site-shell contact-page-inner">
      <JsonLd data={buildContactPageJsonLd(siteUrl, contact)} />
      <Breadcrumbs
        siteUrl={siteUrl}
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Liên hệ & Báo giá', href: '/lien-he' },
        ]}
      />

      <div className="contact-intro">
        <h1>Liên hệ & nhận báo giá sỉ</h1>
        <p>Chia sẻ sản phẩm và số lượng bạn cần, bên mình sẽ tư vấn quy cách và báo giá phù hợp.</p>
      </div>

      {(phone || contact.zaloUrl) && <nav className="contact-quick" aria-label="Liên hệ nhanh">
        {phone && <a className="contact-button contact-button--green" href={phone.href}><Phone size={18} aria-hidden="true" />Gọi tư vấn</a>}
        {contact.zaloUrl && <a className="contact-button contact-button--amber" href={contact.zaloUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" />Nhắn Zalo</a>}
      </nav>}

      <div className={`contact-layout${hasDetails ? ' contact-layout--with-details' : ''}`}>
        <div className="contact-form-column">
          <QuoteRequestForm key={product?.id ?? 'general'} productId={product?.id} productName={product ? `${product.name} (${product.sku})` : null}
            defaultQuantity={product?.minOrderQty ? `${product.minOrderQty} ${product.minOrderUnit || 'thùng'}` : ''} />
        </div>
        <ContactInformation contact={contact} />
      </div>
      {mapEmbedUrl && address && directionsHref && <ContactMap embedUrl={mapEmbedUrl} address={address}
        brandName={contact.brandName} directionsHref={directionsHref} />}
    </div></div>
  );
}
