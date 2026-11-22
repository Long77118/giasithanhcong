import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { HeaderContact } from '@/lib/header';

export function HeaderContactDetails({ contact }: { contact: HeaderContact }) {
  return (
    <>
      {contact.phones.length > 0 && (
        <nav aria-label="Điện thoại tư vấn" className="site-header-contact site-header-phones">
          <span className="site-header-contact-icon"><Phone size={18} aria-hidden="true" /></span>
          <div>{contact.phones.map(phone => <a key={phone.href} href={phone.href}>{phone.label}</a>)}</div>
        </nav>
      )}
      {contact.email && (
        <nav aria-label="Email tư vấn" className="site-header-contact site-header-email">
          <span className="site-header-contact-icon"><Mail size={18} aria-hidden="true" /></span>
          <a href={`mailto:${contact.email}`} title={contact.email}><span>Email</span><strong>{contact.email}</strong></a>
        </nav>
      )}
    </>
  );
}

export function HeaderQuoteLink({ contact, short = false, onClick }: {
  contact: HeaderContact; short?: boolean; onClick?: () => void;
}) {
  return (
    <a href={contact.quoteHref} className="site-header-quote" onClick={onClick}
      target={contact.quoteExternal ? '_blank' : undefined} rel={contact.quoteExternal ? 'noopener noreferrer' : undefined}>
      <MessageCircle size={18} aria-hidden="true" />
      {short ? 'Báo giá Zalo' : 'Báo giá qua Zalo'}
    </a>
  );
}

export function HeaderContactButtons({ contact, onClick }: { contact: HeaderContact; onClick?: () => void }) {
  return (
    <>
      {contact.phones[0] && <a href={contact.phones[0].href} className="site-header-call" onClick={onClick}><Phone size={18} aria-hidden="true" />Gọi</a>}
      <HeaderQuoteLink contact={contact} short onClick={onClick} />
    </>
  );
}
