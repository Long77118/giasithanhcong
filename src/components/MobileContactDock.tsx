import type { HeaderContact } from '@/lib/header';
import { HeaderContactButtons } from './HeaderContactActions';

export function MobileContactDock({ contact }: { contact: HeaderContact }) {
  return <nav aria-label="Liên hệ nhanh" className="site-contact-dock"><HeaderContactButtons contact={contact} /></nav>;
}
