import type { ResolvedContactConfig } from './contact';

export const headerLinks = [
  { label: 'Sản phẩm', href: '/san-pham' },
  { label: 'Tin tức', href: '/blog' },
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Liên hệ', href: '/lien-he' },
];

export function isHeaderLinkCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
    || (href === '/san-pham' && pathname.startsWith('/danh-muc/'));
}

export function splitHeaderBrand(brandName: string) {
  const name = brandName.trim();
  const match = /^(Công\s+Ty)\s+(.+)$/iu.exec(name);
  return match ? { prefix: match[1], name: match[2] } : { prefix: null, name };
}

export function getHeaderContact(contact: ResolvedContactConfig) {
  const phones = [
    { label: contact.hotline, href: contact.telHref },
    { label: contact.secondaryHotline, href: contact.secondaryTelHref },
  ].filter((phone): phone is { label: string; href: string } => Boolean(phone.label && phone.href));
  return {
    phones: phones.filter((phone, index) => phones.findIndex(other => other.href === phone.href) === index),
    email: contact.email,
    quoteHref: contact.zaloUrl || '/lien-he#bao-gia',
    quoteExternal: Boolean(contact.zaloUrl),
  };
}

export type HeaderContact = ReturnType<typeof getHeaderContact>;
export interface HeaderFeaturedProduct { name: string; href: string }

export function groupHeaderCategories<T extends { depth: number }>(items: T[]) {
  const groups: { root: T; children: T[] }[] = [];
  for (const item of items) {
    const group = groups.at(-1);
    if (item.depth === 0) groups.push({ root: item, children: [] });
    else if (item.depth === 1 && group && group.children.length < 3) group.children.push(item);
  }
  return groups;
}
