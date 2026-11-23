import { MessageCircle, Stamp, Tags, Truck } from 'lucide-react';
import type { ResolvedContactConfig } from '@/lib/contact';

export function HomeServiceStrip({ contact }: { contact: ResolvedContactConfig }) {
  const items = [
    {
      title: 'Báo giá theo số lượng',
      description: 'Tư vấn giá theo đơn hàng',
      icon: Tags,
      tone: 'price',
      href: '/lien-he#bao-gia',
    },
    {
      title: 'Nhắn Zalo nhận giá',
      description: 'Trao đổi nhanh mẫu cần tìm',
      icon: MessageCircle,
      tone: 'zalo',
      href: contact.zaloUrl || '/lien-he#bao-gia',
      external: Boolean(contact.zaloUrl),
    },
    {
      title: 'Giao hàng',
      description: 'Hỏi khu vực và thời gian giao',
      icon: Truck,
      tone: 'delivery',
      href: '/lien-he',
    },
    {
      title: 'In logo theo yêu cầu',
      description: 'Liên hệ tư vấn phương án in',
      icon: Stamp,
      tone: 'print',
      href: '/lien-he#bao-gia',
    },
  ];

  return (
    <section className="home-service-strip" aria-label="Thông tin mua sỉ">
      <ul>
        {items.map(({ title, description, icon: Icon, tone, href, external }) => (
          <li key={title} data-service={tone}>
            <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
              <span className="home-service-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="home-service-title">{title}</span>
              <span className="home-service-description">{description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
