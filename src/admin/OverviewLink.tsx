'use client';

import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function OverviewLink({ href }: { href: string }) {
  return (
    <Link className="workspace-overview-link" href={href} aria-current={usePathname() === href ? 'page' : undefined}>
      <span className="workspace-tile-icon"><LayoutDashboard size={16} aria-hidden /></span>
      Việc hôm nay
    </Link>
  );
}
