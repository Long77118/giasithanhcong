import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ResolvedContactConfig } from '@/lib/contact';
import { getContactPageDetails } from '@/lib/contact-page';

export function ContactInformation({ contact }: { contact: ResolvedContactConfig }) {
  const { phones, email, address, workingHours, directionsHref, hasDetails } = getContactPageDetails(contact);
  if (!hasDetails) return null;
  return <aside className="contact-sidebar" aria-label="Thông tin liên hệ">
    {contact.zaloUrl && <section className="contact-tile contact-zalo" aria-labelledby="contact-zalo-heading">
      <MessageCircle className="contact-zalo-symbol" size={40} strokeWidth={1.5} aria-hidden="true" />
      <h2 id="contact-zalo-heading">Trao đổi trực tiếp<br />qua Zalo</h2>
      <p>Gửi hình ảnh hoặc quy cách để bên mình tư vấn mẫu phù hợp.</p>
      <nav aria-label="Tư vấn qua Zalo"><a className="contact-button contact-button--amber" href={contact.zaloUrl}
        target="_blank" rel="noopener noreferrer">Nhắn Zalo tư vấn<ArrowUpRight size={18} aria-hidden="true" /></a></nav>
    </section>}

    {(phones.length > 0 || email) && <nav className="contact-tile contact-channel-list" aria-label="Điện thoại và email">
      {phones.map((phone, index) => <a key={phone.href} href={phone.href} className="contact-channel">
        <span className="contact-channel-icon"><Phone size={20} aria-hidden="true" /></span>
        <span className="contact-channel-copy"><span className="contact-label">{phones.length > 1 ? `Điện thoại ${index + 1}` : 'Điện thoại'}</span><strong>{phone.label}</strong></span>
        <ArrowUpRight className="contact-channel-arrow" size={19} aria-hidden="true" />
      </a>)}
      {email && <a href={`mailto:${email}`} className="contact-channel contact-channel--email">
        <span className="contact-channel-icon"><Mail size={20} aria-hidden="true" /></span>
        <span className="contact-channel-copy"><span className="contact-label">Email</span><strong>{email}</strong></span>
        <ArrowUpRight className="contact-channel-arrow" size={19} aria-hidden="true" />
      </a>}
    </nav>}

    {(address || workingHours) && <section className="contact-tile contact-location" aria-label="Địa chỉ và giờ làm việc">
      <dl>
        {address && <div><dt><MapPin size={18} aria-hidden="true" />Địa chỉ</dt><dd>{address}</dd></div>}
        {workingHours && <div><dt><Clock3 size={18} aria-hidden="true" />Giờ làm việc</dt><dd>{workingHours}</dd></div>}
      </dl>
      {directionsHref && <nav aria-label="Đường đi"><a className="contact-button contact-button--green" href={directionsHref}
        target="_blank" rel="noopener noreferrer">Chỉ đường<ArrowUpRight size={18} aria-hidden="true" /></a></nav>}
    </section>}
  </aside>;
}
