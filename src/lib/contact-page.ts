import type { ResolvedContactConfig } from './contact';
import { getHeaderContact } from './header';
import { isValidPublicSlug } from './slug';

export function contactProductSlug(value: string | string[] | undefined) {
  return isValidPublicSlug(value) ? value : null;
}

export function getContactPageDetails(contact: ResolvedContactConfig) {
  const { phones, email } = getHeaderContact(contact);
  const address = contact.address?.trim() || null;
  const workingHours = contact.workingHours?.trim() || null;
  return {
    phones, email, address, workingHours,
    directionsHref: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null,
    hasDetails: Boolean(phones.length || email || address || workingHours || contact.zaloUrl),
  };
}

export function buildContactPageJsonLd(siteUrl: string, contact: ResolvedContactConfig) {
  const { phones, email, address, workingHours } = getContactPageDetails(contact);
  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    name: contact.brandName,
    url: siteUrl,
  };
  if (phones.length) organization.telephone = phones.map((phone) => phone.label);
  if (email) organization.email = email;
  if (address) organization.address = address;
  // Free-form CMS hours are not a machine-readable OpeningHoursSpecification.
  if (workingHours) organization.description = `Giờ làm việc: ${workingHours}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${siteUrl}/lien-he#contact-page`,
    url: `${siteUrl}/lien-he`,
    name: `Liên hệ & nhận báo giá sỉ | ${contact.brandName}`,
    mainEntity: organization,
  };
}
